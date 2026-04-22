const fs = require('fs');
let code = fs.readFileSync('src/models/ScreeningResult.ts', 'utf8');

code = code.replace('  recommendation: string;\n}', '  recommendation: string;\n  shortlisted: boolean;\n  reasonForNotShortlisting?: string;\n}');
code = code.replace('recommendation: { type: String },\n    },', 'recommendation: { type: String },\n      shortlisted: { type: Boolean, default: false },\n      reasonForNotShortlisting: { type: String },\n    },');

fs.writeFileSync('src/models/ScreeningResult.ts', code);
