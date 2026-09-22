import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/index.js';
import { seedDatabase } from '../src/seed/seed.js';

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('feedants-auth-test'));
  // The referral-code collision this file guards against only happens with
  // the real indexes in place.
  await User.syncIndexes();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const login = (body) => request(app).post('/api/v1/auth/demo-login').send(body);

describe('POST /auth/demo-login', () => {
  it('creates a user on first sign in and returns the same user afterwards', async () => {
    const first = await login({ email: 'New.User@Example.com', name: 'New User' });
    expect(first.status).toBe(200);
    expect(first.body.data.user.email).toBe('new.user@example.com');
    expect(first.body.data.user.referral.code).toMatch(/^[a-f\d]{8}$/);
    expect(first.body.data.token).toBeTruthy();

    const second = await login({ email: 'new.user@example.com' });
    expect(second.body.data.user.id).toBe(first.body.data.user.id);
    expect(await User.countDocuments()).toBe(1);
  });

  it('derives a name from the e-mail when none is given', async () => {
    const res = await login({ email: 'solo@example.com' });
    expect(res.body.data.user.name).toBe('solo');
  });

  it('rejects a malformed e-mail', async () => {
    const res = await login({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  /**
   * Regression: the user row used to be inserted without a referral code and
   * the code assigned by a follow-up save. Because the unique index treats a
   * missing field as null, only one in-flight insert could hold that slot and
   * concurrent first-time sign-ins failed with E11000.
   */
  it('handles many simultaneous first-time sign-ins without duplicate-key errors', async () => {
    const emails = Array.from({ length: 25 }, (_, i) => `rush${i}@example.com`);
    const responses = await Promise.all(emails.map((email) => login({ email })));

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(await User.countDocuments()).toBe(25);
    const codes = new Set(responses.map((r) => r.body.data.user.referral.code));
    expect(codes.size).toBe(25);
  }, 30_000);

  it('collapses simultaneous sign-ins for the SAME e-mail into one user', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => login({ email: 'same@example.com', name: 'Same' }))
    );
    expect(responses.every((r) => r.status === 200)).toBe(true);
    const ids = new Set(responses.map((r) => r.body.data.user.id));
    expect(ids.size).toBe(1);
    expect(await User.countDocuments({ email: 'same@example.com' })).toBe(1);
  }, 30_000);
});

describe('GET /auth/me', () => {
  it('returns the signed-in user and rejects a missing or bad token', async () => {
    const { token, user } = (await login({ email: 'me@example.com', name: 'Me' })).body.data;

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.user.id).toBe(user.id);

    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer nope')).status).toBe(401);
  });
});

describe('GET /auth/demo-accounts', () => {
  it('lists only seeded demo accounts that exist, localised, without secrets', async () => {
    expect((await request(app).get('/api/v1/auth/demo-accounts')).body.data.accounts).toEqual([]);

    await seedDatabase({ reset: true });
    const res = await request(app).get('/api/v1/auth/demo-accounts');
    const accounts = res.body.data.accounts;
    expect(accounts.length).toBeGreaterThanOrEqual(3);
    expect(accounts[0]).toMatchObject({ email: 'demo@feedants.app', name: 'Devang' });
    expect(accounts[0].hint).toContain('Not registered');
    // Never expose anything that could authenticate on its own.
    expect(JSON.stringify(accounts)).not.toContain('token');

    const hi = await request(app).get('/api/v1/auth/demo-accounts?lang=hi');
    expect(hi.body.data.accounts[0].hint).not.toBe(accounts[0].hint);
  }, 30_000);
});
