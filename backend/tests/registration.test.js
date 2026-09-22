import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Competition, Registration, User } from '../src/models/index.js';
import { buildCompetitions } from '../src/seed/data.js';
import { signToken } from '../src/middleware/auth.js';
import { releaseExpiredReservations } from '../src/services/registrationService.js';

process.env.NODE_ENV = 'test';

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('feedants-test'));
  await Promise.all([Registration.syncIndexes(), Competition.syncIndexes(), User.syncIndexes()]);
  app = createApp();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Competition.deleteMany({}), Registration.deleteMany({}), User.deleteMany({})]);
});

const seedCompetition = async (overrides = {}) => {
  const [base] = buildCompetitions();
  return Competition.create({ ...base, ...overrides });
};

const createUsers = async (n) =>
  User.insertMany(Array.from({ length: n }, (_, i) => ({ name: `u${i}`, email: `u${i}@t.dev` })));

const registerAs = (user, competitionId) =>
  request(app)
    .post(`/api/v1/competitions/${competitionId}/registrations`)
    .set('Authorization', `Bearer ${signToken(user)}`);

describe('registration concurrency', () => {
  it('never oversells: 200 users racing for 20 spots -> exactly 20 succeed', async () => {
    const competition = await seedCompetition({ capacity: { total: 20, booked: 0 } });
    const users = await createUsers(200);

    const responses = await Promise.all(users.map((u) => registerAs(u, competition._id)));

    const succeeded = responses.filter((r) => r.status === 201);
    const full = responses.filter((r) => r.body?.error?.code === 'COMPETITION_FULL');
    expect(succeeded).toHaveLength(20);
    expect(full).toHaveLength(180);

    const fresh = await Competition.findById(competition._id).lean();
    expect(fresh.capacity.booked).toBe(20);
    expect(await Registration.countDocuments({ status: 'reserved' })).toBe(20);
  }, 60_000);

  it('the same user hammering register 25 times only ever holds one spot', async () => {
    const competition = await seedCompetition({ capacity: { total: 20, booked: 0 } });
    const [user] = await createUsers(1);

    const responses = await Promise.all(
      Array.from({ length: 25 }, () => registerAs(user, competition._id))
    );

    const created = responses.filter((r) => r.status === 201).length;
    const reused = responses.filter((r) => r.status === 200 && r.body.data.reused).length;
    const conflicts = responses.filter((r) =>
      ['ALREADY_REGISTERED', 'REGISTRATION_IN_PROGRESS'].includes(r.body?.error?.code)
    ).length;
    expect(created + reused + conflicts).toBe(25);
    expect(created).toBe(1);
    // Duplicate requests must never be answered with COMPETITION_FULL.
    expect(responses.some((r) => r.body?.error?.code === 'COMPETITION_FULL')).toBe(false);

    const fresh = await Competition.findById(competition._id).lean();
    expect(fresh.capacity.booked).toBe(1);
    expect(await Registration.countDocuments({ userId: user._id })).toBe(1);
  }, 60_000);
});

describe('registration lifecycle', () => {
  it('free competitions confirm immediately', async () => {
    const competition = await seedCompetition({ entryFeePaise: 0 });
    const [user] = await createUsers(1);
    const res = await registerAs(user, competition._id);
    expect(res.status).toBe(201);
    expect(res.body.data.registrationStatus).toBe('confirmed');
    expect(res.body.data.competition.viewer.isRegistered).toBe(true);
    expect(res.body.data.competition.viewer.primaryAction.type).toBe('upload_submission');
  });

  it('paid competitions reserve, then confirm on payment', async () => {
    const competition = await seedCompetition();
    const [user] = await createUsers(1);
    const reserve = await registerAs(user, competition._id);
    expect(reserve.body.data.registrationStatus).toBe('reserved');
    expect(reserve.body.data.payment.amountPaise).toBe(9900);
    expect(reserve.body.data.competition.viewer.primaryAction.type).toBe('complete_payment');

    const confirm = await request(app)
      .post(`/api/v1/competitions/${competition._id}/registrations/confirm`)
      .set('Authorization', `Bearer ${signToken(user)}`)
      .send({ paymentId: 'pay_x', signature: 'mock' });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.registrationStatus).toBe('confirmed');
    expect(confirm.body.data.competition.capacity.booked).toBe(1);
  });

  it('expired reservations release their spot and cannot be confirmed', async () => {
    const competition = await seedCompetition({ capacity: { total: 1, booked: 0 } });
    const [a, b] = await createUsers(2);
    await registerAs(a, competition._id);
    expect((await registerAs(b, competition._id)).body.error.code).toBe('COMPETITION_FULL');

    await Registration.updateOne({ userId: a._id }, { expiresAt: new Date(Date.now() - 1000) });
    expect(await releaseExpiredReservations()).toBe(1);

    const confirm = await request(app)
      .post(`/api/v1/competitions/${competition._id}/registrations/confirm`)
      .set('Authorization', `Bearer ${signToken(a)}`)
      .send({ paymentId: 'pay_x', signature: 'mock' });
    expect(confirm.body.error.code).toBe('RESERVATION_NOT_ACTIVE');

    const retry = await registerAs(b, competition._id);
    expect(retry.status).toBe(201);
  });

  it('rejects registration outside the window and on unpublished competitions', async () => {
    const [user] = await createUsers(1);
    const future = new Date(Date.now() + 86_400_000);
    const upcoming = await seedCompetition({
      slug: 'up',
      schedule: {
        registrationOpensAt: future,
        registrationClosesAt: new Date(+future + 1e6),
        submissionStartsAt: future,
        submissionEndsAt: new Date(+future + 2e6),
        resultAt: new Date(+future + 3e6),
      },
    });
    expect((await registerAs(user, upcoming._id)).body.error.code).toBe('REGISTRATION_NOT_OPEN');

    const draft = await seedCompetition({ slug: 'draft', status: 'draft' });
    expect((await registerAs(user, draft._id)).body.error.code).toBe('COMPETITION_NOT_PUBLISHED');
  });

  it('cancel releases the spot; cannot cancel after submitting', async () => {
    const competition = await seedCompetition({ entryFeePaise: 0 });
    const [user] = await createUsers(1);
    const auth = `Bearer ${signToken(user)}`;
    await registerAs(user, competition._id);

    const cancel = await request(app)
      .delete(`/api/v1/competitions/${competition._id}/registrations`)
      .set('Authorization', auth);
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.competition.capacity.booked).toBe(0);

    await registerAs(user, competition._id);
    const submit = await request(app)
      .put(`/api/v1/competitions/${competition._id}/submissions`)
      .set('Authorization', auth)
      .send({ mediaUrl: 'https://example.com/v.mp4', title: 'Entry' });
    expect(submit.status).toBe(200);
    expect(submit.body.data.competition.viewer.primaryAction.type).toBe('update_submission');

    const cancel2 = await request(app)
      .delete(`/api/v1/competitions/${competition._id}/registrations`)
      .set('Authorization', auth);
    expect(cancel2.body.error.code).toBe('SUBMISSION_EXISTS');
  });

  it('requires authentication for writes and localises content', async () => {
    const competition = await seedCompetition();
    expect((await request(app).post(`/api/v1/competitions/${competition._id}/registrations`)).status).toBe(401);

    const hi = await request(app).get(`/api/v1/competitions/${competition.slug}?lang=hi`);
    expect(hi.body.data.competition.title).toBe('फीडएंट्स शास्त्रीय नृत्य');
    expect(hi.body.serverTime).toBeTruthy();
  });
});
