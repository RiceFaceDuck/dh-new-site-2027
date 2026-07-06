const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dirs = ['dh-backoffice-react', 'dh-frontend', 'dh-staff-app', 'dh-shared'];
let report = '# Dependency Audit Report\n\n';

for (const dir of dirs) {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) continue;
  
  report += `## ${dir}\n\n`;
  
  console.log(`Checking ${dir}...`);
  
  // Vulnerabilities
  try {
    console.log(`  Running npm audit...`);
    const auditStr = execSync('npm.cmd audit', { cwd: fullPath, encoding: 'utf8', stdio: 'pipe' });
    report += `### Vulnerabilities\nNo vulnerabilities found (or minor).\n\n`;
  } catch (err) {
    // only include the summary part of the audit if possible, or just the whole thing
    const out = err.stdout || '';
    report += `### Vulnerabilities\n\`\`\`\n${out}\n\`\`\`\n\n`;
  }
  
  // Outdated
  try {
    console.log(`  Running npm outdated...`);
    const outdatedStr = execSync('npm.cmd outdated', { cwd: fullPath, encoding: 'utf8', stdio: 'pipe' });
    report += `### Outdated\nNone found.\n\n`;
  } catch (err) {
    report += `### Outdated\n\`\`\`\n${err.stdout || ''}\n\`\`\`\n\n`;
  }
  
  // Unused
  try {
    console.log(`  Running npx depcheck...`);
    const depcheckStr = execSync('npx.cmd depcheck', { cwd: fullPath, encoding: 'utf8', stdio: 'pipe' });
    report += `### Unused Dependencies\n\`\`\`\n${depcheckStr}\n\`\`\`\n\n`;
  } catch (err) {
    report += `### Unused Dependencies\n\`\`\`\n${err.stdout || ''}\n\`\`\`\n\n`;
  }
}

fs.writeFileSync('dependency_audit_report.md', report);
console.log('Done! Wrote to dependency_audit_report.md');
