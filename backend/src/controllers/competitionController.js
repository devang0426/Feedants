import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/respond.js';
import {
  getCompetitionDetails,
  listCompetitions,
  listCategories,
  adminUpdateCompetition,
} from '../services/competitionService.js';

export const idOrSlugParams = z.object({ idOrSlug: z.string().min(1).max(120) });
export const idParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid competition id') });

const isoDate = z.coerce.date();
export const adminUpdateSchema = z
  .object({
    status: z.enum(['draft', 'published', 'cancelled']).optional(),
    capacityTotal: z.number().int().min(1).optional(),
    schedule: z
      .object({
        registrationOpensAt: isoDate.optional(),
        registrationClosesAt: isoDate.optional(),
        submissionStartsAt: isoDate.optional(),
        submissionEndsAt: isoDate.optional(),
        resultAt: isoDate.optional(),
      })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

export const listQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  phase: z
    .enum(['upcoming', 'registration_open', 'registration_closed', 'submission_open', 'judging', 'results_announced', 'cancelled'])
    .optional(),
  lang: z.string().optional(),
});

export const getList = asyncHandler(async (req, res) => {
  const { q, category, phase } = req.query;
  const competitions = await listCompetitions({ lang: req.lang, q, category, phase });
  sendOk(res, { competitions });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await listCategories({ lang: req.lang });
  sendOk(res, { categories });
});

export const getDetails = asyncHandler(async (req, res) => {
  const competition = await getCompetitionDetails({
    idOrSlug: req.params.idOrSlug,
    user: req.user,
    lang: req.lang,
  });
  sendOk(res, { competition });
});

export const patchAdminUpdate = asyncHandler(async (req, res) => {
  const competition = await adminUpdateCompetition(req.params.id, req.body);
  sendOk(res, { competition });
});
