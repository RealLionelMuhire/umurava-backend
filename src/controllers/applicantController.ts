import { Request, Response, NextFunction } from 'express';
import { Applicant } from '../models/Applicant';
import { Job } from '../models/Job';
import pdf from 'pdf-parse';
import axios from 'axios';
import { z } from 'zod';

// Zod schema for validating the application input
const applicantSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
});

/**
 * Handles the creation of a new applicant for a specific job.
 * It can accept a resume via file upload or a URL.
 */
export const createApplicant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const validation = applicantSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid input', errors: validation.error.format() });
    }

    const { fullName, email, resumeUrl } = validation.data;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let rawResumeText = '';

    // Case 1: Resume is provided as a file upload
    if (req.file) {
      const data = await pdf(req.file.buffer);
      rawResumeText = data.text;
    } 
    // Case 2: Resume is provided as a URL
    else if (resumeUrl) {
      const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
      // Check if the response is a PDF before parsing
      if (response.headers['content-type'] === 'application/pdf') {
        const data = await pdf(response.data);
        rawResumeText = data.text;
      } else {
        // If it's not a PDF (e.g., a markdown file from gist), treat it as plain text
        rawResumeText = Buffer.from(response.data).toString('utf-8');
      }
    } 
    // Case 3: No resume provided
    else {
      return res.status(400).json({ message: 'Either a resume file or a resumeUrl is required.' });
    }

    const newApplicant = new Applicant({
      fullName,
      email,
      jobId,
      rawResumeText,
      resumeUrl: req.file ? `uploads/${req.file.originalname}` : resumeUrl,
      source: 'external',
      status: 'applied',
    });

    await newApplicant.save();

    res.status(201).json({ message: 'Application submitted successfully', applicant: newApplicant });

  } catch (error) {
    console.error('Error in createApplicant:', error);
    next(error);
  }
};

/**
 * Retrieves all applicants associated with a specific job.
 */
export const getApplicantsByJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const applicants = await Applicant.find({ jobId });
    if (!applicants) {
      return res.status(404).json({ message: 'No applicants found for this job' });
    }
    res.status(200).json(applicants);
  } catch (error) {
    next(error);
  }
};
