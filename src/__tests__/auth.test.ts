import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { Recruiter } from '../models/Recruiter';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
  it('should register a new recruiter', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Recruiter registered successfully');
  });

  it('should not register a recruiter with an existing email', async () => {
    await new Recruiter({ email: 'test2@example.com', passwordHash: 'hashed' }).save();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test2@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Recruiter already exists');
  });

  it('should login a recruiter and return a token', async () => {
    const resRegister = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });
    expect(resRegister.statusCode).toEqual(201);

    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });
    expect(resLogin.statusCode).toEqual(200);
    expect(resLogin.body).toHaveProperty('token');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});
