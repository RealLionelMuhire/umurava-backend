import { Router } from 'express';
import multer from 'multer';
import { createApplicant, getApplicantsByJob } from '../controllers/applicantController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true }); 
const upload = multer({ storage: multer.memoryStorage() });

// Route to get all applicants for a specific job
// GET /api/applicants/:jobId
router.get('/:jobId', authMiddleware, getApplicantsByJob);

// Route for a new applicant to apply to a specific job
// This handles both file uploads and resume URLs through the same controller
// POST /api/applicants/:jobId/apply
router.post('/:jobId/apply', upload.single('resume'), createApplicant);


export default router;

