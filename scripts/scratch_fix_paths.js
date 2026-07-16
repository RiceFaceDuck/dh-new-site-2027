const fs = require('fs');
const path = require('path');

const targetDirs = [
  'dh-backoffice-react/src',
  'dh-frontend/src',
  'dh-staff-app/src'
];

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.js') || filepath.endsWith('.jsx'))) {
      callback(filepath);
    }
  });
}

const SKIP_COLLECTIONS = ['counters', 'system_counters', 'system_config', 'system_logs', 'sourcing_requests', 'shipping_rules', 'import_batches', 'product_reviews', 'users_deleted_log'];
// Wait, the audit checklist specifically says we MUST NOT hardcode these, they MUST use getCollectionPath. 
// "Found >20 instances of hardcoded doc(db, 'collection'...) across backoffice (e.g. adManagementService.js, billingStatusTransaction.js)..."

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let modified = false;

  // 1. Fix doc(db, 'xxx' ...) -> doc(db, getCollectionPath('xxx') ...)
  // Only if 'xxx' is a string literal (single or double quotes)
  const docRegex = /doc\(\s*db\s*,\s*(['"])(.*?)\1/g;
  content = content.replace(docRegex, (match, quote, colName) => {
    if (colName === 'artifacts') return match; // artifacts is special, maybe?
    if (colName.includes('/')) return match; // skip if it's a full path
    modified = true;
    return `doc(db, getCollectionPath(${quote}${colName}${quote})`;
  });

  // 2. Fix collection(db, 'xxx') -> collection(db, getCollectionPath('xxx'))
  const colRegex = /collection\(\s*db\s*,\s*(['"])(.*?)\1/g;
  content = content.replace(colRegex, (match, quote, colName) => {
    if (colName === 'artifacts') return match; 
    if (colName.includes('/')) return match;
    modified = true;
    return `collection(db, getCollectionPath(${quote}${colName}${quote})`;
  });

  // Add import if needed
  if (modified && !content.includes('getCollectionPath(')) {
    // wait, if we replaced it, it DOES contain it now. We check original
  }
  if (modified && !originalContent.includes('getCollectionPath')) {
    // Find last import
    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImport = i;
    }
    const importStr = "import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';";
    if (lastImport !== -1) {
      lines.splice(lastImport + 1, 0, importStr);
    } else {
      lines.unshift(importStr);
    }
    content = lines.join('\n');
  }

  // 3. Unhandled Promises - Simple heuristic: find .then( ... ) without .catch( ... ) or await
  // This is too risky via regex, we will do it manually for the files found in grep.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Paths in:', filePath);
  }
}

targetDirs.forEach(dir => {
  const fullDir = path.join(__dirname, dir);
  if (fs.existsSync(fullDir)) {
    walkSync(fullDir, processFile);
  }
});
