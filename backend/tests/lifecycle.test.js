import { describe, it, expect } from 'vitest';
import { getPhase, getCountdown, canRegister, canSubmit, PHASE } from '../src/services/lifecycle.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = new Date('2026-08-05T12:00:00Z');
const at = (ms) => new Date(now.getTime() + ms);

const make = (overrides = {}) => ({
  status: 'published',
  capacity: { total: 20, booked: 1 },
  schedule: {
    registrationOpensAt: at(-5 * DAY),
    registrationClosesAt: at(5 * DAY),
    submissionStartsAt: at(1 * DAY),
    submissionEndsAt: at(25 * DAY),
    resultAt: at(27 * DAY),
  },
  ...overrides,
});

describe('getPhase', () => {
  it('derives every phase from the schedule and clock', () => {
    expect(getPhase(make(), now)).toBe(PHASE.REGISTRATION_OPEN);
    expect(getPhase(make(), at(-6 * DAY))).toBe(PHASE.UPCOMING);
    expect(getPhase(make(), at(5 * DAY))).toBe(PHASE.SUBMISSION_OPEN);
    expect(getPhase(make(), at(25 * DAY))).toBe(PHASE.JUDGING);
    expect(getPhase(make(), at(27 * DAY))).toBe(PHASE.RESULTS_ANNOUNCED);
    expect(getPhase(make({ status: 'draft' }), now)).toBe(PHASE.DRAFT);
    expect(getPhase(make({ status: 'cancelled' }), now)).toBe(PHASE.CANCELLED);
  });

  it('reports registration_closed when registration is over but submissions are not yet open', () => {
    const c = make({
      schedule: {
        registrationOpensAt: at(-5 * DAY),
        registrationClosesAt: at(-1 * DAY),
        submissionStartsAt: at(1 * DAY),
        submissionEndsAt: at(5 * DAY),
        resultAt: at(6 * DAY),
      },
    });
    expect(getPhase(c, now)).toBe(PHASE.REGISTRATION_CLOSED);
  });
});

describe('getCountdown', () => {
  it('counts down to the next meaningful boundary and flags urgency', () => {
    expect(getCountdown(make(), now)).toMatchObject({ key: 'registration_closes', urgent: false });
    expect(getCountdown(make(), at(4 * DAY))).toMatchObject({ key: 'registration_closes', urgent: true });
    expect(getCountdown(make({ capacity: { total: 20, booked: 16 } }), now)).toMatchObject({ urgent: true });
    expect(getCountdown(make(), at(-6 * DAY))).toMatchObject({ key: 'registration_opens' });
    expect(getCountdown(make(), at(25 * DAY))).toMatchObject({ key: 'results_in' });
    expect(getCountdown(make(), at(27 * DAY))).toBeNull();
  });
});

describe('guards', () => {
  it('canRegister covers every rejection reason', () => {
    expect(canRegister(make(), now)).toEqual({ ok: true });
    expect(canRegister(make({ status: 'draft' }), now).code).toBe('COMPETITION_NOT_PUBLISHED');
    expect(canRegister(make(), at(-6 * DAY)).code).toBe('REGISTRATION_NOT_OPEN');
    expect(canRegister(make(), at(5 * DAY)).code).toBe('REGISTRATION_CLOSED');
    expect(canRegister(make({ capacity: { total: 20, booked: 20 } }), now).code).toBe('COMPETITION_FULL');
  });

  it('canSubmit respects the submission window', () => {
    expect(canSubmit(make(), now).code).toBe('SUBMISSION_NOT_OPEN');
    expect(canSubmit(make(), at(2 * DAY))).toEqual({ ok: true });
    expect(canSubmit(make(), at(25 * DAY)).code).toBe('SUBMISSION_CLOSED');
  });
});
