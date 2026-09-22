import mongoose from 'mongoose';
import { Competition, COMPETITION_STATUS, REGISTRATION_STATUS } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { t } from '../utils/i18n.js';
import { env } from '../config/env.js';
import { getPhase, getWindows, getCountdown, PHASE } from './lifecycle.js';
import { findUserRegistration } from './registrationService.js';
import { findUserSubmission } from './submissionService.js';
import { toClientPayment } from './paymentService.js';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;

export async function findCompetitionByIdOrSlug(idOrSlug) {
  const query = isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
  const competition = await Competition.findOne(query).lean();
  if (!competition) throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');
  return competition;
}

/**
 * Decides the single primary call-to-action for the viewer. Centralising this
 * on the server means every client (iOS, Android, web) renders exactly the
 * same rules, and the rules can change without an app release.
 */
export function resolvePrimaryAction({ phase, windows, registration, submission, now }) {
  const isConfirmed = registration?.status === REGISTRATION_STATUS.CONFIRMED;
  const isReserved =
    registration?.status === REGISTRATION_STATUS.RESERVED && registration.expiresAt > now;

  if (phase === PHASE.DRAFT) return { type: 'none', enabled: false, labelKey: 'unavailable' };
  if (phase === PHASE.CANCELLED) {
    return { type: 'none', enabled: false, labelKey: 'competition_cancelled' };
  }
  if (phase === PHASE.RESULTS_ANNOUNCED) {
    return { type: 'view_results', enabled: true, labelKey: 'view_results' };
  }

  if (isConfirmed) {
    if (windows.submission.isOpen) {
      return submission
        ? { type: 'update_submission', enabled: true, labelKey: 'update_submission', subLabelKey: 'submission_uploaded' }
        : { type: 'upload_submission', enabled: true, labelKey: 'upload_submission', subLabelKey: 'registered' };
    }
    if (windows.submission.hasEnded) {
      return submission
        ? { type: 'none', enabled: false, labelKey: 'submission_uploaded', subLabelKey: 'awaiting_results' }
        : { type: 'none', enabled: false, labelKey: 'submission_closed', subLabelKey: 'registered' };
    }
    return {
      type: 'upload_submission',
      enabled: false,
      labelKey: 'upload_submission',
      subLabelKey: 'submission_opens_at',
      subLabelAt: windows.submission.startsAt,
    };
  }

  if (isReserved) {
    return {
      type: 'complete_payment',
      enabled: true,
      labelKey: 'complete_payment',
      subLabelKey: 'spot_held_until',
      subLabelAt: registration.expiresAt,
    };
  }

  switch (phase) {
    case PHASE.UPCOMING:
      return {
        type: 'register',
        enabled: false,
        labelKey: 'registration_opens_at',
        subLabelAt: windows.registration.opensAt,
      };
    case PHASE.REGISTRATION_OPEN:
      if (windows.registration.isFull) {
        return { type: 'register', enabled: false, labelKey: 'competition_full' };
      }
      return { type: 'register', enabled: true, labelKey: 'register_now', subLabelKey: 'entry_fee' };
    default:
      return { type: 'register', enabled: false, labelKey: 'registration_closed' };
  }
}

function serializeRegistration(registration, now) {
  if (!registration) return null;
  return {
    id: String(registration._id),
    status: registration.status,
    isActive:
      registration.status === REGISTRATION_STATUS.CONFIRMED ||
      (registration.status === REGISTRATION_STATUS.RESERVED && registration.expiresAt > now),
    expiresAt: registration.expiresAt ?? null,
    confirmedAt: registration.confirmedAt ?? null,
    payment: registration.payment?.orderId ? toClientPayment(registration.payment) : null,
  };
}

function serializeSubmission(submission) {
  if (!submission) return null;
  return {
    id: String(submission._id),
    title: submission.title ?? null,
    mediaUrl: submission.mediaUrl,
    mediaType: submission.mediaType,
    submittedAt: submission.submittedAt,
    revision: submission.revision,
  };
}

/** The full screen view-model for the Competition Details page. */
export function serializeCompetitionDetails(competition, { lang, user, registration, submission, now }) {
  const phase = getPhase(competition, now);
  const windows = getWindows(competition, now);
  const countdown = getCountdown(competition, now);
  const reg = serializeRegistration(registration, now);
  const sub = serializeSubmission(submission);

  return {
    id: String(competition._id),
    slug: competition.slug,
    title: t(competition.title, lang),
    category: t(competition.category, lang),
    tags: (competition.tags ?? []).map((x) => t(x, lang)),
    perks: (competition.perks ?? []).map((x) => t(x, lang)),
    currency: competition.currency,
    prizePoolPaise: competition.prizePoolPaise,
    entryFeePaise: competition.entryFeePaise,
    capacity: { ...windows.capacity, isFull: windows.registration.isFull },
    phase,
    windows: {
      registration: {
        opensAt: windows.registration.opensAt,
        closesAt: windows.registration.closesAt,
        isOpen: windows.registration.isOpen,
      },
      submission: {
        startsAt: windows.submission.startsAt,
        endsAt: windows.submission.endsAt,
        isOpen: windows.submission.isOpen,
      },
      results: { at: windows.results.at, isAnnounced: windows.results.isAnnounced },
    },
    countdown,
    judge: competition.judge
      ? {
          name: competition.judge.name,
          title: t(competition.judge.title, lang),
          experience: t(competition.judge.experience, lang),
          avatarUrl: competition.judge.avatarUrl ?? null,
          introVideoUrl: competition.judge.introVideoUrl ?? null,
        }
      : null,
    previousWinners: (competition.previousWinners ?? []).map((w) => ({
      name: w.name,
      positionLabel: t(w.positionLabel, lang),
      imageUrl: w.imageUrl,
      videoUrl: w.videoUrl ?? null,
    })),
    about: t(competition.about, lang),
    judgingParameters: (competition.judgingParameters ?? []).map((x) => t(x, lang)),
    rules: (competition.rules ?? []).map((x) => t(x, lang)),
    rewards: (competition.rewards ?? []).map((r) => ({
      position: r.position,
      label: t(r.label, lang),
      amountPaise: r.amountPaise,
    })),
    disclaimer: t(competition.disclaimer, lang),
    media: {
      prizeMoneyVideoUrl: competition.media?.prizeMoneyVideoUrl ?? null,
      refundPolicyUrl: competition.media?.refundPolicyUrl ?? null,
      paymentProvider: competition.media?.paymentProvider ?? 'Razorpay',
    },
    referral: {
      rewardPaise: competition.referral?.rewardPaise ?? 0,
      link: user ? `${env.referralBaseUrl}/${user.referralCode}` : null,
    },
    testimonialsUrl: competition.testimonialsUrl ?? null,
    viewer: {
      isAuthenticated: Boolean(user),
      isRegistered: reg?.status === REGISTRATION_STATUS.CONFIRMED,
      registration: reg,
      submission: sub,
      primaryAction: resolvePrimaryAction({ phase, windows, registration, submission, now }),
      canCancel:
        Boolean(reg?.isActive) && !windows.registration.hasClosed && !sub && phase !== PHASE.CANCELLED,
    },
  };
}

export async function getCompetitionDetails({ idOrSlug, user, lang, now = new Date() }) {
  const competition = await findCompetitionByIdOrSlug(idOrSlug);
  if (competition.status === COMPETITION_STATUS.DRAFT) {
    throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');
  }
  const [registration, submission] = await Promise.all([
    findUserRegistration(competition._id, user?._id),
    findUserSubmission(competition._id, user?._id),
  ]);
  return serializeCompetitionDetails(competition, { lang, user, registration, submission, now });
}

/** Compact card representation for list screens. */
export function serializeCompetitionSummary(c, { lang, now }) {
  const windows = getWindows(c, now);
  return {
    id: String(c._id),
    slug: c.slug,
    title: t(c.title, lang),
    category: t(c.category, lang),
    phase: getPhase(c, now),
    entryFeePaise: c.entryFeePaise,
    prizePoolPaise: c.prizePoolPaise,
    currency: c.currency,
    capacity: { ...windows.capacity, isFull: windows.registration.isFull },
    registrationClosesAt: c.schedule.registrationClosesAt,
    submissionEndsAt: c.schedule.submissionEndsAt,
    resultAt: c.schedule.resultAt,
    judgeName: c.judge?.name ?? null,
    judgeAvatarUrl: c.judge?.avatarUrl ?? null,
  };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * List with optional search/filters. `q` and `category` are pushed to the
 * database; `phase` is derived from dates so it is applied after derivation
 * (catalogue sizes are small; a materialised phase field with a scheduled
 * refresh would be the next step at scale).
 */
export async function listCompetitions({ lang, q, category, phase, now = new Date() }) {
  const conditions = [{ status: { $ne: COMPETITION_STATUS.DRAFT } }];
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    conditions.push({ $or: [{ 'title.en': rx }, { 'title.hi': rx }, { 'judge.name': rx }, { 'category.en': rx }] });
  }
  if (category) {
    const rx = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    conditions.push({ $or: [{ 'category.en': rx }, { 'category.hi': rx }] });
  }

  const competitions = await Competition.find({ $and: conditions })
    .sort({ 'schedule.registrationClosesAt': 1 })
    .lean();
  const summaries = competitions.map((c) => serializeCompetitionSummary(c, { lang, now }));
  return phase ? summaries.filter((s) => s.phase === phase) : summaries;
}

/** Distinct categories for filter chips (localised). */
export async function listCategories({ lang }) {
  const rows = await Competition.find({ status: { $ne: COMPETITION_STATUS.DRAFT } })
    .select('category')
    .lean();
  const seen = new Map();
  for (const r of rows) {
    const key = r.category?.en?.toLowerCase();
    if (key && !seen.has(key)) seen.set(key, { key: r.category.en, label: t(r.category, lang) });
  }
  return [...seen.values()];
}

/**
 * Admin update. Uses document save() so schedule validation and optimistic
 * concurrency (version key) apply. Capacity cannot be reduced below what is
 * already booked.
 */
export async function adminUpdateCompetition(id, patch) {
  const competition = await Competition.findById(id);
  if (!competition) throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');

  if (patch.status) competition.status = patch.status;
  if (patch.schedule) {
    for (const [key, value] of Object.entries(patch.schedule)) {
      competition.schedule[key] = value;
    }
  }
  if (patch.capacityTotal != null) {
    if (patch.capacityTotal < competition.capacity.booked) {
      throw AppError.conflict(
        'CAPACITY_BELOW_BOOKED',
        `Capacity cannot be lower than ${competition.capacity.booked} already booked`
      );
    }
    competition.capacity.total = patch.capacityTotal;
  }
  await competition.save();
  return competition.toObject();
}
