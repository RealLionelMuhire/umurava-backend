import { Request, Response } from 'express';
import { Applicant } from '../models/Applicant';
import xlsx from 'xlsx';
import pdf from 'pdf-parse';
import axios from 'axios';

export const uploadCsv = async (req: Request, res: Response) => {
  const { jobId } = req.body;
  if (!req.file || !jobId) {
    return res.status(400).json({ message: 'File and jobId are required' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const applicantsJson = xlsx.utils.sheet_to_json(worksheet) as any[];

    const applicants = applicantsJson.map(data => ({
      ...data,
      jobId,
      source: 'external',
    }));

    await Applicant.insertMany(applicants);
    res.status(201).json({ message: 'Applicants from CSV uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const uploadResume = async (req: Request, res: Response) => {
  const { jobId, fullName, email } = req.body;
  if (!req.file || !jobId || !fullName || !email) {
    return res.status(400).json({ message: 'File, jobId, fullName, and email are required' });
  }

  try {
    const data = await pdf(req.file.buffer);
    const newApplicant = new Applicant({
      fullName,
      email,
      jobId,
      rawResumeText: data.text,
      resumeUrl: `uploads/resumes/${req.file.filename}`,
      source: 'external',
    });
    await newApplicant.save();
    res.status(201).json(newApplicant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const uploadResumeLink = async (req: Request, res: Response) => {
  const { resumeUrl, fullName, email, jobId } = req.body;

  if (!resumeUrl || !fullName || !email || !jobId) {
    return res.status(400).json({ message: 'resumeUrl, fullName, email, and jobId are required' });
  }

  try {
    const response = await axios.get(resumeUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });

    if (response.headers['content-type'] !== 'application/pdf') {
      return res.status(400).json({ message: 'URL does not point to a PDF file.' });
    }

    const data = await pdf(response.data);

    const newApplicant = new Applicant({
      fullName,
      email,
      jobId,
      rawResumeText: data.text,
      resumeUrl,
      source: 'external',
    });

    await newApplicant.save();
    res.status(201).json(newApplicant);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(500).json({ message: 'Failed to fetch the resume from the URL.', details: error.message });
    }
    res.status(500).json({ message: 'Server error while processing resume link.', error });
  }
};

export const createApplicant = async (req: Request, res: Response) => {
  try {
    const newApplicant = new Applicant({
      ...req.body,
      source: 'umurava_platform',
    });
    await newApplicant.save();
    res.status(201).json(newApplicant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getApplicantsByJob = async (req: Request, res: Response) => {
  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ message: 'jobId is required' });
  }

  try {
    const applicants = await Applicant.find({ jobId });
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
