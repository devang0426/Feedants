import mongoose from 'mongoose';

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    title: { type: String, trim: true, maxlength: 120 },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['video', 'image', 'audio'], default: 'video' },
    submittedAt: { type: Date, default: Date.now },
    /** Incremented each time the participant replaces their entry. */
    revision: { type: Number, default: 1 },
  },
  { timestamps: true }
);

/** A participant has exactly one (replaceable) entry per competition. */
submissionSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

export const Submission = mongoose.model('Submission', submissionSchema);
