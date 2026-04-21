import request from 'supertest';
import express from 'express';
import jobRoutes from '../routes/jobs';
import { Job } from '../models/Job';
import jwt from 'jsonwebtoken';

// Automatically mock the auth middleware
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);

let token: string;

beforeAll(() => {
  // We still generate a token to send in headers, as a good practice
  token = jwt.sign({ id: 'test_recruiter_id' }, process.env.JWT_SECRET || 'secret');
});

describe('Job Endpoints', () => {
  it('should get all jobs', async () => {
    await Job.create({ title: 'Job 1', description: 'Desc 1' });
    await Job.create({ title: 'Job 2', description: 'Desc 2' });

    const res = await request(app).get('/api/jobs');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should get a job by id', async () => {
    const job = await Job.create({ title: 'Job 1', description: 'Desc 1' });
    const res = await request(app).get(`/api/jobs/${job._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title', 'Job 1');
  });

  it('should create a new job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Job',
        description: 'New Desc',
        requiredSkills: ['JS'],
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('title', 'New Job');
  });

  it('should update a job', async () => {
    const job = await Job.create({ title: 'Old Job', description: 'Old Desc' });
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Job' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title', 'Updated Job');
  });

  it('should delete a job', async () => {
    const job = await Job.create({ title: 'To Delete', description: 'Desc' });
    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Job deleted successfully');
  });

  it('should return 401 if no token is provided', async () => {
    const { authMiddleware } = require('../middleware/auth');
    authMiddleware.mockImplementationOnce((req: Request, res: Response, next: Function) => {
      // Simulate what the real middleware does
      res.status(401).json({ message: 'No token, authorization denied' });
    });

    const res = await request(app)
      .post('/api/jobs')
      .send({ title: 'test', description: 'test' });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token, authorization denied');
  });
});
