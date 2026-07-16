import fs from 'fs';

const report = JSON.parse(fs.readFileSync('lint_report.json', 'utf-8'));

for (const file of report) {
  let content = fs.readFileSync(file.filePath, 'utf-8');
  let hasChanges = false;

  // Let's just fix the unescaped entities
  if (file.messages.some(m => m.ruleId === 'react/no-unescaped-entities')) {
    // We could replace unescaped " inside JSX text with &quot;
    // but it's risky with simple regex. Let's ignore it for now as it's not a functional bug,
    // or just leave it. The user specifically asked to clear unused variables ("เคลียร์ขยะและตัวแปรที่ไม่ได้ใช้").
  }
}
