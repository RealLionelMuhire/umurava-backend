/**
 * @file geminiService.ts
 * @description Interacts with the Google Gemini API for AI-powered screening.
 *
 * PROMPT DESIGN DECISIONS:
 * 1.  **Structured Input**: The prompt provides clear sections for the job and each applicant,
 *     using headings like "Job Details" and "Applicant Profile" to give the model context.
 *
 * 2.  **Explicit Output Format**: The prompt explicitly instructs the model to return ONLY a
 *     valid JSON array. This is critical for reliable parsing. It specifies the exact
 *     fields required for each object in the array: `rank`, `applicantId`, `matchScore`,
 *     `strengths`, `gaps`, `relevanceToRole`, and `recommendation`.
 *
 * 3.  **Constraint-Based Instructions**:
 *     - "Return ONLY a valid JSON array": Prevents the model from adding conversational
 *       text or markdown backticks (e.g., ```json ... ```) around the output.
 *     - "Rank the top X candidates": Limits the output to the most relevant results,
 *       making the response more focused and reducing token usage.
 *     - "Score from 0 to 100": Standardizes the `matchScore` for easy comparison.
 *
 * 4.  **Weighted Scoring Criteria**: The prompt now includes explicit weighting to guide the
 *     model's scoring logic, ensuring consistency and alignment with recruitment priorities.
 *     - Skills Match (40%): The most critical factor.
 *     - Experience (30%): Directly relevant experience is highly valued.
 *     - Education (20%): Educational background provides a foundational check.
 *     - Overall Relevance (10%): A qualitative assessment of the candidate's fit.
 *
 * 5.  **Key Information First**: The job description (the criteria) is placed before the
 *     list of applicants (the candidates to be evaluated against the criteria). This
 *     helps the model establish the evaluation context first.
 *
 * KNOWN LIMITATIONS & ASSUMPTIONS:
 * - **Subjectivity**: AI scoring, even with weighting, has inherent subjectivity and may not
 *   perfectly mirror a human recruiter's intuition.
 * - **Data Quality**: The model's output is highly dependent on the quality and completeness
 *   of the applicant data provided (e.g., parsed resume text).
 * - **Prompt Sensitivity**: Minor changes to the prompt structure or wording could lead to
 *   varied or unexpected results.
 * - **No Real-Time Verification**: The model cannot verify claims made in a resume (e.g.,
 *   certifications, past employment). It takes the data at face value.
 * - **Bias Risk**: The model may inadvertently amplify biases present in the training data or
 *   the provided applicant information.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IJob } from '../../models/Job';
import { IApplicant } from '../../models/Applicant';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ScreeningResultItem {
  rank: number;
  applicantId: string;
  matchScore: number;
  strengths: string[];
  gaps: string[];
  relevanceToRole: string;
  recommendation: string;
}

/**
 * Builds a detailed prompt for the Gemini API to screen applicants against a job.
 * @param job The job details.
 * @param applicants An array of applicant details.
 * @param limit The number of top candidates to return.
 * @returns A formatted string to be used as the prompt.
 */
export const buildScreeningPrompt = (job: IJob, applicants: IApplicant[], limit: number): string => {
  const jobDetails = `
    **Job Details:**
    - Title: ${job.title}
    - Description: ${job.description}
    - Required Skills: ${job.requiredSkills.join(', ')}
    - Experience Level: ${job.experienceLevel}
    - Education Level: ${job.educationLevel}
  `;

  const applicantProfiles = applicants.map(applicant => `
    **Applicant Profile:**
    - ID: ${applicant._id}
    - Name: ${applicant.fullName}
    - Skills: ${applicant.skills.join(', ')}
    - Experience: ${applicant.experienceYears} years
    - Education: ${applicant.education}
    - Raw Resume Summary: ${applicant.rawResumeText.substring(0, 500)}...
  `).join('');

  const instructions = `
    **Instructions:**
    Based on the "Job Details" provided, please evaluate the following "Applicant Profiles".
    Score candidates with this priority: skills match (40%), experience (30%), education (20%), overall relevance (10%).
    Return ONLY a valid JSON array containing the top ${limit} ranked candidates for this role.
    Do not include any introductory text, explanations, or markdown formatting.
    The JSON object for each candidate must have the following structure:
    {
      "rank": <number>,
      "applicantId": "<string>",
      "matchScore": <number (0-100)>,
      "strengths": ["<string>", "..."],
      "gaps": ["<string>", "..."],
      "relevanceToRole": "<string>",
      "recommendation": "<string>"
    }
  `;

  return `${jobDetails}\n${applicantProfiles}\n${instructions}`;
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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const prompt = buildScreeningPrompt(job, applicants, limit);
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the JSON response from the model
    try {
      const shortlist = JSON.parse(text) as ScreeningResultItem[];
      return { shortlist };
    } catch (parseError) {
      console.error('Failed to parse JSON response from Gemini API.');
      console.error('Raw Response:', text);
      return {
        shortlist: [],
        error: 'Failed to parse AI response. Check logs for details.',
      };
    }
  } catch (apiError) {
    console.error('Error calling Gemini API:', apiError);
    throw new Error('Failed to get a response from the AI screening service.');
  }
};
