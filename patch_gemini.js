const fs = require('fs');
let code = fs.readFileSync('src/services/ai/geminiService.ts', 'utf8');

code = code.replace(
  'interface ScreeningResultItem {',
  'interface ScreeningResultItem {\n  shortlisted?: boolean;\n  reasonForNotShortlisting?: string;'
);

code = code.replace(
  'Return ONLY a valid JSON array containing the top ${limit} ranked candidates\\n for this role.',
  'Return ONLY a valid JSON array containing ALL evaluated candidates ranked from highest to lowest score.\\nFlag whether each candidate should be shortlisted (based on whether they meet core requirements).\\nIf a candidate is NOT shortlisted, explicitly provide the reason.'
);

code = code.replace(
  '"recommendation": "<string>"\\n    }',
  '"recommendation": "<string>",\\n      "shortlisted": <boolean>,\\n      "reasonForNotShortlisting": "<string or null>"\\n    }'
);

code = code.replace(
  'relevanceToRole: "High relevance based on past experience",\\n      recommendation: "Strongly recommend for interview"\\n    }));',
  'relevanceToRole: "High relevance based on past experience",\\n      recommendation: "Strongly recommend for interview",\\n      shortlisted: index < limit / 2,\\n      reasonForNotShortlisting: index >= limit / 2 ? "Lacks specific framework experience" : undefined\\n    }));'
);

fs.writeFileSync('src/services/ai/geminiService.ts', code);
