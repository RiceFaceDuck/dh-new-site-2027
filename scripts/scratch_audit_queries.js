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
    let insideQuery = false;
    let queryLines = [];
    let queryStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const text = lines[i].trim();

        // Very basic multi-line query detection
        if (text.includes('query(')) {
            insideQuery = true;
            queryLines = [text];
            queryStartLine = lineNum;
        } else if (insideQuery) {
            queryLines.push(text);
        }

        // Look for the end of the query or if it's single line
        if (insideQuery && (text.includes(')') || text.includes(';'))) {
            const fullQueryText = queryLines.join(' ');
            
            // Check if limit is missing
            if (!fullQueryText.includes('limit(')) {
                // Ignore safe collections that are known to be small, like shipping_rules, categories, freebies, etc
                const isSafe = fullQueryText.includes('categories') || 
                               fullQueryText.includes('shipping_rules') ||
                               fullQueryText.includes('storefront_settings') ||
                               fullQueryText.includes('featured_products') ||
                               fullQueryText.includes('promotions');

                if (!isSafe) {
                    issues.push({ file: filePath, line: queryStartLine, type: 'Query without limit', text: fullQueryText.substring(0, 150) });
                }
            }
            insideQuery = false;
        }

        // Catch onSnapshot inside useEffect that doesn't seem to have a cleanup function (naive check)
        // This would require AST parsing to be accurate, but we can just regex for now.
    }
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

fs.writeFileSync(path.join(__dirname, 'firestore_audit_results_2.txt'), output);
console.log('Results written to firestore_audit_results_2.txt');
