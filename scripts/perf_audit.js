const fs = require('fs');
const path = require('path');

const dirsToScan = [
  'c:/DH Notebook/Management System/dh-frontend/src',
  'c:/DH Notebook/Management System/dh-backoffice-react/src',
  'c:/DH Notebook/Management System/dh-staff-app/src'
];

let issues = {
  missingUnsubscribe: [],
  missingEffectDeps: [],
  largeListsWithoutVirtualization: [],
  potentialNPlusOne: [],
  missingImageLazyLoading: []
};

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let hasOnSnapshot = false;
  let hasReturnUnsubscribe = false;
  let useEffectCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for onSnapshot usage
    if (line.includes('onSnapshot(')) {
      hasOnSnapshot = true;
    }
    if (hasOnSnapshot && line.match(/return.*unsubscribe/i)) {
      hasReturnUnsubscribe = true;
    }

    // Check for useEffect without dependencies (very basic heuristic)
    if (line.match(/useEffect\(\s*\(\)\s*=>\s*\{/)) {
      // Find the closing brace of this useEffect
      let depth = 1;
      let j = i + 1;
      let foundClosing = false;
      let hasDeps = false;
      while (j < lines.length && j < i + 100) { // limit search to 100 lines for simplicity
         if (lines[j].includes('{')) depth++;
         if (lines[j].includes('}')) depth--;
         if (depth === 0) {
             foundClosing = true;
             // Check if next characters contain a comma and bracket
             const restOfLine = lines[j].substring(lines[j].indexOf('}'));
             if (restOfLine.match(/\}\s*,\s*\[/) || (lines[j+1] && lines[j+1].match(/^\s*,\s*\[/))) {
                 hasDeps = true;
             }
             break;
         }
         j++;
      }
      if (foundClosing && !hasDeps) {
         issues.missingEffectDeps.push(`${filePath}:${i+1}`);
      }
    }

    // Check for map inside JSX for potential virtualization needs (rough)
    if (line.match(/\.map\(\s*\w+\s*=>\s*\(/)) {
       issues.largeListsWithoutVirtualization.push(`${filePath}:${i+1}`);
    }

    // Check for potential N+1: await getDoc inside map or loop
    if (line.match(/await\s+getDoc(s)?\(/) && (content.substring(Math.max(0, content.indexOf(line) - 200), content.indexOf(line)).includes('.map(') || content.substring(Math.max(0, content.indexOf(line) - 200), content.indexOf(line)).includes('for ('))) {
        issues.potentialNPlusOne.push(`${filePath}:${i+1}`);
    }
    
    // Check for image without lazy loading
    if (line.match(/<img\s+(?!.*loading="lazy")/) && !line.includes('LazyImage')) {
        issues.missingImageLazyLoading.push(`${filePath}:${i+1}`);
    }
  }

  if (hasOnSnapshot && !hasReturnUnsubscribe) {
    issues.missingUnsubscribe.push(filePath);
  }
}

dirsToScan.forEach(scanDir);

console.log(JSON.stringify(issues, null, 2));
