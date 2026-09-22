import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

/**
 * Demo authentication: identifies a user by e-mail and issues a JWT. In a
 * real product this would be replaced by OTP / OAuth, but the rest of the
 * stack (JWT bearer, `req.user`) stays identical.
 */
export async function demoLogin({ email, name }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $setOnInsert: { email: normalizedEmail, name: name?.trim() || normalizedEmail.split('@')[0] } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  // findOneAndUpdate bypasses pre('validate'), so ensure the referral code exists.
  if (!user.referralCode) {
    await user.validate();
    await user.save();
  }
  return { token: signToken(user), user: serializeUser(user) };
}

export function serializeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    referral: {
      code: user.referralCode,
      link: `${env.referralBaseUrl}/${user.referralCode}`,
      earningsPaise: user.referralEarningsPaise ?? 0,
    },
  };
}
