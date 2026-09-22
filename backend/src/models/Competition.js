import mongoose from 'mongoose';
import { localizedString } from '../utils/i18n.js';

const { Schema } = mongoose;

/**
 * Editorial/administrative status. The *lifecycle* status (upcoming, open,
 * closed, results...) is intentionally NOT stored. It is derived from the
 * schedule and the server clock at read time so it can never go stale.
 */
export const COMPETITION_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
});

const rewardSchema = new Schema(
  {
    position: { type: Number, required: true, min: 1 },
    label: localizedString({ required: true }),
    amountPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const winnerSchema = new Schema(
  {
    name: { type: String, required: true },
    positionLabel: localizedString({ required: true }),
    imageUrl: { type: String, required: true },
    videoUrl: { type: String },
  },
  { _id: false }
);

const judgeSchema = new Schema(
  {
    name: { type: String, required: true },
    title: localizedString({ required: true }),
    experience: localizedString(),
    avatarUrl: { type: String },
    introVideoUrl: { type: String },
  },
  { _id: false }
);

const scheduleSchema = new Schema(
  {
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultAt: { type: Date, required: true },
  },
  { _id: false }
);

const competitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: localizedString({ required: true }),
    category: localizedString({ required: true }),
    tags: [localizedString()],
    perks: [localizedString()],
    status: {
      type: String,
      enum: Object.values(COMPETITION_STATUS),
      default: COMPETITION_STATUS.DRAFT,
      index: true,
    },

    currency: { type: String, default: 'INR' },
    prizePoolPaise: { type: Number, required: true, min: 0 },
    entryFeePaise: { type: Number, required: true, min: 0 },

    /**
     * Capacity counters. `booked` counts confirmed registrations PLUS live
     * (unexpired) reservations, so a spot is held while a user pays. It is
     * only ever changed through atomic, guarded `$inc` updates.
     */
    capacity: {
      total: { type: Number, required: true, min: 1 },
      booked: { type: Number, default: 0, min: 0 },
    },

    schedule: { type: scheduleSchema, required: true },
    judge: judgeSchema,
    previousWinners: [winnerSchema],

    about: localizedString({ required: true }),
    judgingParameters: [localizedString()],
    rules: [localizedString()],
    rewards: [rewardSchema],
    disclaimer: localizedString(),

    media: {
      prizeMoneyVideoUrl: String,
      refundPolicyUrl: String,
      paymentProvider: { type: String, default: 'Razorpay' },
    },
    referral: {
      rewardPaise: { type: Number, default: 1000 },
    },
    testimonialsUrl: String,
  },
  { timestamps: true, optimisticConcurrency: true }
);

competitionSchema.pre('validate', function validateSchedule() {
  const s = this.schedule;
  if (!s) return;
  const errors = [];
  if (s.registrationOpensAt >= s.registrationClosesAt) {
    errors.push('registrationOpensAt must be before registrationClosesAt');
  }
  if (s.submissionStartsAt >= s.submissionEndsAt) {
    errors.push('submissionStartsAt must be before submissionEndsAt');
  }
  if (s.submissionEndsAt > s.resultAt) {
    errors.push('resultAt must be on/after submissionEndsAt');
  }
  if (s.submissionEndsAt < s.registrationClosesAt) {
    errors.push('submissionEndsAt must be on/after registrationClosesAt');
  }
  if (errors.length) this.invalidate('schedule', errors.join('; '));
});

competitionSchema.index({ status: 1, 'schedule.registrationClosesAt': 1 });

export const Competition = mongoose.model('Competition', competitionSchema);
