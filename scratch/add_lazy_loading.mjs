import fs from 'fs';
import path from 'path';

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-backoffice-react', 'dh-frontend', 'dh-staff-app', 'dh-shared'];
const exts = ['.jsx', '.tsx'];

let modifiedCount = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find <img ...> tags that don't have loading="lazy" or loading='lazy'
  // using a regex that checks for <img and then doesn't find loading= before the closing >
  // It's safer to just look for <img and replace it if it doesn't contain loading=
  
  const imgRegex = /<img\s([^>]+)>/g;
  let newContent = content.replace(imgRegex, (match, attrs) => {
    if (!attrs.includes('loading=')) {
      // Check if it ends with /> or just >
      if (attrs.endsWith('/')) {
        return `<img ${attrs.slice(0, -1)} loading="lazy" />`;
      } else {
        return `<img ${attrs} loading="lazy">`;
      }
    }
    return match;
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Modified: ${filePath}`);
    modifiedCount++;
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (exts.includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
}

apps.forEach(app => scanDir(path.join(rootDir, app)));
console.log(`Total files modified for lazy loading: ${modifiedCount}`);
