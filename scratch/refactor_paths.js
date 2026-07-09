const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\DH Notebook\\Management System';
const apps = ['dh-frontend', 'dh-backoffice-react', 'dh-staff-app'];

// Root collections that should be replaced with getCollectionPath()
const rootCollections = ['users', 'orders', 'products', 'categories', 'promotions', 'freebies', 'todos', 'partners', 'ActivePartners', 'settings', 'credit_transactions', 'system_accounts', 'sales_stats', 'admin_audits'];

// Path to pathUtils depending on the app
const pathUtilsImportMap = {
    'dh-frontend': 'dh-shared',
    'dh-backoffice-react': 'dh-shared',
    'dh-staff-app': 'dh-shared'
};

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!['node_modules', 'dist', '.git', 'build'].includes(file)) {
                processDirectory(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    // Detect what app we are in
    let currentApp = null;
    if (filePath.includes('dh-frontend')) currentApp = 'dh-frontend';
    else if (filePath.includes('dh-backoffice-react')) currentApp = 'dh-backoffice-react';
    else if (filePath.includes('dh-staff-app')) currentApp = 'dh-staff-app';
    
    if (!currentApp) return;

    // Remove any locally defined `getCollectionPath` function
    if (content.includes('const getCollectionPath = (colName) => {') || content.includes('const getCollectionPath = (collectionName) => {')) {
         content = content.replace(/const getCollectionPath = \(.*?\) => \{\s*if \(.*?\) \{\s*return .*?;\s*\}\s*return .*?;\s*\};/gs, '');
         content = content.replace(/const getCollectionPath = \(.*?\) => \{\s*return .*?;\s*\};/gs, '');
         modified = true;
    }

    // Replace collection(db, 'xxx') -> collection(db, getCollectionPath('xxx'))
    // Replace collection(db, "xxx") -> collection(db, getCollectionPath('xxx'))
    // Replace doc(db, 'xxx', ...) -> doc(db, getCollectionPath('xxx'), ...)
    
    const regexCollection = /collection\(\s*db\s*,\s*(['"])([^'"]+)(['"])\s*\)/g;
    content = content.replace(regexCollection, (match, q1, colName, q3) => {
        if (rootCollections.includes(colName)) {
            modified = true;
            return `collection(db, getCollectionPath('${colName}'))`;
        }
        if (colName.includes('/')) {
             // Example: users/${uid}/wallet_transactions
             if (colName.startsWith('users/')) {
                 modified = true;
                 return `collection(db, \`\${getCollectionPath('users')}/\${${colName.replace('users/${', '')}\`)`;
                 // Note: this is a bit tricky if it's already a template string. Let's handle template strings separately
             }
        }
        return match;
    });

    const regexDoc = /doc\(\s*db\s*,\s*(['"])([^'"]+)(['"])\s*,/g;
    content = content.replace(regexDoc, (match, q1, colName, q3) => {
        if (rootCollections.includes(colName)) {
            modified = true;
            return `doc(db, getCollectionPath('${colName}'),`;
        }
        return match;
    });
    
    // Also handle template strings inside doc/collection
    const regexTemplateDoc = /doc\(\s*db\s*,\s*`users\/\$\{([^}]+)\}`\s*,/g;
    content = content.replace(regexTemplateDoc, (match, uidVar) => {
        modified = true;
        return `doc(db, getCollectionPath('users'), ${uidVar},`;
    });

    const regexTemplateCollection = /collection\(\s*db\s*,\s*`users\/\$\{([^}]+)\}\/([^`]+)`\s*\)/g;
    content = content.replace(regexTemplateCollection, (match, uidVar, subCol) => {
        modified = true;
        return `collection(db, getCollectionPath('users'), ${uidVar}, '${subCol}')`;
    });

    if (modified) {
        // Check if getCollectionPath is imported
        if (!content.includes('getCollectionPath')) {
             // It shouldn't happen because we just added it, but let's be sure it's imported
             console.log("Modified but no getCollectionPath?", filePath);
        } else if (!content.includes('import { getCollectionPath }') && !content.includes('import {getCollectionPath}')) {
             // Add import at the top of imports
             const importLine = `import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';\n`;
             // Find last import
             const lastImportIndex = content.lastIndexOf('import ');
             if (lastImportIndex !== -1) {
                 const endOfLastImport = content.indexOf('\n', lastImportIndex);
                 content = content.slice(0, endOfLastImport + 1) + importLine + content.slice(endOfLastImport + 1);
             } else {
                 content = importLine + content;
             }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Refactored: ${filePath}`);
    }
}

apps.forEach(app => {
    console.log(`Processing ${app}...`);
    processDirectory(path.join(rootDir, app));
});
console.log('Done.');
