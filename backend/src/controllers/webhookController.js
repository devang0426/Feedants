import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { verifyWebhookSignature } from '../services/paymentService.js';
import { confirmRegistrationByOrder } from '../services/registrationService.js';

/**
 * Razorpay webhook. Mounted with a raw body parser because the signature is
 * computed over the exact bytes Razorpay sent. Always answers 200 for events
 * we deliberately ignore so the gateway stops retrying; answers 4xx only for
 * bad signatures.
 */
export const postRazorpayWebhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body ?? {});
  const signature = req.headers['x-razorpay-signature'];
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw AppError.badRequest('INVALID_WEBHOOK_SIGNATURE', 'Webhook signature mismatch');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw AppError.badRequest('INVALID_JSON', 'Malformed webhook body');
  }

  const payment = event?.payload?.payment?.entity;
  if (!['payment.captured', 'order.paid'].includes(event?.event) || !payment?.order_id) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  try {
    const result = await confirmRegistrationByOrder({ orderId: payment.order_id, paymentId: payment.id });
    logger.info(
      { event: event.event, orderId: payment.order_id, paymentId: payment.id, result: result?.registration?.status ?? 'unknown_order', needsRefund: result?.needsRefund ?? false },
      'Razorpay webhook processed'
    );
  } catch (err) {
    // e.g. RESERVATION_EXPIRED: the money arrived after the hold lapsed.
    logger.warn({ err, orderId: payment.order_id, paymentId: payment.id }, 'Webhook could not confirm registration');
  }
  return res.status(200).json({ ok: true });
});
