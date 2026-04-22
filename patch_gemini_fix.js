const fs = require('fs');
let code = fs.readFileSync('src/services/ai/geminiService.ts', 'utf8');

code = code.replace(
  'Return ONLY a valid JSON array containing the top ${limit} ranked candidates\\n for this role.',
  'Return ONLY a valid JSON array containing ALL evaluated candidates ranked from highest score to lowest score.\\nFlag whether each candidate should be shortlisted (true/false).\\nIf a candidate is NOT shortlisted (shortlisted: false), explicitly provide the reason in `reasonForNotShortlisting`. If they ARE shortlisted, set `reasonForNotShortlisting` to null.'
);

code = code.replace(
  /"recommendation": "<string>"\\n    }/g,
  '"recommendation": "<string>",\n      "shortlisted": <boolean>,\n      "reasonForNotShortlisting": "<string or null>"\n    }'
);

code = code.replace(
  /const shortlist = applicants\.slice\(0, limit\)\.map\(\(app, index\) => \(\{\n.*rank: index \+ 1,\n.*applicantId: app\._id\.toString\(\),\n.*matchScore: Math\.floor\(Math\.random\(\) \* 40\) \+ 60, \/\/ Random score between 60 and 100\n.*strengths: \["Strong backend knowledge", "Good communication"\],\n.*gaps: \["Could use more cloud experience"\],\n.*relevanceToRole: "High relevance based on past experience",\n.*recommendation: "Strongly recommend for interview"\n.*\}\)\);/s,
  'const shortlist = applicants.slice(0, limit).map((app, index) => {\n      const matchScore = Math.floor(Math.random() * 40) + 60;\n      return {\n        rank: 0,\n        applicantId: app._id.toString(),\n        matchScore,\n        strengths: ["Strong backend knowledge", "Good communication"],\n        gaps: ["Could use more cloud experience"],\n        relevanceToRole: "High relevance based on past experience",\n        recommendation: "Strongly recommend for interview",\n        shortlisted: matchScore > 75,\n        reasonForNotShortlisting: matchScore <= 75 ? "Score below 75 threshold" : null\n      }\n    }).sort((a, b) => b.matchScore - a.matchScore).map((item, i) => ({ ...item, rank: i + 1 }));'
);

fs.writeFileSync('src/services/ai/geminiService.ts', code);
