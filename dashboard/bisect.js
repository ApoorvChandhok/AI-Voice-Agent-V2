const fs = require('fs');
const http = require('http');

const pageFile = 'app/workflows/builder/page.tsx';
const backup = fs.readFileSync(pageFile, 'utf8');

async function testUrl() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/workflows/builder', (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(500);
    });
  });
}

async function run() {
  const ranges = [
    { name: 'Left palette', start: 1022, end: 1024 },
    { name: 'Canvas', start: 1027, end: 1038 },
    { name: 'Right panel', start: 1041, end: 1141 },
  ];

  for (const range of ranges) {
    const lines = backup.split('\n');
    for (let i = range.start - 1; i <= range.end - 1; i++) {
      lines[i] = ''; // blank them out
    }
    fs.writeFileSync(pageFile, lines.join('\n'));
    
    await new Promise(r => setTimeout(r, 2000));
    const status = await testUrl();
    console.log(`Without ${range.name}: ${status}`);
    
    if (status === 200) {
      console.log(`FOUND CULPRIT: ${range.name}`);
    }
  }

  // Restore
  fs.writeFileSync(pageFile, backup);
  console.log('Restored.');
}

run();
