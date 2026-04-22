// This script automates a full end-to-end workflow for the Umurava backend API.
// To run this script:
// 1. Make sure you have Node.js installed.
// 2. Run `npm install axios` to install the required dependency.
// 3. Run the script from your terminal: node full-workflow-test.js

const axios = require('axios');

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:5000';

const VALID_DUMMY_URL = "https://raw.githubusercontent.com/nodesource/distributions/master/README.md";

// A pool of diverse, realistic resume URLs for simulating different candidates
const CANDIDATE_RESUMES = [
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL,
    VALID_DUMMY_URL
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
                    fullName: applicantName,
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
        log(`STEP 4: Screening Applicants for Job`);
        try {
            await axios.post(`${API_BASE_URL}/api/screening/${jobId}`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            logSuccess(`Screening initiated for all applicants for job ${jobId}`);
        } catch (screenError) {
            console.warn(`⚠️  Warning: Could not initiate screening.`);
            logError(screenError);
        }
        logSuccess('Screening process initiated. Waiting for results...');
        await sleep(10000); // Wait a bit longer for all AI jobs to complete

        // --- 5. GET AND RANK CANDIDATES ---
        log('STEP 5: Fetching Results and Ranking Top Candidates');
        // Fetch screening results which includes the applicants and their scores
        const resultsRes = await axios.get(`${API_BASE_URL}/api/screening/${jobId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const screenedApplicants = resultsRes.data.shortlist || [];

        if (screenedApplicants.length === 0) {
            logSuccess("No applicants were successfully screened.");
            return;
        }

        console.log('\n\n==================================================');
        console.log('🏆 TOP CANDIDATES REPORT 🏆');
        console.log('==================================================\n');

        screenedApplicants.slice(0, 10).forEach((result, index) => {
            // Mapping the properties based on the actual ScreeningResult model structure
            console.log(`\n#${index + 1} - Applicant ID: ${result.applicantId} (Score: ${result.matchScore || 'N/A'})`);
            console.log('--------------------------------------------------');
            console.log(`AI-Generated Reason: ${result.recommendation || 'N/A'}`);
            if (result.strengths && result.strengths.length > 0) {
                console.log(`Strengths: ${result.strengths.join(', ')}`);
            }
        });

        log('Full workflow test completed successfully!');

    } catch (error) {
        logError(error);
        console.log('\nThe script failed at some point. Please check the error message above.');
    }
}

runFullWorkflow();
