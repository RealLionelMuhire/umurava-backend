import { Router } from 'express';
import multer from 'multer';
import { createApplicant, getApplicantsByJob, uploadCsv, createStructuredApplicant } from '../controllers/applicantController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true }); 
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:jobId', authMiddleware, getApplicantsByJob);
// Oh wait, in previous working script we had: router.get('/job/:jobId', authMiddleware, getApplicantsByJob);
router.get('/job/:jobId', authMiddleware, getApplicantsByJob);
router.post('/:jobId/apply', upload.single('resume'), createApplicant);
router.post('/upload-csv', upload.single('file'), uploadCsv);
router.post('/', createStructuredApplicant);

export default router;
