import { Router } from 'express';
import { getAllJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);

export default router;
