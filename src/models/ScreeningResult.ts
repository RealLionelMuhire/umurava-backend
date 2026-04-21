import { Schema, model, Document, Types } from 'mongoose';

interface IShortlistItem {
  applicantId: Types.ObjectId;
  rank: number;
  matchScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface IScreeningResult extends Document {
  jobId: Types.ObjectId;
  shortlist: IShortlistItem[];
  createdAt: Date;
}

const ScreeningResultSchema = new Schema<IScreeningResult>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  shortlist: [
    {
      applicantId: { type: Schema.Types.ObjectId, ref: 'Applicant', required: true },
      rank: { type: Number, required: true },
      matchScore: { type: Number, required: true },
      strengths: [{ type: String }],
      gaps: [{ type: String }],
      recommendation: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ScreeningResult = model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);
