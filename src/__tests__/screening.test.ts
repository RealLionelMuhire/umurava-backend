import request from 'supertest';
import express from 'express';
import screeningRoutes from '../routes/screening';
import { Job } from '../models/Job';
import { Applicant } from '../models/Applicant';
import { ScreeningResult } from '../models/ScreeningResult';
import * as geminiService from '../services/ai/geminiService';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Automatically mock the auth middleware
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/screening', screeningRoutes);

let token: string;
let jobId: string;
let applicantId: mongoose.Types.ObjectId;

beforeEach(async () => {
  token = jwt.sign({ id: 'test_recruiter_id' }, process.env.JWT_SECRET || 'secret');

  const job = await Job.create({ title: 'Screening Job', description: 'Desc' });
  jobId = job._id.toString();

  const applicant = await Applicant.create({ fullName: 'Candidate 1', email: 'cand1@test.com', jobId, rawResumeText: 'Skills in JS', source: 'external' });
  applicantId = applicant._id;
  await Applicant.create({ fullName: 'Candidate 2', email: 'cand2@test.com', jobId, rawResumeText: 'Skills in Python', source: 'external' });
});

// Mock the AI service to avoid actual API calls during tests
jest.mock('../services/ai/geminiService');
const mockedRunScreening = geminiService.runScreening as jest.Mock;

describe('Screening Endpoints', () => {
  it('should run screening for a job and return a shortlist', async () => {
    mockedRunScreening.mockResolvedValue({
      shortlist: [
        { rank: 1, applicantId: applicantId.toString(), matchScore: 90, strengths: [], gaps: [], recommendation: 'Good fit' }
      ],
      error: null
    });

    const res = await request(app)
      .post(`/api/screening/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('shortlist');
    expect(res.body.shortlist.length).toBe(1);
    
    const job = await Job.findById(jobId);
    expect(job?.status).toEqual('shortlisted');
  });

  it('should get the latest screening result for a job', async () => {
    await new ScreeningResult({ jobId, shortlist: [{ rank: 1, applicantId: applicantId, matchScore: 80 }] }).save();

    const res = await request(app)
      .get(`/api/screening/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('shortlist');
  });

  it('should handle screening failure gracefully', async () => {
    mockedRunScreening.mockResolvedValue({
      shortlist: [],
      error: 'AI service failed'
    });

    const res = await request(app)
      .post(`/api/screening/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'AI screening failed');

    const job = await Job.findById(jobId);
    expect(job?.status).toEqual('open');
  });
});
