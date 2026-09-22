import mongoose from 'mongoose';
import crypto from 'node:crypto';

const { Schema } = mongoose;

/** Short, URL-safe code used in a user's referral link. */
export const generateReferralCode = () => crypto.randomBytes(4).toString('hex');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarUrl: { type: String },
    /**
     * Code used in the referral link (feedants.com/r/<code>). The index is
     * sparse so documents that predate the code (or are mid-creation) do not
     * collide on a missing value.
     */
    referralCode: { type: String, unique: true, sparse: true, index: true },
    /** Referral reward credit in paise, incremented when a referred user signs up. */
    referralEarningsPaise: { type: Number, default: 0 },
    preferredLang: { type: String, enum: ['en', 'hi'], default: 'en' },
  },
  { timestamps: true }
);

userSchema.pre('validate', function assignReferralCode() {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode();
  }
});

export const User = mongoose.model('User', userSchema);
