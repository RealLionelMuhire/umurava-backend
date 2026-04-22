// This script automates a full end-to-end workflow for the Umurava backend API.
// To run this script:
// 1. Make sure you have Node.js installed.
// 2. Run `npm install axios` to install the required dependency.
// 3. Run the script from your terminal: node full-workflow-test.js

const axios = require('axios');

// --- CONFIGURATION ---
const API_BASE_URL = 'https://umurava-backend-production.up.railway.app';

// A pool of diverse, realistic resume URLs for simulating different candidates
const CANDIDATE_RESUMES = [
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/senior-backend-resume.md", // Strong candidate
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/data-scientist-resume.md", // Good, but different field
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/junior-frontend-resume.md", // Junior, wrong specialty
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/product-manager-resume.md", // Non-technical
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/full-stack-resume.md", // Good full-stack candidate
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/devops-resume.md", // Related, but different focus
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/lead-engineer-resume.md", // Very strong candidate
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/mobile-dev-resume.md", // Mobile developer
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/qa-engineer-resume.md", // QA Engineer
    "https://gist.githubusercontent.com/LeoTico/f78c1d22c181e5e5b658e91c151039e3/raw/e7c33c59b8aa450025a11957a45a1c1e23e88d03/ux-designer-resume.md" // Designer
];

// --- HELPER FUNCTIONS ---
const log = (message) => console.log(`\n----- ${message} -----\n`);
const logSuccess = (message) => console.log(`✅ SUCCESS: ${message}`);
const logError = (error) => {
    console.error(`❌ ERROR: ${error.message || 'An unknown error occurred'}`);
    if (error.response && error.response.data) {
        console.error('DETAILS:', JSON.stringify(error.response.data, null, 2));
    }
};
const logResult = (data) => console.log('Result:', JSON.stringify(data, null, 2));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runFullWorkflow() {
    let authToken = '';
    let jobId = '';
    const applicantIds = [];

    try {
        // --- 1. REGISTER & LOGIN RECRUITER ---
        log('STEP 1: Registering and Logging in a new Recruiter');
        const recruiterEmail = `recruiter-${Date.now()}@example.com`;
        const recruiterPassword = 'password123';

        await axios.post(`${API_BASE_URL}/api/auth/register`, { email: recruiterEmail, password: recruiterPassword });
        logSuccess(`Recruiter registered: ${recruiterEmail}`);

        const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, { email: recruiterEmail, password: recruiterPassword });
        authToken = loginRes.data.token;
        if (!authToken) throw new Error('Failed to log in and get token.');
        logSuccess('Recruiter logged in and token received.');

        // --- 2. CREATE JOB POST ---
        log('STEP 2: Creating a new Job Post');
        const jobDetails = {
            title: 'Senior Backend Engineer',
            description: 'Seeking an experienced backend engineer with expertise in building scalable, distributed systems. Must be proficient in Node.js, have a strong understanding of database architecture, and experience with cloud services like AWS or Google Cloud.',
            requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Microservices', 'System Design'],
        };
        const createJobRes = await axios.post(`${API_BASE_URL}/api/jobs`, jobDetails, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        jobId = createJobRes.data._id;
        if (!jobId) throw new Error('Failed to create job.');
        logSuccess(`Job post created with ID: ${jobId}`);

        // --- 3. SIMULATE APPLICANTS ---
        log(`STEP 3: Simulating ${CANDIDATE_RESUMES.length} Applicants`);
        for (let i = 0; i < CANDIDATE_RESUMES.length; i++) {
            const resumeUrl = CANDIDATE_RESUMES[i];
            const applicantName = `Candidate ${i + 1}`;
            const applicantEmail = `candidate${i + 1}.${Date.now()}@example.com`;

            try {
                const applyRes = await axios.post(`${API_BASE_URL}/api/applicants/${jobId}/apply`, {
                    name: applicantName,
                    email: applicantEmail,
                    resumeUrl: resumeUrl
                });
                applicantIds.push(applyRes.data.applicant._id);
                logSuccess(`Submitted application for ${applicantName}`);
            } catch (applyError) {
                console.warn(`⚠️  Warning: Could not submit application for ${applicantName}.`);
                logError(applyError);
            }
            await sleep(1000); // Small delay to avoid overwhelming the server
        }

        // --- 4. SCREEN APPLICANTS ---
        log(`STEP 4: Screening all ${applicantIds.length} Applicants`);
        for (const applicantId of applicantIds) {
            try {
                await axios.post(`${API_BASE_URL}/api/screening/${jobId}/${applicantId}`, {}, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                logSuccess(`Screening initiated for applicant ${applicantId}`);
            } catch (screenError) {
                console.warn(`⚠️  Warning: Could not screen applicant ${applicantId}.`);
                logError(screenError);
            }
            await sleep(2000); // Add a longer delay for AI processing
        }
        logSuccess('All screening processes initiated. Waiting for results...');
        await sleep(10000); // Wait a bit longer for all AI jobs to complete

        // --- 5. GET AND RANK CANDIDATES ---
        log('STEP 5: Fetching Results and Ranking Top 10 Candidates');
        const resultsRes = await axios.get(`${API_BASE_URL}/api/applicants/${jobId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const allApplicants = resultsRes.data;

        const screenedApplicants = allApplicants.filter(app => app.screeningReport && app.screeningReport.compatibilityScore);

        if (screenedApplicants.length === 0) {
            logSuccess("No applicants were successfully screened. The AI may be processing or there were errors during screening.");
            return;
        }

        screenedApplicants.sort((a, b) => b.screeningReport.compatibilityScore - a.screeningReport.compatibilityScore);

        console.log('\n\n==================================================');
        console.log('🏆 TOP CANDIDATES REPORT 🏆');
        console.log('==================================================\n');

        screenedApplicants.slice(0, 10).forEach((app, index) => {
            console.log(`\n#${index + 1} - ${app.name} (Score: ${app.screeningReport.compatibilityScore})`);
            console.log('--------------------------------------------------');
            console.log(`AI-Generated Reason: ${app.screeningReport.reasoning}`);
            console.log(`Matched Skills: ${app.screeningReport.matchedSkills.join(', ')}`);
        });

        log('Full workflow test completed successfully!');

    } catch (error) {
        logError(error);
        console.log('\nThe script failed at some point. Please check the error message above.');
    }
}

runFullWorkflow();
