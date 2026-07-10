const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'audit_results.json');
if (!fs.existsSync(dataPath)) process.exit(0);
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const silentBlocks = data.catchWithoutLogging || [];
const uniqueFiles = [...new Set(silentBlocks.map(b => b.file))];

for (const file of uniqueFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  const isJsx = file.endsWith('.jsx');
  let addedToast = false;

  let result = '';
  let i = 0;

  while (i < content.length) {
    let catchIdx = content.indexOf('catch', i);
    if (catchIdx === -1) {
      result += content.slice(i);
      break;
    }
    
    let prefix = content.slice(i, catchIdx);
    result += prefix;
    
    let parenStart = content.indexOf('(', catchIdx);
    let braceStart = content.indexOf('{', catchIdx);
    
    // Safety check: if braceStart is way too far, it's not a catch block (e.g. word inside a string)
    if (braceStart === -1 || (braceStart - catchIdx > 50)) {
        result += content.slice(catchIdx, catchIdx + 5);
        i = catchIdx + 5;
        continue;
    }

    result += content.slice(catchIdx, braceStart + 1);
    
    let errVar = 'error';
    if (parenStart !== -1 && parenStart < braceStart) {
        let parenEnd = content.indexOf(')', parenStart);
        errVar = content.slice(parenStart + 1, parenEnd).trim();
    }
    
    i = braceStart + 1;
    
    let parens = 1;
    let j = i;
    while (j < content.length && parens > 0) {
      if (content[j] === '{') parens++;
      else if (content[j] === '}') parens--;
      j++;
    }
    
    let body = content.slice(i, j - 1);
    
    if (!body.includes('console.error') && !body.includes('toast') && !body.includes('throw') && !body.includes('withToastError')) {
        let newLog = isJsx 
            ? `\n    console.error("🔥 Error:", ${errVar});\n    toast.error(${errVar}?.message || "เกิดข้อผิดพลาด");\n` 
            : `\n    console.error("🔥 Error:", ${errVar});\n`;
        
        if (isJsx) addedToast = true;
        result += newLog + body;
    } else {
        result += body;
    }
    
    result += '}';
    i = j;
  }

  content = result;

  if (addedToast) {
      if (!content.includes("from 'react-hot-toast'") && !content.includes('from "react-hot-toast"')) {
          content = content.replace(/import .*\n/, (match) => {
              return match + "import toast from 'react-hot-toast';\n";
          });
      }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
