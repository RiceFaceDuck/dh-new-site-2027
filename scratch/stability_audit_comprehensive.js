const fs = require('fs');
const path = require('path');

const targetDirs = ['dh-shared', 'dh-staff-app', 'dh-backoffice-react', 'dh-frontend'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

const issues = {
    totalFilesScanned: 0,
    missingDeps: [],
    missingCleanup: [],
    missingUnsubscribe: [],
    missingErrorHandling: [],
    potentialMemoryLeaks: []
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'build' && f !== 'coverage') {
                walkDir(dirPath, callback);
            }
        } else {
            if (fileExtensions.includes(path.extname(dirPath))) {
                callback(dirPath);
            }
        }
    });
}

targetDirs.forEach(dir => {
    walkDir(path.join(__dirname, '..', dir), (filePath) => {
        issues.totalFilesScanned++;
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let hasInterval = content.includes('setInterval');
        let hasClearInterval = content.includes('clearInterval');
        if (hasInterval && !hasClearInterval) {
            issues.missingCleanup.push({ file: filePath, issue: 'setInterval without clearInterval' });
        }

        let hasTimeout = content.includes('setTimeout');
        let hasClearTimeout = content.includes('clearTimeout');
        // setTimeout is sometimes used without cleanup, but in React it can cause state updates on unmounted components
        if (hasTimeout && !hasClearTimeout && content.includes('useEffect')) {
             issues.potentialMemoryLeaks.push({ file: filePath, issue: 'setTimeout inside component without clearTimeout (Potential Memory Leak)' });
        }

        let hasOnSnapshot = content.includes('onSnapshot(');
        let hasUnsubscribe = content.includes('unsubscribe') || content.includes('unsub');
        if (hasOnSnapshot && !hasUnsubscribe) {
            issues.missingUnsubscribe.push({ file: filePath, issue: 'onSnapshot without unsubscribe (Memory Leak & Firebase Quota Drain)' });
        }

        const thenMatches = (content.match(/\.then\s*\(/g) || []).length;
        const catchMatches = (content.match(/\.catch\s*\(/g) || []).length;
        if (thenMatches > catchMatches) {
            issues.missingErrorHandling.push({ file: filePath, issue: `Found ${thenMatches} .then() but only ${catchMatches} .catch() - Unhandled Promises can crash the app.` });
        }
        
        // Find async without try/catch
        const asyncMatches = (content.match(/async\s+function/g) || []).length + (content.match(/async\s*\(/g) || []).length;
        const tryCatchMatches = (content.match(/try\s*{/g) || []).length;
        // This is a rough estimate, but let's just log it if there's a big discrepancy
        if (asyncMatches > 0 && tryCatchMatches === 0 && (content.includes('await getDocs') || content.includes('await setDoc') || content.includes('await addDoc'))) {
             issues.missingErrorHandling.push({ file: filePath, issue: `Found async function with Firestore operations but no try/catch block.` });
        }

        // naive check for useEffect without dependencies array (potential infinite loop)
        // matches useEffect(() => { ... })
        lines.forEach((line, index) => {
            if (line.includes('useEffect(') && !content.includes(', [])') && !content.includes(', [')) {
                // if there's literally no array bracket after useEffect
                if (!content.match(/useEffect\(.*,\s*\[.*\]\)/s)) {
                    // Check if it's really missing by using a simple heuristic on the whole file
                    const useEffectMatches = (content.match(/useEffect\(/g) || []).length;
                    const depsArrayMatches = (content.match(/,\s*\[.*\]\s*\)/g) || []).length;
                    // Actually, let's just flag files with useEffect but no dependency arrays at all
                    if (useEffectMatches > 0 && !(content.includes(', [') || content.includes(',[]'))) {
                         // Only add once per file
                         if (!issues.missingDeps.find(i => i.file === filePath)) {
                             issues.missingDeps.push({ file: filePath, issue: `useEffect found but no dependency array '[]' anywhere in file (Potential Infinite Loop)` });
                         }
                    }
                }
            }
        });
    });
});

console.log(JSON.stringify(issues, null, 2));
