import { COMPETITION_STATUS } from '../models/Competition.js';

/**
 * Pure functions that derive the time-dependent state of a competition from
 * its schedule and a reference instant (`now`). Keeping this pure makes the
 * business rules trivially unit-testable and lets the same logic drive the
 * details endpoint, the write guards, and the seed script.
 */

export const PHASE = Object.freeze({
  DRAFT: 'draft',
  CANCELLED: 'cancelled',
  UPCOMING: 'upcoming', // registration not yet open
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed', // closed, submissions not yet open
  SUBMISSION_OPEN: 'submission_open', // registration closed, submissions open
  JUDGING: 'judging', // submissions closed, results pending
  RESULTS_ANNOUNCED: 'results_announced',
});

const HURRY_WINDOW_MS = 48 * 60 * 60 * 1000;
const HURRY_SPOTS_RATIO = 0.25;

export function getWindows(competition, now = new Date()) {
  const s = competition.schedule;
  const t = now.getTime();
  const total = competition.capacity.total;
  const booked = Math.min(competition.capacity.booked, total);
  const spotsLeft = Math.max(total - booked, 0);

  return {
    registration: {
      opensAt: s.registrationOpensAt,
      closesAt: s.registrationClosesAt,
      isOpen: t >= s.registrationOpensAt.getTime() && t < s.registrationClosesAt.getTime(),
      hasClosed: t >= s.registrationClosesAt.getTime(),
      isFull: spotsLeft === 0,
    },
    submission: {
      startsAt: s.submissionStartsAt,
      endsAt: s.submissionEndsAt,
      isOpen: t >= s.submissionStartsAt.getTime() && t < s.submissionEndsAt.getTime(),
      hasEnded: t >= s.submissionEndsAt.getTime(),
    },
    results: {
      at: s.resultAt,
      isAnnounced: t >= s.resultAt.getTime(),
    },
    capacity: { total, booked, spotsLeft },
  };
}

export function getPhase(competition, now = new Date()) {
  if (competition.status === COMPETITION_STATUS.DRAFT) return PHASE.DRAFT;
  if (competition.status === COMPETITION_STATUS.CANCELLED) return PHASE.CANCELLED;

  const w = getWindows(competition, now);
  if (w.results.isAnnounced) return PHASE.RESULTS_ANNOUNCED;
  if (w.submission.hasEnded) return PHASE.JUDGING;
  if (w.registration.isOpen) return PHASE.REGISTRATION_OPEN;
  if (now.getTime() < w.registration.opensAt.getTime()) return PHASE.UPCOMING;
  if (w.submission.isOpen) return PHASE.SUBMISSION_OPEN;
  return PHASE.REGISTRATION_CLOSED;
}

/**
 * What the countdown banner should count down to in the current phase.
 * Returns null when there is nothing meaningful to count.
 */
export function getCountdown(competition, now = new Date()) {
  const phase = getPhase(competition, now);
  const w = getWindows(competition, now);

  switch (phase) {
    case PHASE.UPCOMING:
      return { key: 'registration_opens', targetAt: w.registration.opensAt, urgent: false };
    case PHASE.REGISTRATION_OPEN: {
      const remainingMs = w.registration.closesAt.getTime() - now.getTime();
      const urgent =
        remainingMs <= HURRY_WINDOW_MS ||
        w.capacity.spotsLeft <= Math.ceil(w.capacity.total * HURRY_SPOTS_RATIO);
      return { key: 'registration_closes', targetAt: w.registration.closesAt, urgent };
    }
    case PHASE.REGISTRATION_CLOSED:
      return { key: 'submission_starts', targetAt: w.submission.startsAt, urgent: false };
    case PHASE.SUBMISSION_OPEN:
      return { key: 'submission_ends', targetAt: w.submission.endsAt, urgent: true };
    case PHASE.JUDGING:
      return { key: 'results_in', targetAt: w.results.at, urgent: false };
    default:
      return null;
  }
}

export function canRegister(competition, now = new Date()) {
  if (competition.status !== COMPETITION_STATUS.PUBLISHED) {
    return { ok: false, code: 'COMPETITION_NOT_PUBLISHED' };
  }
  const w = getWindows(competition, now);
  if (now.getTime() < w.registration.opensAt.getTime()) {
    return { ok: false, code: 'REGISTRATION_NOT_OPEN' };
  }
  if (w.registration.hasClosed) return { ok: false, code: 'REGISTRATION_CLOSED' };
  if (w.registration.isFull) return { ok: false, code: 'COMPETITION_FULL' };
  return { ok: true };
}

export function canSubmit(competition, now = new Date()) {
  if (competition.status !== COMPETITION_STATUS.PUBLISHED) {
    return { ok: false, code: 'COMPETITION_NOT_PUBLISHED' };
  }
  const w = getWindows(competition, now);
  if (now.getTime() < w.submission.startsAt.getTime()) {
    return { ok: false, code: 'SUBMISSION_NOT_OPEN' };
  }
  if (w.submission.hasEnded) return { ok: false, code: 'SUBMISSION_CLOSED' };
  return { ok: true };
}

/**
 * Cancellation (with refund) is allowed while registration is still open and
 * no submission has been uploaded. After that the spot is committed.
 */
export function canCancelRegistration(competition, now = new Date()) {
  const w = getWindows(competition, now);
  if (w.registration.hasClosed) return { ok: false, code: 'CANCELLATION_WINDOW_CLOSED' };
  return { ok: true };
}
