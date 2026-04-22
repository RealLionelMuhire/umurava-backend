const fs = require('fs');
let code = fs.readFileSync('src/controllers/screeningController.ts', 'utf8');

code = code.replace(
  '    const limit = parseInt(req.query.limit as string) || 10;\n\n    const { shortlist, error } = await runScreening(job, applicants, limit);',
  '    let limit = parseInt(req.query.limit as string) || 10;\n    if (limit > 20) limit = 20;\n\n    let { shortlist, error } = await runScreening(job, applicants, limit);\n    if (shortlist) shortlist = shortlist.slice(0, limit);'
);

fs.writeFileSync('src/controllers/screeningController.ts', code);
