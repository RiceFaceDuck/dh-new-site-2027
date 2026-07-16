const fs = require('fs');
const path = require('path');

const dirsToScan = [
    'dh-frontend/src',
    'dh-backoffice-react/src',
    'dh-staff-app/src'
];

const issues = [];

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let insideUseEffect = false;
    let hasOnSnapshot = false;
    let hasReturnUnsubscribe = false;
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('useEffect(')) {
            insideUseEffect = true;
            hasOnSnapshot = false;
            hasReturnUnsubscribe = false;
            startLine = i + 1;
        }

        if (insideUseEffect) {
            if (line.includes('onSnapshot(')) {
                hasOnSnapshot = true;
            }
            if (line.includes('return ') && (line.includes('unsub') || line.includes('() =>'))) {
                hasReturnUnsubscribe = true;
            }
        }

        // Basic detection of end of useEffect: ^  }, [dependencies]);
        if (insideUseEffect && line.match(/^\s*\}\s*,\s*\[.*\]\s*\)\s*;/)) {
            if (hasOnSnapshot && !hasReturnUnsubscribe) {
                issues.push({ file: filePath, line: startLine, msg: 'useEffect with onSnapshot but no clear return unsubscribe' });
            }
            insideUseEffect = false;
        }
    }
}

dirsToScan.forEach(dir => scanDir(path.join(__dirname, dir)));

let output = '';
issues.forEach(i => output += `${i.file}:${i.line} -> ${i.msg}\n`);
if(issues.length === 0) output = 'No issues found.';
fs.writeFileSync(path.join(__dirname, 'firestore_audit_unsub.txt'), output);
console.log('Results written to firestore_audit_unsub.txt');
