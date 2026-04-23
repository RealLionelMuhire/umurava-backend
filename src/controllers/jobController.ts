import { Request, Response } from 'express';
import { Job } from '../models/Job';

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    // --- Pagination ---
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    // --- Search ---
    const search = (req.query.search as string)?.trim();

    // --- Filters ---
    const status = req.query.status as string;
    const experienceLevel = req.query.experienceLevel as string;
    const location = req.query.location as string;

    // Build query object
    const query: Record<string, any> = {};

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { requiredSkills: regex },
      ];
    }

    if (status) query.status = status;
    if (experienceLevel) query.experienceLevel = { $regex: experienceLevel, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };

    // Execute query with pagination
    const [jobs, totalJobs] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalJobs / limit);

    res.json({
      jobs,
      totalJobs,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createJob = async (req: Request, res: Response) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
