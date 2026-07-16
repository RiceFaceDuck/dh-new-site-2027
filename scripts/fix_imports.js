const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'dh-frontend', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useToast(') || content.includes('useToast =')) {
    if (!content.includes('import { useToast }')) {
      // Calculate relative path to ToastContext.jsx
      const contextPath = path.join(srcDir, 'context', 'ToastContext');
      let relPath = path.relative(path.dirname(file), contextPath);
      relPath = relPath.replace(/\\/g, '/');
      if (!relPath.startsWith('.')) {
        relPath = './' + relPath;
      }
      
      const importStatement = `import { useToast } from '${relPath}';\n`;
      
      // insert after the last import
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
        fs.writeFileSync(file, lines.join('\n'));
        console.log(`Added import to ${file}`);
        fixedCount++;
      } else {
        // no imports, put at top
        lines.unshift(importStatement);
        fs.writeFileSync(file, lines.join('\n'));
        console.log(`Added import to ${file}`);
        fixedCount++;
      }
    }
  }
}

console.log(`Fixed ${fixedCount} files.`);
