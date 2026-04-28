/**
 * @file geminiService.ts
 * @description Interacts with the Google Gemini API for AI-powered screening.
 *
 * AI Decision Framework
 * - Temperature: 0.1 (near-deterministic)
 * - TopP: 0.8, TopK: 40 (limited token selection)
 * - All scoring anchored to job requirements
 * - Relevance gate prevents unrelated profiles scoring above 25
 * - Post-processing validation corrects any inconsistencies
 * - Weights: Skills 40%, Experience 30%, Education 20%, Projects 10%
 *
 * KNOWN LIMITATIONS & ASSUMPTIONS:
 * - Subjectivity: AI scoring, even with weighting, has inherent subjectivity and may not perfectly mirror a human recruiter's intuition.
 * - Data Quality: The model's output is highly dependent on the quality and completeness of the applicant data provided (e.g., parsed resume text).
 * - Prompt Sensitivity: Minor changes to the prompt structure or wording could lead to varied or unexpected results.
 * - No Real-Time Verification: The model cannot verify claims made in a resume (e.g., certifications, past employment). It takes the data at face value.
 * - Bias Risk: The model may inadvertently amplify biases present in the training data or the provided applicant information.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IJob } from '../../models/Job';
import { IApplicant } from '../../models/Applicant';

interface ScreeningResultItem {
  rank: number;
  applicantId: string;
  matchScore: number;
  strengths: string[];
  gaps: string[];
  relevanceToRole: string;
  recommendation: string;
  shortlisted: boolean;
  reasonForNotShortlisting: string | null;
}

/**
 * Builds a detailed prompt for the Gemini API to screen applicants against a job.
 * @param job The job details.
 * @param applicants An array of applicant details.
 * @param limit The number of top candidates to return.
 * @returns A formatted string to be used as the prompt.
 */
export const buildScreeningPrompt = (job: IJob, applicants: IApplicant[], limit: number): string => {
  const instructions = `
Evaluate these candidates ONLY against this specific job. Every decision must reference these exact requirements:

JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description}
REQUIRED SKILLS: ${job.requiredSkills.join(', ')}
EXPERIENCE LEVEL: ${job.experienceLevel || 'Not specified'}
LOCATION: ${job.location || 'Not specified'}

Do not use general software engineering standards.
Only evaluate against what THIS job needs.

STEP 1 - RELEVANCE CHECK (mandatory):
Required skills for this job: ${job.requiredSkills.join(', ')}

If the candidate has NONE of these skills AND their experience has NO relation to ${job.title}:
→ matchScore: 0-15
→ recommendation: 'Not recommended - profile does not match ${job.title} requirements'
→ shortlisted: false
→ Stop evaluation, do not score further

Only proceed to scoring if candidate passes this relevance check.

STEP 2 - SCORING (only if passed relevance check):

SKILLS MATCH - 40 points:
Required: ${job.requiredSkills.join(', ')}
- Expert/Advanced exact match: full points per skill
- Intermediate exact match: half points per skill
- Beginner exact match: quarter points per skill
- Related but unlisted skill: quarter points
- Missing required skill: 0 points
Calculate: (points earned / 40) * 40

EXPERIENCE RELEVANCE - 30 points:
Job needs: ${job.experienceLevel || 'any level'}
Role is: ${job.title}
Description: ${job.description}
- Direct relevant experience matching description: 25-30 points
- Partially related experience: 10-20 points  
- Unrelated experience: 0-5 points

EDUCATION - 20 points:
- Directly relevant to ${job.title}: 20 points
- Related field: 10-15 points
- Unrelated field: 5 points
- No education info: 5 points

PROJECTS & CERTIFICATIONS - 10 points:
Uses any of ${job.requiredSkills.join(', ')}?
- Strong relevant projects + certifications: 10 points
- Some relevant projects: 5-7 points
- No relevant projects: 0-3 points

TOTAL = skills + experience + education + projects

NON-NEGOTIABLE RULES:
- Candidate with ALL required skills (${job.requiredSkills.join(', ')}) MUST score above 75
- Candidate with NONE of the required skills MUST score below 25
- Calculate your score twice and average them for consistency
- Never let enthusiasm override the rubric
- Never give bonus points not defined above

RECOMMENDATION must exactly match score:
85-100 → 'Strongly recommend for interview'
75-84  → 'Recommend for interview'
60-74  → 'Consider with reservations'
40-59  → 'Weak match - not recommended'
0-39   → 'Not recommended - insufficient match'

shortlisted = true ONLY if matchScore >= 75
shortlisted = false if matchScore < 75

Return ONLY a valid JSON array. 
No markdown. No explanation. No text outside the JSON array. Every candidate in the input MUST appear in the output.

Required fields per candidate:
{
  rank: number (1 = best),
  applicantId: string (exact ID provided),
  matchScore: integer 0-100,
  strengths: string[] (max 4, specific to ${job.title} requirements),
  gaps: string[] (max 3, reference missing skills from ${job.requiredSkills.join(', ')}),
  relevanceToRole: string (1-2 sentences mentioning ${job.title}),
  recommendation: string (exact text from scale above),
  shortlisted: boolean,
  reasonForNotShortlisting: string | null
}
  `;

  const applicantProfiles = applicants.map(applicant => {
    const skills = applicant.skills?.map(s => `${s.name}(${s.level},${s.yearsOfExperience}y)`).join(';') || 'None';
    const experience = applicant.experience?.map(e =>
      `${e.role}@${e.company}(${e.startDate}–${e.endDate}): ${(e.description || '').slice(0, 80)}. Tech:${e.technologies?.join(',') || ''}`
    ).join(' | ') || 'None';
    const education = applicant.education?.map(edu =>
      `${edu.degree} ${edu.fieldOfStudy}@${edu.institution}(${edu.startYear}-${edu.endYear})`
    ).join(' | ') || 'None';
    const certs = applicant.certifications?.map(c => `${c.name} by ${c.issuer}`).join(';') || 'None';
    const projects = applicant.projects?.map(p => `${p.name}[${p.technologies?.join(',') || ''}]`).join(';') || 'None';
    return `**Profile ID:${applicant._id}**\nName:${applicant.firstName} ${applicant.lastName}|Headline:${applicant.headline}|Location:${applicant.location}\nSkills:${skills}\nExp:${experience}\nEdu:${education}\nCerts:${certs}\nProjects:${projects}\n`;
  }).join('\n');

  return `${instructions}\n\n${applicantProfiles}`;
};

/**
 * Sanitizes a raw string from Gemini and attempts to parse it as JSON.
 * Handles: markdown fences, JS-style comments, trailing commas, truncated arrays.
 */
function sanitizeAndParseJSON(raw: string): any {
  let s = raw.trim();

  // Strip markdown code fences
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();

  // Remove single-line JS comments (// ...)
  s = s.replace(/\/\/[^\n]*/g, '');

  // Remove multi-line JS comments (/* ... */)
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, '$1');

  // Try parsing as-is first
  try {
    return JSON.parse(s);
  } catch (_) {
    // If truncated, try to recover the largest valid array prefix
    const arrayStart = s.indexOf('[');
    if (arrayStart !== -1) {
      // Walk backwards from end to find a recoverable closing bracket
      for (let end = s.length - 1; end > arrayStart; end--) {
        const candidate = s.slice(arrayStart, end + 1);
        // Make sure the last complete object is closed
        const lastClose = candidate.lastIndexOf('}');
        if (lastClose === -1) continue;
        const truncated = candidate.slice(0, lastClose + 1).trimEnd().replace(/,\s*$/, '') + ']';
        try {
          return JSON.parse(truncated);
        } catch (_) {
          continue;
        }
      }
    }
    // Re-throw the original error if nothing worked
    throw new SyntaxError(`Could not recover JSON from Gemini response. First 200 chars: ${s.slice(0, 200)}`);
  }
}

/**
 * Validates and corrects the screening results returned by the AI.
 */
export const validateScreeningResult = (candidates: any[]): ScreeningResultItem[] => {
  return candidates.map(c => {
    const score = parseInt(c.matchScore) || 0;

    // Fix recommendation based on score
    let correctRec;
    if (score >= 85) correctRec = 'Strongly recommend for interview';
    else if (score >= 75) correctRec = 'Recommend for interview';
    else if (score >= 60) correctRec = 'Consider with reservations';
    else if (score >= 40) correctRec = 'Weak match - not recommended';
    else correctRec = 'Not recommended - insufficient match';

    // Fix shortlisted based on score
    const correctShortlisted = score >= 75;

    // Silently correct mismatched recommendations (happens when Gemini uses job-specific phrasing)

    return {
      ...c,
      matchScore: score,
      recommendation: correctRec,
      shortlisted: correctShortlisted,
      reasonForNotShortlisting: correctShortlisted
        ? null
        : `Score ${score} is below 75 threshold`
    };
  });
};

/**
 * Runs the AI screening process using the Gemini API.
 * @param job The job to screen for.
 * @param applicants The applicants to be screened.
 * @param limit The number of top candidates to return.
 * @returns An object containing the structured shortlist or an error flag.
 */
export const runScreening = async (
  job: IJob,
  applicants: IApplicant[],
  limit: number
): Promise<{ shortlist: ScreeningResultItem[]; error?: string }> => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MISSING_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  console.log(`[Screening] API key configured (length ${process.env.GEMINI_API_KEY.length}). Starting screening for job: ${(job as any).title || job._id}`);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const CHUNK_SIZE = 2;
  const allMapped: any[] = [];

  try {
    for (let i = 0; i < applicants.length; i += CHUNK_SIZE) {
      const chunk = applicants.slice(i, i + CHUNK_SIZE);
      const prompt = buildScreeningPrompt(job, chunk, CHUNK_SIZE);

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: 'You are a strict, deterministic recruitment screening AI. You evaluate candidates ONLY against the specific job provided. You always follow the scoring rubric exactly. You never deviate from the rules. You always return valid JSON only.'
      });

      const generationConfig: any = {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }  // Disable thinking tokens — they consume output budget on gemini-2.5-flash
      };

      const parseChunkText = (rawText: string) => {
        const parsed = sanitizeAndParseJSON(rawText);
        const raw = Array.isArray(parsed) ? parsed : [parsed];
        return raw.map((item: any) => ({
          rank: item.rank,
          applicantId: item.applicantId,
          matchScore: item.matchScore,
          strengths: item.strengths || [],
          gaps: item.gaps || [],
          relevanceToRole: item.relevanceToRole || item.relevance_to_role || item.relevance || '',
          recommendation: item.recommendation,
          shortlisted: item.shortlisted,
          reasonForNotShortlisting: item.reasonForNotShortlisting || null
        }));
      };

      // Retry up to 5 times with exponential backoff — handles sustained 503 throttling
      const MAX_ATTEMPTS = 5;
      const BACKOFFS_MS = [15000, 30000, 60000, 120000, 120000]; // 15s, 30s, 1m, 2m, 2m
      let lastError: any;
      let chunkMapped: any[] | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
          });
          const response = result.response;

          const candidate = response.candidates?.[0];
          const finishReason = candidate?.finishReason;
          if (finishReason && finishReason !== 'STOP') {
            throw new Error(`Gemini blocked (finishReason: ${finishReason})`);
          }

          const text = response.text();
          if (!text || text.trim() === '') {
            throw new Error('Gemini returned empty response');
          }

          chunkMapped = parseChunkText(text);
          break; // success — exit retry loop
        } catch (err: any) {
          lastError = err;
          const backoff = BACKOFFS_MS[attempt - 1];
          console.warn(`⚠️ Chunk ${Math.floor(i / CHUNK_SIZE)} attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}. Retrying in ${backoff / 1000}s...`);
          if (attempt < MAX_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, backoff));
          }
        }
      }

      if (!chunkMapped) {
        throw new Error(`Chunk ${Math.floor(i / CHUNK_SIZE)} failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`);
      }

      allMapped.push(...chunkMapped);

      // Delay between chunks — 8s reduces 503 throttle frequency on free-tier
      // (each avoided 503 saves 5s retry, so 8s up-front is net faster)
      if (i + CHUNK_SIZE < applicants.length) {
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    const validatedList = validateScreeningResult(allMapped);
    return { shortlist: validatedList.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit).map((item, i) => ({ ...item, rank: i + 1 })) };
  } catch (apiError: any) {
    console.error('❌ CRITICAL ERROR: Gemini API connection or generation failed.', apiError.message || apiError);
    // Explicitly throwing the error instead of graceful fallback as requested
    throw apiError;
  }
};

/**
 * Extracts structured data from raw resume text using the Gemini API.
 * @param rawText The extracted raw text from the resume PDF.
 * @returns Parsed JSON containing skills, experience, education, and basic details.
 */
export const extractResumeData = async (rawText: string): Promise<any | null> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not configured for extractResumeData.');
    return null;
  }

  const prompt = `
    **Instructions:**
    Extract structured data from the following resume text.
    Return ONLY a valid JSON object. Do not include markdown formatting or conversational text.
    If a field is missing, omit it or use an empty array.
    
    The JSON object must have this structure:
    {
      "firstName": "<string>",
      "lastName": "<string>",
      "headline": "<string>",
      "location": "<string>",
      "skills": [
        { "name": "<string>", "level": "Beginner|Intermediate|Advanced|Expert", "yearsOfExperience": <number> }
      ],
      "experience": [
        { "company": "<string>", "role": "<string>", "startDate": "<string YYYY-MM-DD>", "endDate": "<string YYYY-MM-DD or Present>", "description": "<string>", "technologies": ["<string>"], "isCurrent": <boolean> }
      ],
      "education": [
        { "institution": "<string>", "degree": "<string>", "fieldOfStudy": "<string>", "startYear": <number>, "endYear": <number> }
      ]
    }

    **Resume Text:**
    ${rawText.substring(0, 10000)} // truncate to prevent token overflow if extremely long
  `;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    const response = await result.response;
    const text = response.text().replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/, '').trim(); // Strip markdown if present

    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to extract/parse resume data with Gemini:', error);
    return null;
  }
};
