const fs = require('fs');
let code = fs.readFileSync('full-workflow-test.js', 'utf8');

code = code.replace(
  'screened1.slice(0, 3).forEach((r, i) => {',
  'screened1.forEach((r, i) => {'
);


fs.writeFileSync('full-workflow-test.js', code);
