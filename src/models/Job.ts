import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  educationLevel: string;
  location: string;
  status: string;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  experienceLevel: { type: String },
  educationLevel: { type: String },
  location: { type: String },
  status: { type: String, enum: ["open", "screening", "shortlisted"], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});

export const Job = model<IJob>('Job', JobSchema);
