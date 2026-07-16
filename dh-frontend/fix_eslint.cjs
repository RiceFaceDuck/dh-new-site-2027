const fs = require('fs');

const report = JSON.parse(fs.readFileSync('lint_report.json', 'utf-8'));

report.forEach(file => {
  let content = fs.readFileSync(file.filePath, 'utf-8');
  let lines = content.split('\n');
  let hasChanges = false;
  
  // Fix `toast` no-undef
  if (file.messages.some(m => m.ruleId === 'no-undef' && m.message.includes("'toast' is not defined"))) {
    // Replace `toast` with `showToast` where applicable
    const origContent = content;
    content = content.replace(/toast\(/g, 'showToast(');
    if (content !== origContent) {
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(file.filePath, content, 'utf-8');
    console.log('Fixed:', file.filePath);
  }
});
