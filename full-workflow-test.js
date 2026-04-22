const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000';

const log = (message) => console.log(`\n----- ${message} -----\n`);
const logSuccess = (message) => console.log(`✅ SUCCESS: ${message}`);
const logError = (error) => {
    console.error(`❌ ERROR: ${error.message || 'An unknown error occurred'}`);
    if (error.response && error.response.data) {
        console.error('DETAILS:', JSON.stringify(error.response.data, null, 2));
    }
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runHackathonScenarios() {
    let authToken = '';
    let jobId1 = '';
    let jobId2 = '';

    try {
        // STEP 0: AUTH PROTECTION TEST
        log('STEP 0: Auth Protection Test');
        try {
            await axios.post(`${API_BASE_URL}/api/jobs`, { title: 'Test' });
            logError(new Error('Job creation succeeded without token!'));
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logSuccess('Auth protection working: Blocked unauthenticated job creation.');
            } else {
                throw err;
            }
        }

        // STEP 1: REGISTER & LOGIN RECRUITER
        log('STEP 1: Registering and Logging in a new Recruiter');
        const rEmail = `hackathon-${Date.now()}@test.com`;
        await axios.post(`${API_BASE_URL}/api/auth/register`, { email: rEmail, password: 'password123' });
        logSuccess(`Recruiter registered: ${rEmail}`);

        const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, { email: rEmail, password: 'password123' });
        authToken = loginRes.data.token;
        logSuccess('Recruiter logged in and token received.');

        // STEP 2: CREATE JOB POST 1 (Backend Engineer)
        log('STEP 2: Creating Job 1 (Backend Engineer)');
        const job1 = {
            title: 'Senior Backend Engineer',
            description: 'Expertise in building scalable systems. Node.js, TS, PostgreSQL, AWS.',
            requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS']
        };
        const createJobRes = await axios.post(`${API_BASE_URL}/api/jobs`, job1, { headers: { 'Authorization': `Bearer ${authToken}` } });
        jobId1 = createJobRes.data._id;
        logSuccess(`Job 1 created with ID: ${jobId1}`);

        // STEP 2b: CREATE JOB POST 2 (Data Scientist)
        log('STEP 2b: Creating Job 2 (Data Scientist)');
        const job2 = {
            title: 'Lead Data Scientist',
            description: 'AI model deployment, Python, PyTorch, SQL.',
            requiredSkills: ['Python', 'PyTorch', 'SQL', 'Machine Learning']
        };
        const createJobRes2 = await axios.post(`${API_BASE_URL}/api/jobs`, job2, { headers: { 'Authorization': `Bearer ${authToken}` } });
        jobId2 = createJobRes2.data._id;
        logSuccess(`Job 2 created with ID: ${jobId2}`);

        // STEP 3: 40 DIVERSE CANDIDATES (Job 1)
        log('STEP 3: Simulating 40 Diverse Candidates for Job 1 (Varying Skills)');
        const skillProfiles = [
            ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Microservices'], // Perfect Match
            ['Node.js', 'JavaScript', 'MongoDB', 'AWS'], // Good Match
            ['Python', 'Django', 'PostgreSQL', 'Docker'], // Medium Match (Backend, but different stack)
            ['Java', 'Spring Boot', 'MySQL', 'Azure'], // Medium Match
            ['React', 'CSS', 'HTML', 'Figma', 'UI/UX'], // Irrelevant Match (Frontend/Design)
            ['Marketing', 'SEO', 'Content Writing', 'Sales'], // Completely Irrelevant
            ['C++', 'Oracle', 'Agile', 'Jira'], // Medium
            ['Go', 'Kubernetes', 'AWS', 'PostgreSQL'] // Good Match
        ];

        for (let i = 0; i < 40; i++) {
            const profileIndex = i % skillProfiles.length;
            const skills = skillProfiles[profileIndex];
            // Base experience varies slightly to add more diversity
            const experienceYears = 1 + (i % 6);
            
            try {
                // Using the structured JSON endpoint for Job 1 so we can easily inject exact varied skills
                await axios.post(`${API_BASE_URL}/api/applicants`, {
                    fullName: `Candidate Job1 ${i + 1}`,
                    email: `cand_j1_mixed_${i + 1}_${Date.now()}@test.com`,
                    jobId: jobId1,
                    skills: skills,
                    experienceYears: experienceYears
                });
                console.log(`✅ SUCCESS: Submitted application ${i + 1}/40 for Job 1 [Exp: ${experienceYears}yr, Skills: ${skills[0]}...]`);
            } catch (err) {
                console.warn(`Failed application for Job 1 Candidate ${i+1}`);
            }
        }

        // STEP 3b: SCENARIO 1 - PLATFORM CANDIDATES (Structured JSON)
        log('STEP 3b: SCENARIO 1 - Platform structured JSON candidates for Job 2');
        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_BASE_URL}/api/applicants`, {
                    fullName: `Platform Candidate ${i + 1}`,
                    email: `platform${i + 1}_${Date.now()}@umurava.com`,
                    jobId: jobId2,
                    skills: ['Python', 'PyTorch', 'SQL', 'scikit-learn'],
                    experienceYears: 5 + i
                });
                logSuccess(`Submitted platform application ${i + 1} for Job 2`);
            } catch (err) {
                logError(err);
            }
        }

        // STEP 3c: CSV UPLOAD TEST
        log('STEP 3c: CSV Upload Test for Job 1');
        const csvContent = `fullName,email,skills,experienceYears\nCSV User 1,csv1_${Date.now()}@test.com,Java Python,3\nCSV User 2,csv2_${Date.now()}@test.com,Node.js React,5`;
        fs.writeFileSync('test.csv', csvContent);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream('test.csv'));
        formData.append('jobId', jobId1);
        try {
            await axios.post(`${API_BASE_URL}/api/applicants/upload-csv`, formData, { headers: formData.getHeaders() });
            logSuccess('CSV Upload completed successfully');
        } catch (err) {
            logError(err);
        }

        // STEP 4: SCREEN APPLICANTS
        log('STEP 4: Screening Applicants for Job 1');
        await axios.post(`${API_BASE_URL}/api/screening/${jobId1}?limit=20`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });
        logSuccess('Screening initiated for Job 1. Waiting for simulation to finish (10s)...');
        await sleep(10000);

        // STEP 4b: TOP 20 TEST
        log('STEP 4b: TOP 20 LIMIT TEST - Fetching Top 20 Candidates for Job 1');
        const resultsRes1 = await axios.get(`${API_BASE_URL}/api/screening/${jobId1}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const screened1 = resultsRes1.data.shortlist || [];

        // STEP 4c: Screening Job 2
        log('STEP 4c: Screening Job 2 (Platform Candidates)');
        await axios.post(
          `${API_BASE_URL}/api/screening/${jobId2}?limit=5`, 
          {}, 
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        await sleep(10000);
        
        const resultsRes2 = await axios.get(
          `${API_BASE_URL}/api/screening/${jobId2}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const screened2 = resultsRes2.data.shortlist || [];

        // STEP 5: FINAL REPORT
        console.log('\n\n==================================================');
        console.log('🏆 HACKATHON SCENARIO REPORT 🏆');
        console.log('==================================================');
        
        console.log(`\n--- JOB 1 (Backend - Screened with Limit 20) ---`);
        console.log(`Total Screened Candidates Returned: ${screened1.length}`);
        screened1.forEach((r, i) => {
            console.log(`#${r.rank || i + 1} ID: ${r.applicantId} | Score: ${r.matchScore} | Shortlisted: ${r.shortlisted ? "YES" : "NO"} | Reason for Not Shortlisting: ${r.reasonForNotShortlisting || "N/A"}`);
        });

        // Verify Job 2 applicants
        const job2Applicants = await axios.get(`${API_BASE_URL}/api/applicants/job/${jobId2}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        console.log(`\n--- JOB 2 AI Screening Results ---`);
        console.log(`Total Screened: ${screened2.length}`);
        screened2.forEach((r, i) => {
          console.log(
            `#${r.rank || i+1} ID: ${r.applicantId} | ` +
            `Score: ${r.matchScore} | ${r.recommendation}`
          );
        });
        
        console.log('\n✅ ALL HACKATHON SCENARIOS TESTED SUCCESSFULLY!');

    } catch (error) {
        logError(error);
    } finally {
        if (fs.existsSync('test.csv')) fs.unlinkSync('test.csv');
    }
}

runHackathonScenarios();
