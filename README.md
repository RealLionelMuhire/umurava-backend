# Umurava - AI-Powered Talent Screening System

This is the backend for Umurava, an AI-powered talent screening system designed to automate and enhance the initial stages of the recruitment process. It uses Google's Gemini AI to analyze and rank candidates based on their qualifications against job requirements.

## Features

- **JWT Authentication**: Secure endpoints for recruiters.
- **Job Management**: Full CRUD API for managing job postings with status tracking (`open`, `screening`, `shortlisted`).
- **Applicant Sourcing**: Upload applicants via CSV/Excel, PDF resumes, direct URL links, or a structured JSON profile.
- **AI-Powered Screening**: Automated analysis of applicants against job criteria using Google Gemini, with configurable result limits.
- **RESTful API**: A complete set of endpoints to manage the screening lifecycle.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd umurava-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and copy the contents of `.env.example`. Fill in the required values.

    ```
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_google_gemini_api_key
    JWT_SECRET=your_jwt_secret
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will start on the port specified in your `.env` file (default is 5000).

## Environment Variables

-   `PORT`: The port on which the Express server will run.
-   `MONGO_URI`: The connection string for your MongoDB database.
-   `GEMINI_API_KEY`: Your API key for the Google Gemini service.
-   `JWT_SECRET`: A secret key for signing and verifying JSON Web Tokens.

## AI Decision Flow

The core of the AI screening process is designed to be both powerful and efficient.

1.  **Initiation**: A screening is triggered via a `POST` request to `/api/screening/:jobId`. The job's status is immediately updated to `"screening"`.
2.  **Data Aggregation**: The system fetches the job's details and all associated applicant profiles from the database.
3.  **Dynamic Prompt Generation**: The `geminiService` constructs a detailed, single-shot prompt. This prompt includes the full job description and a concise summary for each candidate (skills, experience, education, and a snippet of their raw resume text).
4.  **Structured Output Instruction**: The prompt explicitly instructs the Gemini model to return **only a valid JSON array**, with a predefined structure for each candidate. It also includes weighting instructions to guide the AI's analysis.
5.  **API Call and Safe Parsing**: The system calls the Gemini API. The response is expected to be a JSON string, which is then parsed in a `try/catch` block. If parsing fails, the job status is reverted to `"open"`, and an error is returned.
6.  **Data Persistence**: The successfully parsed shortlist is saved to the `ScreeningResult` collection in MongoDB.
7.  **Finalization**: The job's status is updated to `"shortlisted"`, indicating the screening is complete.

## Prompt Design

The effectiveness of the AI screening hinges on a carefully designed prompt.

-   **Weighted Criteria**: The prompt instructs the model to prioritize qualifications according to a specific weighting, ensuring consistent evaluation aligned with typical recruitment priorities:
    -   **Skills Match (40%)**: The most critical factor. Do they have the required technical skills?
    -   **Experience (30%)**: Is their work history relevant to the role's level and domain?
    -   **Education (20%)**: Does their educational background meet the job's requirements?
    -   **Overall Relevance (10%)**: A qualitative assessment of the candidate's holistic fit for the role described.

-   **Explicit JSON Output**: To ensure reliable data processing, the prompt commands the model to return *only* a valid JSON array, specifying the exact fields required for each candidate. This minimizes the risk of receiving unstructured or conversational text.

## Assumptions & Limitations

-   **Subjectivity in Scoring**: AI scoring, even with weighting, has inherent subjectivity and may not perfectly mirror a human recruiter's intuition or catch subtle nuances in a profile.
-   **Data Quality Dependency**: The model's output is highly dependent on the quality and clarity of the applicant data. Poorly formatted resumes or vague job descriptions will lead to less accurate results.
-   **No Real-Time Verification**: The model cannot verify claims made in a resume (e.g., certifications, project outcomes, past employment). It takes all provided data at face value.
-   **Potential for Bias**: The AI may inadvertently amplify biases present in the training data or the provided job/applicant information. It is a tool to assist, not replace, human oversight.
-   **Context Window Limits**: For jobs with a very large number of applicants, the prompt size could exceed the model's context window, requiring a strategy for batching or summarizing applicants.
