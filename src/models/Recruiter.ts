import { Schema, model, Document } from 'mongoose';

export interface IRecruiter extends Document {
  email: string;
  passwordHash: string;
}

const RecruiterSchema = new Schema<IRecruiter>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export const Recruiter = model<IRecruiter>('Recruiter', RecruiterSchema);
