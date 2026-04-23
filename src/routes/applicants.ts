import { Router } from 'express';
import multer from 'multer';
import { createApplicant, getApplicantsByJob, uploadCsv, createStructuredApplicant } from '../controllers/applicantController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/applicants?jobId=<id>  (query param — primary documented interface)
// GET /api/applicants/job/:jobId   (explicit path — documented secondary)
// GET /api/applicants/:jobId       (path param — legacy support)
router.get('/', authMiddleware, getApplicantsByJob);
router.get('/job/:jobId', authMiddleware, getApplicantsByJob);
router.get('/:jobId', authMiddleware, getApplicantsByJob);
router.post('/:jobId/apply', upload.single('resume'), createApplicant);
router.post('/upload-csv', upload.single('file'), uploadCsv);
router.post('/', createStructuredApplicant);

export default router;
