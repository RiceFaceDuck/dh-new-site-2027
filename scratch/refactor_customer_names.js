const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-frontend', 'dh-backoffice-react', 'dh-staff-app'];

// Regex to find fallback chains
// It looks for things like: obj.accountName || obj.displayName ... || 'Fallback'
// We capture the base object (e.g., obj.)
const regex = /([a-zA-Z0-9_?.]+)(?:accountName|storeName)(?:\s*\|\|\s*[a-zA-Z0-9_?.]+(?:displayName|firstName|name|email))+\s*(?:\|\|\s*('[^']*'|`[^`]*`|"[^"]*"|[a-zA-Z0-9_]+))?/g;

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.git') {
            processDirectory(fullPath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;
    let needsImport = false;

    content = content.replace(regex, (match, prefix, fallback) => {
        // prefix might be "customer." or "order.customer?." or "userData."
        let objStr = prefix;
        if (objStr.endsWith('.')) objStr = objStr.slice(0, -1);
        if (objStr.endsWith('?')) objStr = objStr.slice(0, -1);
        
        // Sometimes the prefix is just an object without dot, e.g. if the code was "data.accountName" prefix is "data."
        
        let replacement = `getCustomerDisplayName(${objStr})`;
        if (fallback && fallback !== "''" && fallback !== '""') {
            replacement = `getCustomerDisplayName(${objStr}, ${fallback})`;
        } else if (fallback === "''" || fallback === '""') {
             replacement = `getCustomerDisplayName(${objStr}, '')`;
        }

        console.log(`[${path.basename(filePath)}] REPLACING: \n  ${match}\n  WITH: ${replacement}\n`);
        modified = true;
        needsImport = true;
        return replacement;
    });

    // Special cases
    if (content.includes("data.accountName || data.displayName || oldData.accountName || oldData.displayName || uid")) {
        content = content.replace("data.accountName || data.displayName || oldData.accountName || oldData.displayName || uid", 
                                  "getCustomerDisplayName(data, getCustomerDisplayName(oldData, uid))");
        modified = true;
        needsImport = true;
    }

    if (modified) {
        if (needsImport && !content.includes('getCustomerDisplayName')) { // wait, if I just replaced it, it includes it.
            // Check if import already exists
            if (!originalContent.includes('dh-shared/src/utils/customerUtils')) {
                const importStatement = `import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';\n`;
                // Add after the last import, or at the top
                const lastImportIndex = content.lastIndexOf('import ');
                if (lastImportIndex !== -1) {
                    const endOfLastImport = content.indexOf('\n', lastImportIndex);
                    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
                } else {
                    content = importStatement + content;
                }
            }
        }
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

apps.forEach(app => {
    processDirectory(path.join(rootDir, app, 'src'));
});

console.log('Refactoring complete.');
