import { Router } from 'express';
import multer from 'multer';
import { uploadCsv, uploadResume, createApplicant, getApplicantsByJob, uploadResumeLink } from '../controllers/applicantController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-csv', upload.single('file'), uploadCsv);
router.post('/upload-resume', upload.single('file'), uploadResume);
router.post('/upload-resume-link', uploadResumeLink);
router.post('/', createApplicant);
router.get('/', getApplicantsByJob);

export default router;
