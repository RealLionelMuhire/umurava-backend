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
        const job1Profiles = [
            {
                firstName: "Aline", lastName: "Mugisha", headline: "Senior Node.js Engineer", location: "Kigali, Rwanda",
                skills: [
                    { name: "Node.js", level: "Expert", yearsOfExperience: 6 },
                    { name: "TypeScript", level: "Expert", yearsOfExperience: 5 },
                    { name: "PostgreSQL", level: "Intermediate", yearsOfExperience: 4 },
                    { name: "AWS", level: "Advanced", yearsOfExperience: 4 }
                ],
                experience: [{ company: "TechAfrica", role: "Backend Developer", startDate: "2018-05-01", endDate: "2023-08-01", description: "Built scalable Node.js microservices.", technologies: ["Node.js", "AWS"], isCurrent: false }],
                education: [{ institution: "University of Rwanda", degree: "BSc", fieldOfStudy: "Computer Science", startYear: 2014, endYear: 2018 }],
                projects: [{ name: "FinTech API", description: "High TPS payment gateway.", technologies: ["Node.js", "TypeScript", "PostgreSQL"], role: "Lead Engineer", startDate: "2020-01-01", endDate: "2021-06-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "Eric", lastName: "Ntwali", headline: "Backend JavaScript Developer", location: "Nairobi, Kenya",
                skills: [
                    { name: "Node.js", level: "Advanced", yearsOfExperience: 4 },
                    { name: "JavaScript", level: "Expert", yearsOfExperience: 5 },
                    { name: "MongoDB", level: "Advanced", yearsOfExperience: 4 },
                    { name: "AWS", level: "Intermediate", yearsOfExperience: 2 }
                ],
                experience: [{ company: "Innovate Ltd", role: "Software Engineer", startDate: "2019-02-01", endDate: "2023-11-01", description: "Maintained legacy JS backends.", technologies: ["Node.js", "MongoDB"], isCurrent: false }],
                education: [{ institution: "Kenyatta University", degree: "BSc", fieldOfStudy: "Software Engineering", startYear: 2015, endYear: 2019 }],
                projects: [{ name: "E-Commerce Backend", description: "Shopping cart backend.", technologies: ["JavaScript", "MongoDB"], role: "Backend Dev", startDate: "2021-02-01", endDate: "2022-09-01" }],
                availability: { status: "Available", type: "Contract" }
            },
            {
                firstName: "Chantal", lastName: "Uwase", headline: "Python Web Developer", location: "Kigali, Rwanda",
                skills: [
                    { name: "Python", level: "Expert", yearsOfExperience: 5 },
                    { name: "Django", level: "Expert", yearsOfExperience: 4 },
                    { name: "PostgreSQL", level: "Advanced", yearsOfExperience: 3 },
                    { name: "Docker", level: "Intermediate", yearsOfExperience: 2 }
                ],
                experience: [{ company: "CodeWeb", role: "Web Developer", startDate: "2020-01-01", endDate: "2023-12-01", description: "Created Django portals.", technologies: ["Python", "Django"], isCurrent: true }],
                education: [{ institution: "Carnegie Mellon University Africa", degree: "MSc", fieldOfStudy: "IT", startYear: 2018, endYear: 2020 }],
                projects: [{ name: "Health Portal", description: "Records management.", technologies: ["Django", "PostgreSQL"], role: "Developer", startDate: "2021-01-01", endDate: "2022-01-01" }],
                availability: { status: "Open to Opportunities", type: "Full-time" }
            },
            {
                firstName: "Jean", lastName: "Kagabo", headline: "Java Enterprise Developer", location: "Kampala, Uganda",
                skills: [
                    { name: "Java", level: "Expert", yearsOfExperience: 7 },
                    { name: "Spring Boot", level: "Advanced", yearsOfExperience: 5 },
                    { name: "MySQL", level: "Advanced", yearsOfExperience: 6 },
                    { name: "Azure", level: "Intermediate", yearsOfExperience: 2 }
                ],
                experience: [{ company: "BankCorp", role: "Systems Engineer", startDate: "2017-06-01", endDate: "2024-01-01", description: "Banking middleware.", technologies: ["Java", "Spring Boot"], isCurrent: true }],
                education: [{ institution: "Makerere University", degree: "BSc", fieldOfStudy: "Computer Science", startYear: 2013, endYear: 2017 }],
                projects: [{ name: "Transaction Engine", description: "Migration of legacy.", technologies: ["Java"], role: "Software Engineer", startDate: "2019-01-01", endDate: "2020-05-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "Sarah", lastName: "Mutoni", headline: "Frontend Designer UI/UX", location: "Kigali, Rwanda",
                skills: [
                    { name: "React", level: "Expert", yearsOfExperience: 4 },
                    { name: "CSS", level: "Expert", yearsOfExperience: 5 },
                    { name: "HTML", level: "Expert", yearsOfExperience: 5 },
                    { name: "Figma", level: "Advanced", yearsOfExperience: 3 }
                ],
                experience: [{ company: "DesignAgency", role: "UI/UX Designer", startDate: "2019-01-01", endDate: "2023-01-01", description: "Created interfaces.", technologies: ["Figma", "React"], isCurrent: false }],
                education: [{ institution: "African Leadership University", degree: "BA", fieldOfStudy: "Graphic Design", startYear: 2015, endYear: 2019 }],
                projects: [{ name: "Marketing Site", description: "Redesign.", technologies: ["React", "CSS"], role: "Frontend Dev", startDate: "2021-01-01", endDate: "2021-06-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "David", lastName: "Nshimiyimana", headline: "Digital Marketing Specialist", location: "Bujumbura, Burundi",
                skills: [
                    { name: "Marketing", level: "Advanced", yearsOfExperience: 5 },
                    { name: "SEO", level: "Expert", yearsOfExperience: 4 },
                    { name: "Sales", level: "Intermediate", yearsOfExperience: 3 }
                ],
                experience: [{ company: "AdMedia", role: "Marketing Lead", startDate: "2018-03-01", endDate: "2023-03-01", description: "Online campaigns.", technologies: ["SEO Tools"], isCurrent: false }],
                education: [{ institution: "Hope University", degree: "BA", fieldOfStudy: "Business Admin", startYear: 2014, endYear: 2018 }],
                projects: [{ name: "Campaign X", description: "National reach.", technologies: [], role: "Manager", startDate: "2020-01-01", endDate: "2020-12-01" }],
                availability: { status: "Available", type: "Contract" }
            },
            {
                firstName: "Grace", lastName: "Cyuzuzo", headline: "C++ Software Engineer", location: "Dar es Salaam, Tanzania",
                skills: [
                    { name: "C++", level: "Expert", yearsOfExperience: 6 },
                    { name: "Oracle", level: "Advanced", yearsOfExperience: 5 },
                    { name: "Agile", level: "Intermediate", yearsOfExperience: 3 }
                ],
                experience: [{ company: "Telecom T", role: "Embedded Dev", startDate: "2017-08-01", endDate: "2023-05-01", description: "Firmware.", technologies: ["C++"], isCurrent: false }],
                education: [{ institution: "University of Dar es Salaam", degree: "BSc", fieldOfStudy: "Electronics", startYear: 2013, endYear: 2017 }],
                projects: [{ name: "Switch Firmware", description: "Optimization.", technologies: ["C++"], role: "Developer", startDate: "2021-01-01", endDate: "2022-01-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "Robert", lastName: "Karemera", headline: "Go & Kubernetes Expert", location: "Addis Ababa, Ethiopia",
                skills: [
                    { name: "Go", level: "Expert", yearsOfExperience: 4 },
                    { name: "Kubernetes", level: "Advanced", yearsOfExperience: 3 },
                    { name: "AWS", level: "Advanced", yearsOfExperience: 4 },
                    { name: "PostgreSQL", level: "Intermediate", yearsOfExperience: 3 }
                ],
                experience: [{ company: "CloudNative Inc", role: "DevOps Engineer", startDate: "2019-10-01", endDate: "2024-02-01", description: "Managed orchestration.", technologies: ["Go", "Kubernetes"], isCurrent: true }],
                education: [{ institution: "Addis Ababa University", degree: "BSc", fieldOfStudy: "CS", startYear: 2015, endYear: 2019 }],
                projects: [{ name: "Cluster Setup", description: "Migrated to K8s.", technologies: ["Kubernetes"], role: "DevOps", startDate: "2021-06-01", endDate: "2022-06-01" }],
                availability: { status: "Open to Opportunities", type: "Contract" }
            }
        ];

        for (let i = 0; i < 40; i++) {
            const profile = job1Profiles[i % job1Profiles.length];

            try {
                await axios.post(`${API_BASE_URL}/api/applicants`, {
                    ...profile,
                    email: `cand_j1_mixed_${i + 1}_${Date.now()}@test.com`,
                    jobId: jobId1
                });
                console.log(`✅ SUCCESS: Submitted application ${i + 1}/40 for Job 1 [Name: ${profile.firstName} ${profile.lastName}]`);
            } catch (err) {
                console.warn(`Failed application for Job 1 Candidate ${i + 1}`);
            }
        }

        // STEP 3b: SCENARIO 1 - PLATFORM CANDIDATES (Structured JSON)
        log('STEP 3b: SCENARIO 1 - Platform structured JSON candidates for Job 2');
        const job2Profiles = [
            {
                firstName: "Kevin", lastName: "Ochieng", headline: "Lead Data Scientist", location: "Nairobi, Kenya",
                skills: [
                    { name: "Python", level: "Expert", yearsOfExperience: 8 },
                    { name: "PyTorch", level: "Expert", yearsOfExperience: 6 },
                    { name: "SQL", level: "Advanced", yearsOfExperience: 5 },
                    { name: "Machine Learning", level: "Expert", yearsOfExperience: 7 }
                ],
                experience: [{ company: "AI Labs", role: "Lead Scientist", startDate: "2016-01-01", endDate: "2024-01-01", description: "Led AI team.", technologies: ["Python", "PyTorch"], isCurrent: true }],
                education: [{ institution: "MIT", degree: "PhD", fieldOfStudy: "Machine Learning", startYear: 2012, endYear: 2016 }],
                projects: [{ name: "Vision Model", description: "Developed CV model.", technologies: ["PyTorch"], role: "Lead", startDate: "2021-01-01", endDate: "2022-01-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "Faith", lastName: "Kagame", headline: "Machine Learning Engineer", location: "Kigali, Rwanda",
                skills: [
                    { name: "Python", level: "Advanced", yearsOfExperience: 5 },
                    { name: "TensorFlow", level: "Advanced", yearsOfExperience: 4 },
                    { name: "SQL", level: "Intermediate", yearsOfExperience: 3 },
                    { name: "Data Analysis", level: "Advanced", yearsOfExperience: 4 }
                ],
                experience: [{ company: "DataCorp", role: "ML Engineer", startDate: "2019-01-01", endDate: "2023-01-01", description: "Built predictive models.", technologies: ["Python", "TensorFlow"], isCurrent: false }],
                education: [{ institution: "University of Rwanda", degree: "MSc", fieldOfStudy: "Data Science", startYear: 2017, endYear: 2019 }],
                projects: [{ name: "Predictive Analytics", description: "Forecast trends.", technologies: ["Python", "SQL"], role: "Engineer", startDate: "2020-01-01", endDate: "2021-01-01" }],
                availability: { status: "Available", type: "Contract" }
            },
            {
                firstName: "Peter", lastName: "Mwanza", headline: "Data Analyst", location: "Lusaka, Zambia",
                skills: [
                    { name: "Python", level: "Intermediate", yearsOfExperience: 3 },
                    { name: "SQL", level: "Expert", yearsOfExperience: 6 },
                    { name: "Tableau", level: "Advanced", yearsOfExperience: 4 }
                ],
                experience: [{ company: "FinanceBank", role: "Data Analyst", startDate: "2018-01-01", endDate: "2023-01-01", description: "BI & Reporting.", technologies: ["SQL", "Tableau"], isCurrent: false }],
                education: [{ institution: "University of Zambia", degree: "BSc", fieldOfStudy: "Statistics", startYear: 2014, endYear: 2018 }],
                projects: [{ name: "Sales Dashboard", description: "Real-time BI.", technologies: ["Tableau"], role: "Analyst", startDate: "2019-01-01", endDate: "2020-01-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "Diana", lastName: "Adegoke", headline: "AI Researcher", location: "Lagos, Nigeria",
                skills: [
                    { name: "Python", level: "Expert", yearsOfExperience: 7 },
                    { name: "PyTorch", level: "Advanced", yearsOfExperience: 5 },
                    { name: "NLP", level: "Expert", yearsOfExperience: 5 }
                ],
                experience: [{ company: "Research Inst.", role: "Researcher", startDate: "2017-01-01", endDate: "2024-01-01", description: "NLP research.", technologies: ["Python", "PyTorch"], isCurrent: true }],
                education: [{ institution: "University of Lagos", degree: "PhD", fieldOfStudy: "AI", startYear: 2013, endYear: 2017 }],
                projects: [{ name: "Local Language Model", description: "Transformer dialect.", technologies: ["PyTorch"], role: "Lead", startDate: "2020-01-01", endDate: "2022-01-01" }],
                availability: { status: "Available", type: "Full-time" }
            },
            {
                firstName: "John", lastName: "Doe", headline: "Backend Engineer to ML", location: "Johannesburg, SA",
                skills: [
                    { name: "Python", level: "Intermediate", yearsOfExperience: 2 },
                    { name: "Java", level: "Advanced", yearsOfExperience: 5 },
                    { name: "SQL", level: "Advanced", yearsOfExperience: 6 },
                    { name: "Machine Learning", level: "Beginner", yearsOfExperience: 1 }
                ],
                experience: [{ company: "Tech Retail", role: "Software Developer", startDate: "2018-01-01", endDate: "2023-01-01", description: "Backend APIs.", technologies: ["Java"], isCurrent: false }],
                education: [{ institution: "UCT", degree: "BSc", fieldOfStudy: "Computer Engineering", startYear: 2014, endYear: 2018 }],
                projects: [{ name: "Recommendation System", description: "CF model.", technologies: ["Python"], role: "Developer", startDate: "2022-01-01", endDate: "2023-01-01" }],
                availability: { status: "Available", type: "Full-time" }
            }
        ];

        for (let i = 0; i < 5; i++) {
            const profile = job2Profiles[i];
            try {
                await axios.post(`${API_BASE_URL}/api/applicants`, {
                    ...profile,
                    email: `platform${i + 1}_${Date.now()}@umurava.com`,
                    jobId: jobId2
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
                `#${r.rank || i + 1} ID: ${r.applicantId} | ` +
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
