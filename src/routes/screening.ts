import { Router } from 'express';
import { runScreeningForJob, getScreeningResultForJob } from '../controllers/screeningController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/:jobId', authMiddleware, runScreeningForJob);
router.get('/:jobId', authMiddleware, getScreeningResultForJob);

export default router;
