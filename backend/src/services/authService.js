import { User, generateReferralCode } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { t } from '../utils/i18n.js';
import { DEMO_USERS } from '../seed/data.js';

const isDuplicateKey = (err) => err?.code === 11000;
const MAX_ATTEMPTS = 3;

/**
 * Demo authentication: identifies a user by e-mail and issues a JWT. In a
 * real product this would be replaced by OTP / OAuth, but the rest of the
 * stack (JWT bearer, `req.user`) stays identical.
 *
 * The referral code is generated inside `$setOnInsert` rather than by a
 * post-insert save: every inserted document must carry a unique value
 * immediately, otherwise concurrent first-time sign-ins all insert a missing
 * `referralCode` and collide on the unique index.
 */
export async function demoLogin({ email, name }) {
  const normalizedEmail = email.toLowerCase().trim();
  const displayName = name?.trim() || normalizedEmail.split('@')[0];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            email: normalizedEmail,
            name: displayName,
            referralCode: generateReferralCode(),
            referralEarningsPaise: 0,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      return { token: signToken(user), user: serializeUser(user) };
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
      // Either two requests raced to create the same e-mail (the loser reads
      // the winner's row) or the random code collided (retry with a new one).
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return { token: signToken(existing), user: serializeUser(existing) };
      if (attempt === MAX_ATTEMPTS) {
        throw new AppError(500, 'SIGN_IN_FAILED', 'Could not sign in. Please try again.');
      }
    }
  }
  throw new AppError(500, 'SIGN_IN_FAILED', 'Could not sign in. Please try again.');
}

/**
 * Accounts offered as one-click sign-in. Only the seeded demo users that
 * actually exist are returned, and only outside production, so the list can
 * never leak real accounts.
 */
export async function listDemoAccounts(lang) {
  if (env.isProduction) return [];
  const candidates = DEMO_USERS.filter((u) => u.hint);
  const existing = await User.find({ email: { $in: candidates.map((u) => u.email) } })
    .select('email name avatarUrl')
    .lean();
  const byEmail = new Map(existing.map((u) => [u.email, u]));
  return candidates
    .filter((u) => byEmail.has(u.email))
    .map((u) => ({
      email: u.email,
      name: byEmail.get(u.email).name,
      avatarUrl: byEmail.get(u.email).avatarUrl ?? null,
      hint: t(u.hint, lang),
    }));
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
