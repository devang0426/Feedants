import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Registration state machine:
 *
 *   (none) --register--> pending --spot claimed--> reserved --pay--> confirmed --cancel--> cancelled
 *                           |                        |
 *                           +--no spot--> failed     +--ttl elapses--> expired
 *
 * `pending` exists only for the few milliseconds between de-duplicating the
 * user (unique index) and claiming capacity. `reserved` holds a spot while
 * payment is in progress. Free competitions go straight from `pending` to
 * `confirmed`. Only `reserved` + `confirmed` occupy capacity.
 */
export const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'pending',
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
});

/** Statuses that occupy a spot. */
export const ACTIVE_REGISTRATION_STATUSES = [
  REGISTRATION_STATUS.RESERVED,
  REGISTRATION_STATUS.CONFIRMED,
];

/** Statuses that block a new registration attempt for the same user. */
export const BLOCKING_REGISTRATION_STATUSES = [
  REGISTRATION_STATUS.PENDING,
  ...ACTIVE_REGISTRATION_STATUSES,
];

const registrationSchema = new Schema(
  {
    competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      required: true,
      index: true,
    },
    /** When a `reserved` registration is released if payment never completes. */
    expiresAt: { type: Date },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    payment: {
      provider: String,
      orderId: String,
      paymentId: String,
      amountPaise: Number,
      currency: String,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

/**
 * One registration document per (competition, user). This unique index is the
 * database-level guarantee that a user can never hold two spots, regardless
 * of how many concurrent requests they fire.
 */
registrationSchema.index({ competitionId: 1, userId: 1 }, { unique: true });
/** Used by the sweeper that releases expired reservations. */
registrationSchema.index({ status: 1, expiresAt: 1 });
/** Lets the payment webhook find the registration for a gateway order. */
registrationSchema.index({ 'payment.orderId': 1 }, { sparse: true });

export const Registration = mongoose.model('Registration', registrationSchema);
