import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import applicantRoutes from './routes/applicants';
import screeningRoutes from './routes/screening';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/screening', screeningRoutes);

app.use(errorHandler);

async function startServer() {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment variables.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
