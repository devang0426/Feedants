import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Payment gateway adapter. When RAZORPAY_KEY_ID/SECRET are configured this
 * talks to the real Razorpay Orders API and verifies real signatures. When
 * they are absent it runs in "mock" mode so the project works without an
 * account. The rest of the codebase never branches on the mode.
 */

const RAZORPAY_API = 'https://api.razorpay.com/v1';

export const PAYMENT_MODE = env.razorpay.keyId && env.razorpay.keySecret ? 'razorpay' : 'mock';

export const isRazorpayEnabled = () => PAYMENT_MODE === 'razorpay';

function basicAuthHeader() {
  const token = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Creates a payment order. `receipt` should be unique per attempt so the
 * gateway-side record can be traced back to our registration.
 */
export async function createOrder({ amountPaise, currency, receipt, notes = {} }) {
  if (!isRazorpayEnabled()) {
    return {
      provider: 'mock',
      orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amountPaise,
      currency,
    };
  }

  const response = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency, receipt, notes, payment_capture: 1 }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error({ status: response.status, body }, 'Razorpay order creation failed');
    throw new AppError(502, 'PAYMENT_GATEWAY_ERROR', 'Could not start payment. Please try again.');
  }
  const order = await response.json();
  return { provider: 'razorpay', orderId: order.id, amountPaise: order.amount, currency: order.currency };
}

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Razorpay checkout signature: HMAC-SHA256(orderId + "|" + paymentId, keySecret).
 * In mock mode the literal signature "mock" is accepted.
 */
export function verifyCheckoutSignature({ orderId, paymentId, signature }, secret = env.razorpay.keySecret) {
  if (!orderId || !paymentId || !signature) return false;
  if (!isRazorpayEnabled()) return signature === 'mock';
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC-SHA256(rawBody, webhookSecret) sent in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody, signature, secret = env.razorpay.webhookSecret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/** Shape sent to the client so it can open checkout. Never includes the secret. */
export function toClientPayment(payment) {
  if (!payment) return null;
  return {
    provider: payment.provider,
    orderId: payment.orderId,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    paidAt: payment.paidAt ?? null,
    mode: PAYMENT_MODE,
    keyId: isRazorpayEnabled() ? env.razorpay.keyId : null,
  };
}
