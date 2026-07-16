const fs = require('fs');
const path = require('path');

const targetDirs = ['dh-shared', 'dh-staff-app', 'dh-backoffice-react', 'dh-frontend'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

const issues = {
    missingDeps: [], // useEffect without deps array
    missingCleanup: [], // setTimeout/setInterval without clearTimeout/clearInterval
    missingUnsubscribe: [], // onSnapshot without unsubscribe
    missingErrorHandling: [], // async without try/catch
    stateUpdateUnmounted: [], // isMounted pattern not used correctly (hard to detect, but we can try)
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'build') {
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
    walkDir(path.join(__dirname, dir), (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        let inUseEffect = false;
        let useEffectDepth = 0;
        let hasCleanup = false;
        let hasInterval = false;
        let hasSnapshot = false;

        // Simple regex checks per line or per file
        
        // Check for missing dependency arrays in useEffect: useEffect(() => {...}) without , [])
        // This is a naive regex, might have false positives/negatives, but good for a quick scan
        const useEffectRegex = /useEffect\s*\(\s*\(\)\s*=>\s*{[^]*?}\s*\)/gm;
        let match;
        // The multiline check is harder, let's just do line by line for simple ones

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Check setInterval/setTimeout
            if (line.includes('setInterval(') && !content.includes('clearInterval(')) {
                issues.missingCleanup.push({ file: filePath, line: lineNum, issue: 'setInterval without clearInterval' });
            }
            if (line.includes('setTimeout(') && !content.includes('clearTimeout(')) {
                // missingCleanup.push({ file: filePath, line: lineNum, issue: 'setTimeout without clearTimeout' });
            }

            // Check onSnapshot
            if (line.includes('onSnapshot(') && !content.includes('unsubscribe')) {
                // To be more precise, we check if they assign it to a variable or return it.
                if (!line.includes('const unsubscribe') && !line.includes('return ') && !line.includes('=>')) {
                   issues.missingUnsubscribe.push({ file: filePath, line: lineNum, issue: 'onSnapshot without obvious unsubscribe logic' });
                }
            }

            // Check for missing try/catch in async functions (naive)
            // Just look for async function declarations that don't have a try block inside.
            // A bit too complex for simple line-by-line, let's skip for now unless needed.
            
            // Look for dangerous state updates (naive)
        });
        
        // Another pass for useEffect missing deps using regex on full content
        // matches useEffect(() => { ... }) where there is no , [deps] at the end
        // A simple check: if we find useEffect(() => { and we don't find a corresponding }, [ or },[])
        // This is very hard with regex. We can use AST, but let's just do a naive check for unhandled promises.
        
        // Look for .then without .catch
        const thenRegex = /\.then\s*\(/g;
        const catchRegex = /\.catch\s*\(/g;
        const thenMatches = (content.match(thenRegex) || []).length;
        const catchMatches = (content.match(catchRegex) || []).length;
        if (thenMatches > catchMatches) {
            issues.missingErrorHandling.push({ file: filePath, issue: `Found ${thenMatches} .then() but only ${catchMatches} .catch()` });
        }
    });
});

console.log(JSON.stringify(issues, null, 2));
