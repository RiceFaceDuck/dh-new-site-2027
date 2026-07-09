const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-frontend', 'dh-backoffice-react', 'dh-staff-app', 'dh-shared'];

const results = [];

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!['node_modules', 'dist', '.git', 'build'].includes(file)) {
                scanDirectory(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            analyzeFile(fullPath);
        }
    }
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const relativePath = path.relative(rootDir, filePath);
        
        // 1. Missing await on Firestore operations
        if (/(setDoc|addDoc|updateDoc|deleteDoc|runTransaction)\(/.test(line)) {
            if (!/await\s+(setDoc|addDoc|updateDoc|deleteDoc|runTransaction|Promise.all|batch)/.test(line) && !/return\s+(setDoc|addDoc|updateDoc|deleteDoc|runTransaction)/.test(line)) {
                // It might be on a previous line, or part of a chain, just flag it for manual review
                if (!line.includes('=>') && !line.includes('(')) {
                   // This is a naive check, but let's record it
                   results.push({ type: 'Possible Missing Await', file: relativePath, line: lineNumber, content: line.trim() });
                }
            }
        }

        // 2. Hardcoded paths instead of pathUtils
        if (/collection\([^,]+,\s*['"`](users|orders|products|categories|wallet_transactions|credit_transactions)['"`]\)/.test(line)) {
            results.push({ type: 'Hardcoded Path', file: relativePath, line: lineNumber, content: line.trim() });
        }
        
        // 3. Document references
        if (/doc\([^,]+,\s*['"`](users|orders|products|categories)['"`]\s*,/.test(line)) {
             results.push({ type: 'Hardcoded Doc Path', file: relativePath, line: lineNumber, content: line.trim() });
        }
        
        // 4. Checking order mapping consistency (frontend -> backoffice)
        // Look for order creation in frontend
        if (relativePath.includes('dh-frontend') && line.includes('setDoc(doc(db, "orders"')) {
            results.push({ type: 'Order Creation (Frontend)', file: relativePath, line: lineNumber, content: line.trim() });
        }
    });
}

apps.forEach(app => scanDirectory(path.join(rootDir, app)));

fs.writeFileSync(path.join(rootDir, 'scratch', 'data_flow_audit_report.json'), JSON.stringify(results, null, 2));
console.log(`Found ${results.length} potential issues.`);
