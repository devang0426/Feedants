import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/respond.js';
import { upsertSubmission } from '../services/submissionService.js';
import { getCompetitionDetails } from '../services/competitionService.js';

export const submissionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  mediaUrl: z.string().url().max(2048),
  mediaType: z.enum(['video', 'image', 'audio']).default('video'),
});

export const putSubmission = asyncHandler(async (req, res) => {
  const submission = await upsertSubmission({
    competitionId: req.params.id,
    userId: req.user._id,
    ...req.body,
    now: new Date(),
  });
  const competition = await getCompetitionDetails({
    idOrSlug: req.params.id,
    user: req.user,
    lang: req.lang,
  });
  sendOk(res, { submissionId: String(submission._id), revision: submission.revision, competition }, 200);
});
