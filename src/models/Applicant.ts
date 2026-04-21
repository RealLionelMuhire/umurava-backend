import { Schema, model, Document, Types } from 'mongoose';

export interface IApplicant extends Document {
  fullName: string;
  email: string;
  skills: string[];
  experienceYears: number;
  education: string;
  resumeUrl: string;
  rawResumeText: string;
  jobId: Types.ObjectId;
  source: 'umurava_platform' | 'external';
  profileData?: Record<string, any>;
}

const ApplicantSchema = new Schema<IApplicant>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  skills: [{ type: String }],
  experienceYears: { type: Number },
  education: { type: String },
  resumeUrl: { type: String },
  rawResumeText: { type: String },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  source: { type: String, enum: ['umurava_platform', 'external'], required: true },
  profileData: { type: Schema.Types.Mixed },
});

export const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
