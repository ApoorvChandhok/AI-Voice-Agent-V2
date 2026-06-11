const fs = require('fs');
const file = 'components/workflows/WorkflowNodeConfigPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const useClientMatch = code.match(/"use client";\r?\n/);
if (useClientMatch) {
  code = code.replace(useClientMatch[0], '');
  code = '"use client";\n' + code;
  fs.writeFileSync(file, code);
  console.log('Fixed use client');
} else {
  console.log('use client not found');
}
