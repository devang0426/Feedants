import mongoose from 'mongoose';
import crypto from 'node:crypto';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarUrl: { type: String },
    /** Short code used in the referral link (feedants.com/r/<code>). */
    referralCode: { type: String, unique: true, index: true },
    /** Referral reward credit in paise, incremented when a referred user signs up. */
    referralEarningsPaise: { type: Number, default: 0 },
    preferredLang: { type: String, enum: ['en', 'hi'], default: 'en' },
  },
  { timestamps: true }
);

userSchema.pre('validate', function assignReferralCode() {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString('hex');
  }
});

export const User = mongoose.model('User', userSchema);
