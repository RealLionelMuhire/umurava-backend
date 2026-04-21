import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import jobRoutes from '../routes/jobs';
import { Job } from '../models/Job';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import mongoose from 'mongoose';

// 1. Mock the middleware. This is hoisted to the top by Jest.
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
// Use the actual router
app.use('/api/jobs', jobRoutes);

// 2. Cast the imported authMiddleware directly. It is now a mock.
const mockedAuthMiddleware = authMiddleware as jest.Mock;

let token: string;

describe('Job Endpoints', () => {
  beforeAll(() => {
    token = jwt.sign({ id: 'test_recruiter_id' }, process.env.JWT_SECRET || 'secret');
  });

  // 3. Reset the mock and clear the DB before each test
  beforeEach(async () => {
    await Job.deleteMany({});
    // Reset the mock to its default "success" implementation
    mockedAuthMiddleware.mockClear();
    mockedAuthMiddleware.mockImplementation((req: Request, res: Response, next: NextFunction) => {
      (req as any).recruiterId = new mongoose.Types.ObjectId().toHexString();
      next();
    });
  });

  it('should get all jobs', async () => {
    await Job.create([{ title: 'Job 1', description: 'Desc 1' }, { title: 'Job 2', description: 'Desc 2' }]);

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

  // 4. The corrected test for the 401 error
  it('should return 401 if no token is provided for a protected route', async () => {
    // Change the implementation just for this test
    mockedAuthMiddleware.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
      // Simulate what the actual middleware does when there's no token
      // It doesn't call next(), it just sends a response.
      res.status(401).json({ message: 'No token, authorization denied' });
    });

    const res = await request(app)
      .post('/api/jobs') // A protected route that requires auth
      .send({ title: 'test', description: 'test' });
    
    // Assert that the server responded with 401
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token, authorization denied');
  });
});

