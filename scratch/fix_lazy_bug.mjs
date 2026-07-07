import fs from 'fs';
import path from 'path';

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-backoffice-react', 'dh-frontend', 'dh-staff-app', 'dh-shared'];
const exts = ['.jsx', '.tsx'];

let modifiedCount = 0;

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
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      const originalContent = content;
      
      // Fix the broken arrow functions
      content = content.replace(/=\s*loading="lazy">/g, '=>');
      content = content.replace(/=\s*loading='lazy'>/g, '=>');

      if (originalContent !== content) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Fixed syntax in: ${fullPath}`);
        modifiedCount++;
      }
    }
  }
}

apps.forEach(app => scanDir(path.join(rootDir, app)));
console.log(`Total files fixed: ${modifiedCount}`);
