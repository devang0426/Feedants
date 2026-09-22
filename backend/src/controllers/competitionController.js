import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/respond.js';
import {
  getCompetitionDetails,
  listCompetitions,
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

export const getList = asyncHandler(async (req, res) => {
  const competitions = await listCompetitions({ lang: req.lang });
  sendOk(res, { competitions });
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
