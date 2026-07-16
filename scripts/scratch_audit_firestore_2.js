const fs = require('fs');
const path = require('path');

const dirsToScan = [
    'dh-frontend/src',
    'dh-backoffice-react/src',
    'dh-staff-app/src',
    'dh-shared/src'
];

const issues = [];

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const text = line.trim();

        if (text.includes('onSnapshot(')) {
            issues.push({ file: filePath, line: lineNum, type: 'onSnapshot', text });
            if (text.includes('collection(') && !text.includes('limit(') && !text.includes('where(') && !text.includes('query(')) {
                issues.push({ file: filePath, line: lineNum, type: 'Unbounded onSnapshot', text });
            }
        }

        if (text.includes('getDocs(')) {
            issues.push({ file: filePath, line: lineNum, type: 'getDocs', text });
            if (text.includes('collection(') && !text.includes('limit(') && !text.includes('where(') && !text.includes('query(')) {
                issues.push({ file: filePath, line: lineNum, type: 'Unbounded getDocs', text });
            }
        }
    });
}

dirsToScan.forEach(dir => scanDir(path.join(__dirname, dir)));

let output = '';
const grouped = issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
}, {});

for (const [type, items] of Object.entries(grouped)) {
    output += `\n--- ${type} (${items.length}) ---\n`;
    items.forEach(i => output += `${i.file}:${i.line} -> ${i.text}\n`);
}

fs.writeFileSync(path.join(__dirname, 'firestore_audit_results.txt'), output);
console.log('Results written to firestore_audit_results.txt');
