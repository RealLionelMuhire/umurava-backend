import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/Job';
import { Applicant } from '../models/Applicant';
import { ScreeningResult } from '../models/ScreeningResult';
import { runScreening } from '../services/ai/geminiService';

export const runScreeningForJob = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'screening';
    await job.save();

    const applicants = await Applicant.find({ jobId });
    if (applicants.length === 0) {
      return res.status(404).json({ message: 'No applicants found for this job' });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const { shortlist, error } = await runScreening(job, applicants, limit);

    if (error) {
      job.status = 'open'; // Revert status on error
      await job.save();
      return res.status(500).json({ message: 'AI screening failed', details: error });
    }

    const newScreeningResult = new ScreeningResult({
      jobId,
      shortlist,
    });

    await newScreeningResult.save();

    job.status = 'shortlisted';
    await job.save();

    res.status(201).json(newScreeningResult);
  } catch (err) {
    next(err);
  }
};

export const getScreeningResultForJob = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  try {
    const result = await ScreeningResult.findOne({ jobId }).sort({ createdAt: -1 });

    if (!result) {
      return res.status(404).json({ message: 'No screening result found for this job' });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
