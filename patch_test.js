const fs = require('fs');
let code = fs.readFileSync('full-workflow-test.js', 'utf8');

code = code.replace(
  "await axios.post(`${API_BASE_URL}/api/screening/${jobId1}`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });",
  "await axios.post(`${API_BASE_URL}/api/screening/${jobId1}?limit=20`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });"
);

code = code.replace(
  "const resultsRes1 = await axios.get(`${API_BASE_URL}/api/screening/${jobId1}?limit=20`, { headers: { 'Authorization': `Bearer ${authToken}` } });",
  "const resultsRes1 = await axios.get(`${API_BASE_URL}/api/screening/${jobId1}`, { headers: { 'Authorization': `Bearer ${authToken}` } });"
);

const newScenarioBlock = `        // STEP 4c: Screening Job 2
        log('STEP 4c: Screening Job 2 (Platform Candidates)');
        await axios.post(
          \`\${API_BASE_URL}/api/screening/\${jobId2}?limit=5\`, 
          {}, 
          { headers: { Authorization: \`Bearer \${authToken}\` } }
        );
        await sleep(10000);
        
        const resultsRes2 = await axios.get(
          \`\${API_BASE_URL}/api/screening/\${jobId2}\`,
          { headers: { Authorization: \`Bearer \${authToken}\` } }
        );
        const screened2 = resultsRes2.data.shortlist || [];

        // STEP 5: FINAL REPORT`;

code = code.replace("        // STEP 5: FINAL REPORT", newScenarioBlock);

code = code.replace(
  "        console.log(`\\n--- JOB 2 (Data Scientist - Platform Candidates) ---`);\n        console.log(`Total Platform Applications Received: ${job2Applicants.data.length}`);",
  "        console.log(`\\n--- JOB 2 AI Screening Results ---`);\n        console.log(`Total Screened: ${screened2.length}`);\n        screened2.forEach((r, i) => {\n          console.log(\n            `#${r.rank || i+1} ID: ${r.applicantId} | ` +\n            `Score: ${r.matchScore} | ${r.recommendation}`\n          );\n        });"
);

fs.writeFileSync('full-workflow-test.js', code);
