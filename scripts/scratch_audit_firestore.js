const fs = require('fs');
const path = require('path');

const dirsToScan = [
    'dh-frontend/src',
    'dh-backoffice-react/src',
    'dh-staff-app/src',
    'dh-shared/src'
];

const issues = [];
let totalFilesScanned = 0;

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            totalFilesScanned++;
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let inUseEffect = false;
    let useEffectStartLine = 0;
    let snapshotUnsubscribes = [];

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check for Firestore queries
        if (line.includes('onSnapshot(')) {
            issues.push({ file: filePath, line: lineNum, type: 'onSnapshot', text: line.trim() });
            
            // Heuristic for missing limit/where
            if (line.includes('collection(') && !line.includes('limit(') && !line.includes('where(') && !line.includes('query(')) {
                issues.push({ file: filePath, line: lineNum, type: 'Unbounded onSnapshot', text: line.trim() });
            }
        }

        if (line.includes('getDocs(')) {
            issues.push({ file: filePath, line: lineNum, type: 'getDocs', text: line.trim() });
            
            // Heuristic for unbounded getDocs
            if (line.includes('collection(') && !line.includes('limit(') && !line.includes('where(') && !line.includes('query(')) {
                issues.push({ file: filePath, line: lineNum, type: 'Unbounded getDocs', text: line.trim() });
            }
        }
        
        // Updates tracking
        if (line.includes('updateDoc(') || line.includes('setDoc(')) {
             issues.push({ file: filePath, line: lineNum, type: 'Write Operation', text: line.trim() });
        }
    });
}

for (const dir of dirsToScan) {
    scanDir(path.join(__dirname, dir));
}

console.log(`Scanned ${totalFilesScanned} files.`);

// Group issues by type
const grouped = issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
}, {});

for (const [type, items] of Object.entries(grouped)) {
    console.log(`\n--- ${type} (${items.length}) ---`);
    items.slice(0, 10).forEach(i => console.log(`${i.file}:${i.line} -> ${i.text}`));
    if (items.length > 10) console.log(`... and ${items.length - 10} more`);
}
