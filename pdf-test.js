const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const baseURL = 'http://localhost:5000/api';
let token = '';
let jobId = '';

async function runTest() {
    try {
        console.log('\n--- Step 1: Register & Login ---');
        try {
            await axios.post(`${baseURL}/auth/register`, {
                email: "pdftest@test.com",
                password: "password123"
            });
            console.log('✅ Registration successful');
        } catch (error) {
            if (error.response && (error.response.status === 400 || error.response.status === 409)) {
                console.log('✅ Registration skipped (user already exists)');
            } else {
                throw error;
            }
        }

        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: "pdftest@test.com",
            password: "password123"
        });

        // Accessing token based on possible API structures
        token = loginRes.data.token || loginRes.data.data?.token;
        if (!token) {
            throw new Error("No token returned. Response: " + JSON.stringify(loginRes.data));
        }
        console.log('✅ Login successful, token received');

        console.log('\n--- Step 2: Create Job ---');
        const jobRes = await axios.post(`${baseURL}/jobs`, {
            title: "Backend Engineer",
            description: "Node.js TypeScript PostgreSQL",
            requiredSkills: ["Node.js", "TypeScript", "PostgreSQL"]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Accessing jobId based on possible API structures
        jobId = jobRes.data._id || jobRes.data.data?._id || jobRes.data.job?._id;
        console.log(`✅ Job created successfully, jobId: ${jobId}`);

        console.log('\n--- Step 3: Upload PDF ---');
        const form = new FormData();
        const filePath = path.resolve(__dirname, '../Lionel_CV.pdf');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at ${filePath}`);
        }

        form.append('file', fs.createReadStream(filePath));
        form.append('jobId', jobId);
        form.append('fullName', 'Lionel');
        form.append('email', `lionel${Date.now()}@test.com`);

        // Without auth header first as upload-resume might not need it, or we include it just in case:
        let uploadRes;
        try {
            uploadRes = await axios.post(`${baseURL}/applicants/upload-resume`, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (e) {
            console.log('Upload error:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
            throw e;
        }

        console.log('✅ Upload successful. Response object:', JSON.stringify(uploadRes.data, null, 2));
        const applicant = uploadRes.data.applicant || uploadRes.data.data?.applicant || uploadRes.data.data || uploadRes.data;
        if (applicant && applicant.rawResumeText) {
            console.log('✅ rawResumeText extracted and is not empty');
        } else {
            console.log('❌ rawResumeText is empty or missing');
        }

        console.log('\n--- Step 4: Verify in DB ---');
        const applicantsRes = await axios.get(`${baseURL}/applicants?jobId=${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const applicantsList = applicantsRes.data.applicants || applicantsRes.data.data || applicantsRes.data;

        // Some APIs return directly the array, some wrap it.
        let isLionelFound = false;
        if (Array.isArray(applicantsList)) {
            isLionelFound = applicantsList.some(a => a.firstName === 'Lionel' || a.fullName === 'Lionel' || (a.user && a.user.fullName === 'Lionel'));
        } else if (applicantsList && (applicantsList.firstName === 'Lionel' || applicantsList.fullName === 'Lionel')) {
            isLionelFound = true;
        }

        if (isLionelFound) {
            console.log('✅ Lionel appears in the list');
        } else {
            console.log('❌ Lionel not found in the list. Response:', JSON.stringify(applicantsRes.data, null, 2));
        }

        console.log('\n--- Step 5: Trigger AI Screening ---');
        console.log(`Triggering screening for jobId: ${jobId}`);
        try {
            const triggerRes = await axios.post(`${baseURL}/screening/${jobId}?limit=10`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Screening triggered successfully (Status:', triggerRes.status, ')');
        } catch (e) {
            console.log('Screening trigger warning/error:', e.response ? e.response.statusText : e.message);
        }

        console.log('Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('Getting screening results...');
        const screeningRes = await axios.get(`${baseURL}/screening/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const shortlist = screeningRes.data.shortlist || screeningRes.data.data?.shortlist || screeningRes.data.data || screeningRes.data;
        console.log('✅ Full shortlist result:\n', JSON.stringify(shortlist, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Request Failed:', error.message);
        }
    }
}

runTest();
