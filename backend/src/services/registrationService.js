import mongoose from 'mongoose';
import {
  Competition,
  Registration,
  REGISTRATION_STATUS,
  ACTIVE_REGISTRATION_STATUSES,
  BLOCKING_REGISTRATION_STATUSES,
  Submission,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { canRegister, canCancelRegistration } from './lifecycle.js';
import { createOrder, verifyCheckoutSignature } from './paymentService.js';

const REGISTRATION_ERRORS = {
  COMPETITION_NOT_PUBLISHED: [409, 'This competition is not open for registration'],
  REGISTRATION_NOT_OPEN: [409, 'Registration has not opened yet'],
  REGISTRATION_CLOSED: [409, 'Registration has closed'],
  COMPETITION_FULL: [409, 'All spots have been booked'],
  CANCELLATION_WINDOW_CLOSED: [409, 'Registration can no longer be cancelled'],
};

const ruleError = (code) => {
  const [status, message] = REGISTRATION_ERRORS[code] ?? [409, 'Action not allowed'];
  return new AppError(status, code, message);
};

const isDuplicateKey = (err) => err?.code === 11000;

/**
 * Atomically claims one spot. The filter re-checks every business rule
 * (published, inside registration window, capacity available) INSIDE the
 * same document operation as the increment, so two requests racing for the
 * last spot can never both succeed. Returns the updated competition or null.
 */
async function claimSpot(competitionId, now) {
  return Competition.findOneAndUpdate(
    {
      _id: competitionId,
      status: 'published',
      'schedule.registrationOpensAt': { $lte: now },
      'schedule.registrationClosesAt': { $gt: now },
      $expr: { $lt: ['$capacity.booked', '$capacity.total'] },
    },
    { $inc: { 'capacity.booked': 1 } },
    { new: true }
  );
}

/** Releases a spot, never letting the counter go below zero. */
export async function releaseSpot(competitionId) {
  return Competition.updateOne(
    { _id: competitionId, 'capacity.booked': { $gt: 0 } },
    { $inc: { 'capacity.booked': -1 } }
  );
}

/** Creates the gateway order for a paid registration (real Razorpay or mock). */
async function buildPaymentOrder(competition, registrationId) {
  return createOrder({
    amountPaise: competition.entryFeePaise,
    currency: competition.currency,
    receipt: `reg_${registrationId}`,
    notes: { competitionId: String(competition._id), registrationId: String(registrationId) },
  });
}

/** A `pending` row older than this is considered abandoned (e.g. crash mid-flow). */
const STALE_PENDING_MS = 60 * 1000;

/**
 * Acquires the per-user "slot" by upserting the (competition, user) row into
 * `pending`. The unique index guarantees that, of N concurrent requests from
 * the same user, exactly one passes; the rest fail with E11000. Doing this
 * BEFORE touching capacity means duplicate requests never inflate `booked`,
 * even transiently.
 */
async function acquirePendingRow({ competitionId, userId, now }) {
  const staleBefore = new Date(now.getTime() - STALE_PENDING_MS);
  try {
    return await Registration.findOneAndUpdate(
      {
        competitionId,
        userId,
        $or: [
          { status: { $nin: BLOCKING_REGISTRATION_STATUSES } },
          { status: REGISTRATION_STATUS.PENDING, updatedAt: { $lt: staleBefore } },
        ],
      },
      {
        $set: { status: REGISTRATION_STATUS.PENDING, expiresAt: null, payment: null },
        $setOnInsert: { competitionId, userId },
      },
      { new: true, upsert: true, runValidators: true }
    );
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
    const current = await Registration.findOne({ competitionId, userId }).lean();
    if (current?.status === REGISTRATION_STATUS.CONFIRMED) {
      throw AppError.conflict('ALREADY_REGISTERED', 'You are already registered');
    }
    if (current?.status === REGISTRATION_STATUS.RESERVED && current.expiresAt > now) {
      return { reused: current };
    }
    throw AppError.conflict('REGISTRATION_IN_PROGRESS', 'Registration already in progress');
  }
}

/**
 * Step 1 of registration. Holds a spot for the user:
 *  - free competitions: registration becomes `confirmed` immediately
 *  - paid competitions: registration is `reserved` with a TTL and a payment
 *    order is returned for the client to complete
 *
 * Idempotent: repeating the call while a reservation is live returns the
 * same reservation instead of consuming another spot.
 *
 * Ordering matters for correctness without transactions:
 *   1. de-duplicate the user via the unique index (cheap, no counter touched)
 *   2. claim capacity with a guarded atomic $inc
 *   3. commit the row; on failure of 3, release the spot (compensation)
 */
export async function registerForCompetition({ competitionId, userId, now = new Date() }) {
  const competition = await Competition.findById(competitionId).lean();
  if (!competition) throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');

  // Fast-path checks so that obviously invalid requests never touch the counter.
  const existing = await Registration.findOne({ competitionId, userId }).lean();
  if (existing?.status === REGISTRATION_STATUS.CONFIRMED) {
    throw AppError.conflict('ALREADY_REGISTERED', 'You are already registered');
  }
  if (existing?.status === REGISTRATION_STATUS.RESERVED && existing.expiresAt > now) {
    return { registration: existing, payment: existing.payment, reused: true };
  }

  const rule = canRegister(competition, now);
  if (!rule.ok) throw ruleError(rule.code);

  // --- 1. Per-user de-duplication -------------------------------------------
  const acquired = await acquirePendingRow({ competitionId, userId, now });
  if (acquired.reused) {
    return { registration: acquired.reused, payment: acquired.reused.payment, reused: true };
  }
  const pendingRow = acquired;

  // --- 2. Critical section: claim a spot atomically -------------------------
  const claimed = await claimSpot(competitionId, now);
  if (!claimed) {
    await Registration.updateOne(
      { _id: pendingRow._id, status: REGISTRATION_STATUS.PENDING },
      { $set: { status: REGISTRATION_STATUS.FAILED } }
    );
    // Re-evaluate to return the precise reason (full vs closed) to the client.
    const fresh = await Competition.findById(competitionId).lean();
    const recheck = fresh ? canRegister(fresh, now) : { ok: false, code: 'COMPETITION_NOT_FOUND' };
    throw ruleError(recheck.ok ? 'COMPETITION_FULL' : recheck.code);
  }

  // --- 3. Commit ---------------------------------------------------------------
  const isFree = competition.entryFeePaise === 0;
  let payment;
  try {
    // Creating the gateway order happens after the spot is held so we never
    // sell a spot we cannot deliver; if it fails the catch releases the spot.
    payment = isFree ? undefined : await buildPaymentOrder(competition, pendingRow._id);
    const registrationFields = isFree
      ? { status: REGISTRATION_STATUS.CONFIRMED, confirmedAt: now, expiresAt: null, payment: null }
      : {
          status: REGISTRATION_STATUS.RESERVED,
          expiresAt: new Date(now.getTime() + env.reservationTtlSeconds * 1000),
          confirmedAt: null,
          cancelledAt: null,
          payment,
        };

    const registration = await Registration.findOneAndUpdate(
      { _id: pendingRow._id, status: REGISTRATION_STATUS.PENDING },
      { $set: registrationFields },
      { new: true, runValidators: true }
    );
    if (!registration) throw new Error('Pending registration vanished before commit');
    return { registration, payment, reused: false };
  } catch (err) {
    // Compensating action: give the spot back if the commit failed.
    await releaseSpot(competitionId);
    await Registration.updateOne(
      { _id: pendingRow._id, status: REGISTRATION_STATUS.PENDING },
      { $set: { status: REGISTRATION_STATUS.FAILED } }
    );
    throw err;
  }
}

/**
 * Moves a live reservation to `confirmed`. Guarded on status so a concurrent
 * expiry sweep cannot be overwritten, and idempotent so the checkout callback
 * and the webhook can both call it for the same payment.
 */
async function confirmReservation(registration, { paymentId, now }) {
  if (registration.status === REGISTRATION_STATUS.CONFIRMED) {
    return { registration, alreadyConfirmed: true };
  }
  if (registration.status !== REGISTRATION_STATUS.RESERVED) {
    throw AppError.conflict('RESERVATION_NOT_ACTIVE', 'No active reservation to confirm');
  }
  if (registration.expiresAt <= now) {
    throw AppError.conflict('RESERVATION_EXPIRED', 'Your reservation expired. Please register again');
  }
  const confirmed = await Registration.findOneAndUpdate(
    { _id: registration._id, status: REGISTRATION_STATUS.RESERVED },
    {
      $set: {
        status: REGISTRATION_STATUS.CONFIRMED,
        confirmedAt: now,
        expiresAt: null,
        'payment.paymentId': paymentId,
        'payment.paidAt': now,
      },
    },
    { new: true }
  );
  if (!confirmed) {
    throw AppError.conflict('RESERVATION_EXPIRED', 'Your reservation expired. Please register again');
  }
  return { registration: confirmed, alreadyConfirmed: false };
}

/**
 * Client-side checkout callback. The signature is verified with the gateway
 * secret (HMAC-SHA256 of "orderId|paymentId"); in mock mode "mock" is accepted.
 */
export async function confirmRegistrationPayment({
  competitionId,
  userId,
  paymentId,
  signature,
  now = new Date(),
}) {
  const registration = await Registration.findOne({ competitionId, userId });
  if (!registration) throw AppError.notFound('REGISTRATION_NOT_FOUND', 'No registration found');
  if (registration.status === REGISTRATION_STATUS.CONFIRMED) {
    return { registration, alreadyConfirmed: true };
  }
  if (!verifyCheckoutSignature({ orderId: registration.payment?.orderId, paymentId, signature })) {
    throw AppError.badRequest('PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified');
  }
  return confirmReservation(registration, { paymentId, now });
}

/**
 * Server-to-server confirmation from the gateway webhook (payment.captured).
 * The webhook is the source of truth when the app was killed before the
 * checkout callback reached us. Unknown orders are ignored (return null) so
 * the gateway does not keep retrying.
 */
export async function confirmRegistrationByOrder({ orderId, paymentId, now = new Date() }) {
  const registration = await Registration.findOne({ 'payment.orderId': orderId });
  if (!registration) return null;
  if (registration.status === REGISTRATION_STATUS.CONFIRMED) {
    return { registration, alreadyConfirmed: true };
  }
  if (registration.status !== REGISTRATION_STATUS.RESERVED) {
    // Paid after the hold expired: flag for manual refund rather than oversell.
    logger.warn({ orderId, paymentId, status: registration.status }, 'Payment for inactive reservation');
    return { registration, alreadyConfirmed: false, needsRefund: true };
  }
  return confirmReservation(registration, { paymentId, now });
}

export async function cancelRegistration({ competitionId, userId, now = new Date() }) {
  const competition = await Competition.findById(competitionId).lean();
  if (!competition) throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');

  const rule = canCancelRegistration(competition, now);
  if (!rule.ok) throw ruleError(rule.code);

  const hasSubmission = await Submission.exists({ competitionId, userId });
  if (hasSubmission) {
    throw AppError.conflict('SUBMISSION_EXISTS', 'Cannot cancel after uploading a submission');
  }

  const cancelled = await Registration.findOneAndUpdate(
    { competitionId, userId, status: { $in: ACTIVE_REGISTRATION_STATUSES } },
    { $set: { status: REGISTRATION_STATUS.CANCELLED, cancelledAt: now, expiresAt: null } },
    { new: true }
  );
  if (!cancelled) {
    throw AppError.notFound('REGISTRATION_NOT_FOUND', 'No active registration to cancel');
  }
  await releaseSpot(competitionId);
  return { registration: cancelled };
}

/**
 * Releases spots held by reservations whose payment never completed. Each
 * transition is guarded on status so it is safe to run from several
 * processes at once; a reservation can only be expired (and its spot
 * released) once.
 */
export async function releaseExpiredReservations(now = new Date()) {
  const expired = await Registration.find({
    status: REGISTRATION_STATUS.RESERVED,
    expiresAt: { $lte: now },
  })
    .select('_id competitionId')
    .limit(500)
    .lean();

  let released = 0;
  for (const reservation of expired) {
    const result = await Registration.updateOne(
      { _id: reservation._id, status: REGISTRATION_STATUS.RESERVED },
      { $set: { status: REGISTRATION_STATUS.EXPIRED } }
    );
    if (result.modifiedCount === 1) {
      await releaseSpot(reservation.competitionId);
      released += 1;
    }
  }
  if (released > 0) logger.info({ released }, 'Released expired reservations');

  // Abandoned `pending` rows (process crashed between steps) never hold a
  // spot, so they are simply failed to unblock the user.
  await Registration.updateMany(
    { status: REGISTRATION_STATUS.PENDING, updatedAt: { $lt: new Date(now.getTime() - STALE_PENDING_MS) } },
    { $set: { status: REGISTRATION_STATUS.FAILED } }
  );
  return released;
}

export async function findUserRegistration(competitionId, userId) {
  if (!userId) return null;
  return Registration.findOne({
    competitionId: new mongoose.Types.ObjectId(competitionId),
    userId,
  }).lean();
}
