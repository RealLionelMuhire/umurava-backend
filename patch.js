const fs = require('fs');
const applicantModelCode = `
import { Schema, model, Document, Types } from 'mongoose';

export interface ISkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
}

export interface ILanguage {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface IExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface IProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link?: string;
  startDate: string;
  endDate: string;
}

export interface IAvailability {
  status: 'Available' | 'Open to Opportunities' | 'Not Available';
  type: 'Full-time' | 'Part-time' | 'Contract';
  startDate?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface IApplicant extends Document {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  skills: ISkill[];
  languages?: ILanguage[];
  experience: IExperience[];
  education: IEducation[];
  certifications?: ICertification[];
  projects: IProject[];
  availability: IAvailability;
  socialLinks?: ISocialLinks;
  jobId: Types.ObjectId;
  source: 'umurava_platform' | 'external';
  rawResumeText?: string;
}

const SkillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  yearsOfExperience: { type: Number, required: true }
});

const LanguageSchema = new Schema<ILanguage>({
  name: { type: String, required: true },
  proficiency: { type: String, enum: ['Basic', 'Conversational', 'Fluent', 'Native'], required: true }
});

const ExperienceSchema = new Schema<IExperience>({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [{ type: String }],
  isCurrent: { type: Boolean, required: true }
});

const EducationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true }
});

const CertificationSchema = new Schema<ICertification>({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: String, required: true }
});

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [{ type: String }],
  role: { type: String, required: true },
  link: { type: String },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true }
});

const AvailabilitySchema = new Schema<IAvailability>({
  status: { type: String, enum: ['Available', 'Open to Opportunities', 'Not Available'], required: true },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], required: true },
  startDate: { type: String }
});

const SocialLinksSchema = new Schema<ISocialLinks>({
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String }
});

const ApplicantSchema = new Schema<IApplicant>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  headline: { type: String, required: true },
  bio: { type: String },
  location: { type: String, required: true },
  skills: { type: [SkillSchema], required: true },
  languages: { type: [LanguageSchema] },
  experience: { type: [ExperienceSchema], required: true },
  education: { type: [EducationSchema], required: true },
  certifications: { type: [CertificationSchema] },
  projects: { type: [ProjectSchema], required: true },
  availability: { type: AvailabilitySchema, required: true },
  socialLinks: { type: SocialLinksSchema },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  source: { type: String, enum: ['umurava_platform', 'external'], required: true },
  rawResumeText: { type: String },
});

export const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
`;
fs.writeFileSync('src/models/Applicant.ts', applicantModelCode);

let geminiCode = fs.readFileSync('src/services/ai/geminiService.ts', 'utf8');
geminiCode = geminiCode.replace(
  /\`\s+\*\*Applicant Profile:\*\*[\s\S]*?\`\)\.join\(\'\'\);/,
  \`\`
    **Applicant Profile:**
    - ID: \${applicant._id}
    - Name: \${applicant.firstName} \${applicant.lastName}
    - Headline: \${applicant.headline}
    - Location: \${applicant.location}
    - Skills: \${applicant.skills?.map(s => \`\${s.name} (\${s.level}, \${s.yearsOfExperience} yrs)\`).join(', ') || ''}
    - Experience: \${applicant.experience?.map(e => \`Role: \${e.role} at \${e.company}. Tech: \${e.technologies?.join(', ')}. Desc: \${e.description}\`).join(' | ') || ''}
    - Education: \${applicant.education?.map(ed => \`\${ed.degree} in \${ed.fieldOfStudy} at \${ed.institution}\`).join(' | ') || ''}
    - Certifications: \${applicant.certifications?.map(c => \`\${c.name} from \${c.issuer}\`).join(', ') || 'None'}
    - Projects Tech: \${applicant.projects?.map(p => \`\${p.name}: \${p.technologies?.join(', ')}\`).join(' | ') || 'None'}
    - Raw Resume Text Fallback: \${applicant.rawResumeText ? applicant.rawResumeText.substring(0, 1000) + '...' : 'N/A'}
  \`).join('');\`
);
fs.writeFileSync('src/services/ai/geminiService.ts', geminiCode);

let controllerCode = fs.readFileSync('src/controllers/applicantController.ts', 'utf8');
const newZodSchema = \`// Zod schema for validating the application input
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
  availability: z.any({ required_error: "Availability is required" }),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  bio: z.string().optional(),
  languages: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  socialLinks: z.any().optional(),
});\`;

controllerCode = controllerCode.replace(
  /\/\/ Zod schema for validating the application input[\s\S]*?\}\);/,
  newZodSchema
);

controllerCode = controllerCode.replace(
  /const { fullName, email, resumeUrl } = validation.data;/,
  \`const { firstName, lastName, headline, location, skills, experience, education, projects, availability, email, resumeUrl, bio, languages, certifications, socialLinks } = validation.data;\`
);

controllerCode = controllerCode.replace(
  /fullName,\s*email,/,
  \`firstName,\\n      lastName,\\n      headline,\\n      location,\\n      skills,\\n      experience,\\n      education,\\n      projects,\\n      availability,\\n      bio,\\n      languages,\\n      certifications,\\n      socialLinks,\\n      email,\`
);

fs.writeFileSync('src/controllers/applicantController.ts', controllerCode);
console.log('Patched');
