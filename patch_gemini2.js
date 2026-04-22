const fs = require('fs');
let code = fs.readFileSync('src/services/ai/geminiService.ts', 'utf8');

code = code.replace(
  'interface ScreeningResultItem {\n  rank: number;\n  applicantId: string;\n  matchScore: number;\n  strengths: string[];\n  gaps: string[];\n  relevanceToRole: string;\n  recommendation: string;\n}',
  'interface ScreeningResultItem {\n  rank: number;\n  applicantId: string;\n  matchScore: number;\n  strengths: string[];\n  gaps: string[];\n  relevanceToRole: string;\n  recommendation: string;\n  shortlisted: boolean;\n  reasonForNotShortlisting: string | null;\n}'
);

code = code.replace(
  'Return ONLY a valid JSON array containing the top ${limit} ranked candidates\\n for this role.',
  'Return ONLY a valid JSON array containing ALL evaluated candidates ranked from highest score to lowest score.\\nFlag whether each candidate should be shortlisted (true/false).\\nIf a candidate is NOT shortlisted (shortlisted: false), explicitly provide the reason in `reasonForNotShortlisting`. If they ARE shortlisted, set `reasonForNotShortlisting` to null.'
);

code = code.replace(
  '"recommendation": "<string>"\\n    }',
  '"recommendation": "<string>",\\n      "shortlisted": <boolean>,\\n      "reasonForNotShortlisting": "<string or null>"\\n    }'
);

code = code.replace(
  'relevanceToRole: "High relevance based on past experience",\\n      recommendation: "Strongly recommend for interview"\\n    }));',
  'relevanceToRole: "High relevance based on past experience",\\n      recommendation: "Strongly recommend for interview",\\n      shortlisted: index < limit / 2,\\n      reasonForNotShortlisting: index >= limit / 2 ? "Lacks specific framework experience" : null\\n    })).sort((a, b) => b.matchScore - a.matchScore).map((item, i) => ({ ...item, rank: i + 1 }));'
);

fs.writeFileSync('src/services/ai/geminiService.ts', code);
