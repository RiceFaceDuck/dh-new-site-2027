const fs = require('fs');
const path = require('path');

const filesToFix = [
  '../dh-backoffice-react/src/firebase/categorySyncService.js',
  '../dh-backoffice-react/src/firebase/customerAdminService.js',
  '../dh-backoffice-react/src/firebase/freebieService.js',
  '../dh-backoffice-react/src/firebase/inventory/inventoryExportService.js',
  '../dh-backoffice-react/src/firebase/inventory/inventoryImportService.js',
  '../dh-backoffice-react/src/firebase/promotionService.js',
  '../dh-backoffice-react/src/firebase/userManagementService.js',
  '../dh-backoffice-react/src/firebase/userStaffService.js',
  '../dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js',
  '../dh-backoffice-react/src/pages/Customers/hooks/useCustomerHistory.js',
  '../dh-backoffice-react/src/pages/gallery/GalleryMain.jsx',
  '../dh-backoffice-react/src/pages/managers/CreditDashboard/hooks/useLedgerStats.js',
  '../dh-backoffice-react/src/pages/managers/settings/data_repair/useDataRepair.js',
  '../dh-backoffice-react/src/pages/managers/wallet/hooks/useWalletManagement.js',
  '../dh-backoffice-react/src/pages/ManagersOverview/useManagerDashboard.js',
  '../dh-backoffice-react/src/pages/todo/hooks/useWholesalePrices.js',
  '../dh-frontend/src/firebase/productService.js'
];

for (const relPath of filesToFix) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Ensure limit is imported from firebase/firestore
  if (content.includes("from 'firebase/firestore'") || content.includes('from "firebase/firestore"')) {
    if (!content.includes(' limit,') && !content.includes(', limit') && !content.includes('{ limit }') && !content.includes('{limit,')) {
      content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]firebase\/firestore['"]/, (match, p1) => {
        return `import { limit, ${p1.trim()} } from 'firebase/firestore'`;
      });
    }
  }

  // Regex to find query(...) blocks. This is a bit tricky, but we can do a simpler replacement:
  // Replace query(collection(db, 'xxx'), where('a','==','b')) with query(..., limit(300))
  // We look for query( followed by anything that doesn't have `limit(` before the balancing parenthesis.
  
  let result = '';
  let i = 0;
  while (i < content.length) {
    let qIdx = content.indexOf('query(', i);
    if (qIdx === -1) {
      result += content.slice(i);
      break;
    }
    result += content.slice(i, qIdx + 6);
    i = qIdx + 6;
    
    // find balancing paren
    let parens = 1;
    let j = i;
    while (j < content.length && parens > 0) {
      if (content[j] === '(') parens++;
      else if (content[j] === ')') parens--;
      j++;
    }
    
    let inner = content.slice(i, j - 1);
    if (!inner.includes('limit(')) {
        // Only append limit if it's a firebase query with arguments (e.g. collection, where, orderBy)
        if (inner.includes('collection(') || inner.includes('where(') || inner.includes('orderBy(') || inner.includes('collectionGroup(') || inner.includes('ref')) {
            result += inner + ', limit(300))';
        } else {
            result += inner + ')';
        }
    } else {
        result += inner + ')';
    }
    i = j;
  }
  content = result;

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed limit in', relPath);
  }
}
