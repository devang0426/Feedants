import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/respond.js';
import {
  registerForCompetition,
  confirmRegistrationPayment,
  cancelRegistration,
} from '../services/registrationService.js';
import { getCompetitionDetails } from '../services/competitionService.js';
import { toClientPayment } from '../services/paymentService.js';

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1).max(120),
  signature: z.string().min(1).max(256),
});

/**
 * Every mutation returns the refreshed screen view-model alongside its own
 * result so the client can re-render in one round-trip without a second GET.
 */
const withDetails = async (req, extra, status = 200) => {
  const competition = await getCompetitionDetails({
    idOrSlug: req.params.id,
    user: req.user,
    lang: req.lang,
  });
  return { ...extra, competition, status };
};

export const postRegister = asyncHandler(async (req, res) => {
  const { registration, payment, reused } = await registerForCompetition({
    competitionId: req.params.id,
    userId: req.user._id,
  });
  const { status, ...data } = await withDetails(
    req,
    {
      registrationStatus: registration.status,
      payment: payment ? toClientPayment(payment) : null,
      reused,
    },
    reused ? 200 : 201
  );
  sendOk(res, data, status);
});

export const postConfirmPayment = asyncHandler(async (req, res) => {
  const { registration, alreadyConfirmed } = await confirmRegistrationPayment({
    competitionId: req.params.id,
    userId: req.user._id,
    paymentId: req.body.paymentId,
    signature: req.body.signature,
  });
  const { status, ...data } = await withDetails(req, {
    registrationStatus: registration.status,
    alreadyConfirmed,
  });
  sendOk(res, data, status);
});

export const deleteRegistration = asyncHandler(async (req, res) => {
  const { registration } = await cancelRegistration({
    competitionId: req.params.id,
    userId: req.user._id,
  });
  const { status, ...data } = await withDetails(req, { registrationStatus: registration.status });
  sendOk(res, data, status);
});
