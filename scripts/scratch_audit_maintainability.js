const fs = require('fs');
const path = require('path');

const apps = [
  'dh-backoffice-react/src',
  'dh-frontend/src',
  'dh-staff-app/src',
  'dh-shared'
];

function scanDir(dir, stats) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'build' || file === 'dist' || file.startsWith('.')) continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, stats);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      stats.totalFiles++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      stats.totalLines += lines;
      if (lines > 300) { // lowering threshold to see moderately large files
        stats.largeFiles.push({ file: fullPath.replace(__dirname, ''), lines });
      }
      
      const commentMatches = content.match(/\/\*[\s\S]*?\*\/|\/\/.*/g);
      if (commentMatches) {
         stats.filesWithComments++;
      }
    }
  }
}

const report = {};
for (const app of apps) {
  const stats = { totalFiles: 0, totalLines: 0, largeFiles: [], filesWithComments: 0 };
  scanDir(path.join(__dirname, app), stats);
  stats.avgLines = stats.totalFiles > 0 ? (stats.totalLines / stats.totalFiles).toFixed(0) : 0;
  report[app] = stats;
}

console.log(JSON.stringify(report, null, 2));
