const fs = require('fs');
const path = require('path');

const DIRS_TO_AUDIT = [
  '../dh-backoffice-react/src',
  '../dh-frontend/src',
  '../dh-staff-app/src'
];

let issues = {
  missingUnsubscribe: [],
  hardcodedDbPaths: [],
  unpaginatedQueries: [],
  missingConfirmations: [],
  catchWithoutLogging: []
};

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        callback(fullPath);
      }
    }
  }
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath);

  let hasOnSnapshot = false;
  let hasReturnUnsubscribe = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check 1: onSnapshot inside file but no return unsubscribe
    if (line.includes('onSnapshot(')) hasOnSnapshot = true;
    if (hasOnSnapshot && (line.includes('return () =>') || line.includes('return unsubscribe') || line.includes('return unsub'))) {
      hasReturnUnsubscribe = true;
    }

    // Check 2: Hardcoded db paths (collection(db, 'something'))
    if (line.match(/collection\s*\(\s*db\s*,\s*['"][^'"]+['"]\s*\)/)) {
      if (!line.includes('getCollectionPath') && !fileName.includes('firebase.js') && !filePath.includes('dh-shared')) {
         issues.hardcodedDbPaths.push({ file: filePath, line: i + 1, snippet: line.trim() });
      }
    }
    
    // Check 3: unpaginated queries (getDocs or onSnapshot without limit or pagination)
    if ((line.includes('query(') && !line.includes('limit(') && !line.includes('limitToLast(')) && (content.includes('getDocs') || content.includes('onSnapshot'))) {
      // Look at the block around it to see if it's a huge collection
      if (line.includes('users') || line.includes('orders') || line.includes('products') || line.includes('transactions')) {
          // just a heuristic flag
          issues.unpaginatedQueries.push({ file: filePath, line: i + 1, snippet: line.trim() });
      }
    }

    // Check 4: Delete actions without window.confirm or custom confirmation
    if (line.toLowerCase().includes('delete') && line.includes('function') && !content.includes('confirm')) {
      if (fileName.includes('Service') || line.includes('Service')) {
         // Maybe OK in service, but in UI we need confirm. We will skip service checks for confirm.
      } else if (content.includes('deleteDoc')) {
         issues.missingConfirmations.push({ file: filePath, line: i + 1, snippet: line.trim() });
      }
    }

    // Check 5: Catch blocks without logging or withToastError
    if (line.includes('catch (error)') || line.includes('catch(err)')) {
      const nextLines = lines.slice(i, i + 5).join(' ');
      if (!nextLines.includes('toast') && !nextLines.includes('console.error') && !nextLines.includes('withToastError')) {
         issues.catchWithoutLogging.push({ file: filePath, line: i + 1, snippet: line.trim() });
      }
    }
  }

  // Check 1 eval
  if (hasOnSnapshot && !hasReturnUnsubscribe && !filePath.includes('Service')) {
     issues.missingUnsubscribe.push(filePath);
  }
}

for (const dir of DIRS_TO_AUDIT) {
  walk(path.join(__dirname, dir), auditFile);
}

fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(issues, null, 2));
console.log('Audit completed. Found issues:');
console.log(`Missing Unsubscribe: ${issues.missingUnsubscribe.length}`);
console.log(`Hardcoded DB Paths: ${issues.hardcodedDbPaths.length}`);
console.log(`Unpaginated Queries (Heuristic): ${issues.unpaginatedQueries.length}`);
console.log(`Missing Confirmations before delete: ${issues.missingConfirmations.length}`);
console.log(`Silent Catch Blocks: ${issues.catchWithoutLogging.length}`);
