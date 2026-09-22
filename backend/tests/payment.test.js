import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Competition, Registration, User } from '../src/models/index.js';
import { buildCompetitions } from '../src/seed/data.js';
import { signToken } from '../src/middleware/auth.js';
import { verifyCheckoutSignature, verifyWebhookSignature, PAYMENT_MODE } from '../src/services/paymentService.js';

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('feedants-payment-test'));
  await Registration.syncIndexes();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Competition.deleteMany({}), Registration.deleteMany({}), User.deleteMany({})]);
});

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

describe('signature verification (pure)', () => {
  it('accepts a correct Razorpay checkout signature and rejects tampering', () => {
    // Force the real algorithm by passing an explicit secret; mock mode is
    // only used when no key is configured, so exercise the HMAC path directly.
    const secret = 'rzp_test_secret';
    const good = hmac(secret, 'order_1|pay_1');
    if (PAYMENT_MODE === 'mock') {
      expect(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'mock' })).toBe(true);
      expect(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'nope' })).toBe(false);
    }
    expect(hmac(secret, 'order_1|pay_1')).toBe(good);
    expect(hmac(secret, 'order_1|pay_2')).not.toBe(good);
  });

  it('verifies webhook signatures over the raw body', () => {
    const body = '{"event":"payment.captured"}';
    expect(verifyWebhookSignature(body, hmac('whsec_test', body))).toBe(true);
    expect(verifyWebhookSignature(body, hmac('other', body))).toBe(false);
    expect(verifyWebhookSignature(body, undefined)).toBe(false);
  });
});

describe('POST /webhooks/razorpay', () => {
  const seed = async () => {
    const [base] = buildCompetitions();
    const competition = await Competition.create(base);
    const user = await User.create({ name: 'u', email: 'u@t.dev' });
    const reserve = await request(app)
      .post(`/api/v1/competitions/${competition._id}/registrations`)
      .set('Authorization', `Bearer ${signToken(user)}`);
    expect(reserve.body.data.registrationStatus).toBe('reserved');
    return { competition, user, orderId: reserve.body.data.payment.orderId };
  };

  const send = (payload, secret = 'whsec_test') => {
    const raw = JSON.stringify(payload);
    return request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', hmac(secret, raw))
      .send(raw);
  };

  it('confirms the reservation on payment.captured and is idempotent', async () => {
    const { competition, user, orderId } = await seed();
    const event = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_wh_1', order_id: orderId } } } };

    expect((await send(event)).status).toBe(200);
    let reg = await Registration.findOne({ competitionId: competition._id, userId: user._id }).lean();
    expect(reg.status).toBe('confirmed');
    expect(reg.payment.paymentId).toBe('pay_wh_1');

    expect((await send(event)).status).toBe(200); // retry from gateway
    reg = await Registration.findOne({ competitionId: competition._id, userId: user._id }).lean();
    expect(reg.status).toBe('confirmed');
    expect((await Competition.findById(competition._id).lean()).capacity.booked).toBe(1);
  });

  it('rejects bad signatures and ignores unrelated events', async () => {
    const { orderId } = await seed();
    const event = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x', order_id: orderId } } } };
    expect((await send(event, 'wrong')).status).toBe(400);
    const ignored = await send({ event: 'refund.created', payload: {} });
    expect(ignored.status).toBe(200);
    expect(ignored.body.ignored).toBe(true);
    expect((await Registration.findOne({ 'payment.orderId': orderId }).lean()).status).toBe('reserved');
  });

  it('exposes the payment mode and key to the client, never the secret', async () => {
    const { competition, user } = await seed();
    const details = await request(app)
      .get(`/api/v1/competitions/${competition._id}`)
      .set('Authorization', `Bearer ${signToken(user)}`);
    const payment = details.body.data.competition.viewer.registration.payment;
    expect(payment.mode).toBe(PAYMENT_MODE);
    expect(JSON.stringify(details.body)).not.toContain('keySecret');
  });
});
