import { Competition, Registration, REGISTRATION_STATUS, Submission } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { canSubmit } from './lifecycle.js';

const SUBMISSION_ERRORS = {
  COMPETITION_NOT_PUBLISHED: 'This competition is not accepting submissions',
  SUBMISSION_NOT_OPEN: 'Submissions have not opened yet',
  SUBMISSION_CLOSED: 'Submissions have closed',
};

/**
 * Creates or replaces the participant's entry. Only confirmed (paid)
 * participants may submit, and only inside the submission window.
 */
export async function upsertSubmission({ competitionId, userId, title, mediaUrl, mediaType, now }) {
  const competition = await Competition.findById(competitionId).lean();
  if (!competition) throw AppError.notFound('COMPETITION_NOT_FOUND', 'Competition not found');

  const rule = canSubmit(competition, now);
  if (!rule.ok) throw AppError.conflict(rule.code, SUBMISSION_ERRORS[rule.code]);

  const registration = await Registration.findOne({
    competitionId,
    userId,
    status: REGISTRATION_STATUS.CONFIRMED,
  }).lean();
  if (!registration) {
    throw AppError.forbidden('Only registered participants can upload a submission');
  }

  const submission = await Submission.findOneAndUpdate(
    { competitionId, userId },
    {
      $set: { title, mediaUrl, mediaType, submittedAt: now },
      $setOnInsert: { competitionId, userId, registrationId: registration._id },
      $inc: { revision: 1 },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return submission;
}

export async function findUserSubmission(competitionId, userId) {
  if (!userId) return null;
  return Submission.findOne({ competitionId, userId }).lean();
}
