import { Request, Response, NextFunction } from 'express';
import { Applicant } from '../models/Applicant';
import { Job } from '../models/Job';
import pdf from 'pdf-parse';
import axios from 'axios';
import { z } from 'zod';
import { extractResumeData } from '../services/ai/geminiService';

// Zod schema for validating the application input
const applicantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  headline: z.string().min(1, 'Headline is required'),
  location: z.string().min(1, 'Location is required'),
  skills: z.array(z.any()).min(1, 'At least one skill is required'),
  experience: z.array(z.any()).min(1, 'At least one experience entry is required'),
  education: z.array(z.any()).min(1, 'At least one education entry is required'),
  projects: z.array(z.any()).min(1, 'At least one project is required'),
  availability: z.any(),
  // optional fields
  bio: z.string().optional(),
  languages: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  socialLinks: z.any().optional(),
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

    const { firstName, lastName, headline, location, skills, experience, education, projects, availability, email, resumeUrl, bio, languages, certifications, socialLinks } = validation.data;

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
      firstName,
      lastName,
      email,
      headline,
      location,
      skills,
      experience,
      education,
      projects,
      availability,
      bio,
      languages,
      certifications,
      socialLinks,
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
    const jobId = (req.query.jobId as string) || req.params.jobId;
    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required (provide as ?jobId= query param or /:jobId path param)' });
    }
    const applicants = await Applicant.find({ jobId });
    if (!applicants) {
      return res.status(404).json({ message: 'No applicants found for this job' });
    }
    res.status(200).json(applicants);
  } catch (error) {
    next(error);
  }
};

export const uploadCsv = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.body;
  if (!req.file || !jobId) {
    return res.status(400).json({ message: 'File and jobId are required' });
  }

  try {
    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const applicantsJson = xlsx.utils.sheet_to_json(worksheet) as any[];

    const processedApplicants = applicantsJson.map(data => {
      const nameParts = (data.fullName || 'CSV Profile').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const skillsArray = typeof data.skills === 'string'
        ? data.skills.split(' ').map((s: string) => ({ name: s, level: 'Beginner', yearsOfExperience: data.experienceYears || 1 }))
        : [];

      return {
        ...data,
        firstName,
        lastName,
        headline: 'CSV Imported Candidate',
        location: 'Remote',
        skills: skillsArray.length > 0 ? skillsArray : [{ name: 'General', level: 'Beginner', yearsOfExperience: 1 }],
        experience: [{ company: 'Unknown', role: 'Worker', startDate: '2020-01-01', endDate: '2023-01-01', description: 'Imported', technologies: [], isCurrent: false }],
        education: [{ institution: 'Unknown', degree: 'Unknown', fieldOfStudy: 'Unknown', startYear: 2015, endYear: 2019 }],
        projects: [{ name: 'Unknown', description: 'Imported', technologies: [], role: 'Worker', startDate: '2020-01-01', endDate: '2021-01-01' }],
        availability: { status: 'Available', type: 'Full-time' },
        jobId,
        source: 'external',
        rawResumeText: data.skills ? String(data.skills) : 'CSV Import' // mock raw text
      };
    });

    await Applicant.insertMany(processedApplicants);
    res.status(201).json({ message: 'Applicants from CSV uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, fullName, email } = req.body;
    if (!jobId || !fullName || !req.file) {
      return res.status(400).json({ message: 'jobId, fullName, and file are required' });
    }

    const data = await pdf(req.file.buffer);
    const rawResumeText = data.text;

    const nameParts = fullName.split(' ');
    let firstName = nameParts[0];
    let lastName = nameParts.slice(1).join(' ') || 'User';

    // Default placeholders
    let headline = 'PDF Upload Candidate';
    let location = 'Remote';
    let skills = [{ name: 'General', level: 'Beginner', yearsOfExperience: 1 }];
    let experience = [{ company: 'Unknown', role: 'Candidate', startDate: '2020-01-01', endDate: '2023-01-01', description: 'Uploaded Profile', technologies: [], isCurrent: false }];
    let education = [{ institution: 'Unknown', degree: 'Unknown', fieldOfStudy: 'Unknown', startYear: 2015, endYear: 2019 }];
    let projects = [{ name: 'Unknown', description: 'Uploaded Profile', technologies: [], role: 'Candidate', startDate: '2020-01-01', endDate: '2021-01-01' }];

    // Attempt to extract structured data via Gemini
    const aiData = await extractResumeData(rawResumeText);
    if (aiData) {
      if (aiData.firstName) firstName = aiData.firstName;
      if (aiData.lastName) lastName = aiData.lastName;
      if (aiData.headline) headline = aiData.headline;
      if (aiData.location) location = aiData.location;
      if (aiData.skills && aiData.skills.length > 0) skills = aiData.skills;
      if (aiData.experience && aiData.experience.length > 0) experience = aiData.experience;
      if (aiData.education && aiData.education.length > 0) education = aiData.education;
    }

    const newApplicant = new Applicant({
      firstName,
      lastName,
      email: email || 'uploaded@example.com',
      headline,
      location,
      skills,
      experience,
      education,
      projects,
      availability: { status: 'Available', type: 'Full-time' },
      jobId,
      rawResumeText,
      resumeUrl: `uploads/${req.file.originalname}`,
      source: 'external',
      status: 'applied',
    });

    await newApplicant.save();
    res.status(201).json({ message: 'Resume uploaded successfully', applicant: newApplicant });
  } catch (error) {
    next(error);
  }
};


export const createStructuredApplicant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newApplicant = new Applicant({
      ...req.body,
      source: 'umurava_platform',
      status: 'applied',
      rawResumeText: req.body.skills ? JSON.stringify(req.body.skills) : 'Structured Profile'
    });
    await newApplicant.save();
    res.status(201).json(newApplicant);
  } catch (error) {
    next(error);
  }
};
