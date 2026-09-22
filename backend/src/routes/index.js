import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { optionalAuth, requireAuth, requireAdminKey } from '../middleware/auth.js';
import { sendOk } from '../utils/respond.js';
import * as auth from '../controllers/authController.js';
import * as competitions from '../controllers/competitionController.js';
import * as registrations from '../controllers/registrationController.js';
import * as submissions from '../controllers/submissionController.js';
import { seedDatabase } from '../seed/seed.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * Tighter limit for state-changing endpoints. Keyed by user (falls back to
 * IP) so thousands of users behind one carrier NAT are not throttled together.
 * Mounted after `requireAuth` so `req.user` is available.
 */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user._id}` : `ip:${req.ip}`),
  skip: () => env.isTest,
  message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const router = Router();

router.get('/health', (_req, res) => sendOk(res, { status: 'ok' }));

// --- Auth -------------------------------------------------------------------
router.post('/auth/demo-login', validate({ body: auth.demoLoginSchema }), auth.postDemoLogin);
router.get('/auth/demo-accounts', auth.getDemoAccounts);
router.get('/auth/me', requireAuth, auth.getMe);

// --- Current user ----------------------------------------------------------
router.get('/me/registrations', requireAuth, registrations.getMyRegistrations);

// --- Competitions (read) ---------------------------------------------------
router.get('/competitions', optionalAuth, validate({ query: competitions.listQuerySchema }), competitions.getList);
router.get('/competitions/categories', competitions.getCategories);
router.get(
  '/competitions/:idOrSlug',
  optionalAuth,
  validate({ params: competitions.idOrSlugParams }),
  competitions.getDetails
);

// --- Registration lifecycle ---------------------------------------------------
router.post(
  '/competitions/:id/registrations',
  requireAuth,
  writeLimiter,
  validate({ params: competitions.idParams }),
  registrations.postRegister
);
router.post(
  '/competitions/:id/registrations/confirm',
  requireAuth,
  writeLimiter,
  validate({ params: competitions.idParams, body: registrations.confirmPaymentSchema }),
  registrations.postConfirmPayment
);
router.delete(
  '/competitions/:id/registrations',
  requireAuth,
  writeLimiter,
  validate({ params: competitions.idParams }),
  registrations.deleteRegistration
);

// --- Submissions --------------------------------------------------------------
router.put(
  '/competitions/:id/submissions',
  requireAuth,
  writeLimiter,
  validate({ params: competitions.idParams, body: submissions.submissionSchema }),
  submissions.putSubmission
);

// --- Admin / operations -------------------------------------------------------
router.patch(
  '/admin/competitions/:id',
  requireAdminKey,
  validate({ params: competitions.idParams, body: competitions.adminUpdateSchema }),
  competitions.patchAdminUpdate
);
router.post(
  '/admin/seed',
  requireAdminKey,
  asyncHandler(async (_req, res) => {
    const summary = await seedDatabase({ reset: true });
    sendOk(res, summary);
  })
);
