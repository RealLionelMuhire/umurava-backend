import { Router } from 'express';
import { getAllJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController';
import { authMiddleware } from '../middleware/auth';
import express from 'express';

const router = Router();

// Middleware to attach the app instance for testing purposes
router.use((req, res, next) => {
  req.app.use(express.json());
  next();
});

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);

export default router;
