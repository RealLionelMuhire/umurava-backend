// This script tests the core functionality of the deployed Umurava backend API.
// To run this script:
// 1. Make sure you have Node.js installed.
// 2. Save this file as `deployment-test.js` in your project directory.
// 3. Create a dummy PDF file named `dummy-resume.pdf` in the same directory.
// 4. Run the script from your terminal: node deployment-test.js

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const API_BASE_URL = 'https://umurava-backend-production.up.railway.app';
// Replace with your current, valid token
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTg5YTc1NjQzMmM3ZGJkMTU1MmQwZSIsImlhdCI6MTc3Njg1MTU5MiwiZXhwIjoxNzc2ODU1MTkyfQ.B6f-dYYYqZfV-CYBX7oXONYMDkc90ONbp28MFaxRXhw';
const RESUME_PATH = path.join(process.cwd(), 'dummy-resume.pdf');

// --- HELPER FUNCTIONS ---
const log = (message) => console.log(`\n----- ${message} -----\n`);
const logSuccess = (message) => console.log(`✅ SUCCESS: ${message}`);
const logError = (error) => console.error(`❌ ERROR: ${error.message || 'An unknown error occurred'}`, error.response ? error.response.data : '');
const logResult = (data) => console.log('Result:', JSON.stringify(data, null, 2));

async function runTests() {
    try {
        // Check if the dummy resume exists
        if (!fs.existsSync(RESUME_PATH)) {
            logError({ message: `The resume file was not found at ${RESUME_PATH}. Please create a dummy PDF file with this name.` });
            return;
        }

        // --- 1. JOBS API ---
        log('TESTING: JOBS API');
        let jobId;

        // Create a new job
        const newJob = {
            title: `Test Job ${Date.now()}`,
            description: 'A job created by the test script.',
            requiredSkills: ['Node.js', 'Testing', 'JavaScript'],
        };
        const createJobResponse = await fetch(`${API_BASE_URL}/api/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`,
            },
            body: JSON.stringify(newJob),
        });
        const createdJob = await createJobResponse.json();
        if (!createJobResponse.ok) throw new Error(`Failed to create job: ${createdJob.message}`);
        
        jobId = createdJob._id;
        logSuccess('Job created successfully.');
        logResult(createdJob);

        // Get all jobs
        const getJobsResponse = await fetch(`${API_BASE_URL}/api/jobs`);
        const allJobs = await getJobsResponse.json();
        if (!getJobsResponse.ok) throw new Error('Failed to get all jobs');
        logSuccess(`Found ${allJobs.length} jobs.`);

        // --- 2. APPLICANTS API ---
        log('TESTING: APPLICANTS API');
        let applicantId;

        // Apply for the job
        const form = new FormData();
        form.append('name', 'Test Applicant');
        form.append('email', `test.applicant.${Date.now()}@example.com`);
        form.append('resume', fs.createReadStream(RESUME_PATH));

        const applyResponse = await fetch(`${API_BASE_URL}/api/applicants/${jobId}/apply`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });
        const applicationResult = await applyResponse.json();
        if (!applyResponse.ok) throw new Error(`Failed to apply for job: ${applicationResult.message}`);
        
        applicantId = applicationResult.applicant._id;
        logSuccess('Successfully applied for the job.');
        logResult(applicationResult);

        // --- 3. SCREENING API ---
        log('TESTING: SCREENING API');
        
        // Screen the applicant
        const screenResponse = await fetch(`${API_BASE_URL}/api/screening/${jobId}/${applicantId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
            },
        });
        const screeningResult = await screenResponse.json();
        if (!screenResponse.ok) throw new Error(`Failed to screen applicant: ${screeningResult.message}`);

        logSuccess('Screening completed successfully.');
        logResult(screeningResult);

        log('ALL TESTS COMPLETED SUCCESSFULLY!');

    } catch (error) {
        logError(error);
        console.log('\nOne or more tests failed. Please check the error messages above.');
    }
}

runTests();
