import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Competition, Registration, REGISTRATION_STATUS, Submission, User } from '../models/index.js';
import { buildCompetitions, DEMO_USERS, SEED_REGISTRATIONS } from './data.js';

/**
 * Populates the database with demo users and competitions in every lifecycle
 * phase. Safe to run repeatedly with `reset: true`.
 */
export async function seedDatabase({ reset = false, now = new Date() } = {}) {
  if (reset) {
    await Promise.all([
      Competition.deleteMany({}),
      Registration.deleteMany({}),
      Submission.deleteMany({}),
      User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } }),
    ]);
  }

  // `hint` is presentation-only metadata for the sign-in screen, not a field
  // on the User schema, so it is dropped before inserting.
  const users = await User.insertMany(DEMO_USERS.map(({ hint, ...user }) => user));
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const competitions = await Competition.insertMany(buildCompetitions(now));

  const registrations = [];
  const submissions = [];
  for (const competition of competitions) {
    const emails = [...new Set(SEED_REGISTRATIONS[competition.slug] ?? [])];
    for (const email of emails) {
      const user = userByEmail.get(email);
      registrations.push({
        competitionId: competition._id,
        userId: user._id,
        status: REGISTRATION_STATUS.CONFIRMED,
        confirmedAt: competition.schedule.registrationOpensAt,
        payment:
          competition.entryFeePaise > 0
            ? {
                provider: 'Razorpay',
                orderId: `order_seed_${competition.slug}_${user.referralCode}`,
                paymentId: `pay_seed_${user.referralCode}`,
                amountPaise: competition.entryFeePaise,
                currency: competition.currency,
                paidAt: competition.schedule.registrationOpensAt,
              }
            : null,
      });
    }
    competition.capacity.booked = emails.length;
    await competition.save();
  }
  const savedRegistrations = await Registration.insertMany(registrations);

  // The demo user has already uploaded entries where submissions are closed.
  const demo = userByEmail.get('demo@feedants.app');
  for (const competition of competitions) {
    if (competition.schedule.submissionEndsAt > now) continue;
    const reg = savedRegistrations.find(
      (r) => String(r.competitionId) === String(competition._id) && String(r.userId) === String(demo._id)
    );
    if (!reg) continue;
    submissions.push({
      competitionId: competition._id,
      userId: demo._id,
      registrationId: reg._id,
      title: 'My entry',
      mediaUrl: 'https://example.com/submissions/demo.mp4',
      mediaType: 'video',
      submittedAt: competition.schedule.submissionStartsAt,
    });
  }
  if (submissions.length) await Submission.insertMany(submissions);

  return {
    users: users.length,
    competitions: competitions.length,
    registrations: savedRegistrations.length,
    submissions: submissions.length,
    demoUser: demo.email,
  };
}

// Allow `npm run seed` against a persistent database.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { connectDatabase, disconnectDatabase } = await import('../config/db.js');
  await connectDatabase();
  const summary = await seedDatabase({ reset: true });
  console.log('Seeded:', summary);
  await disconnectDatabase();
  await mongoose.disconnect();
}
