const fs = require('fs');
const path = require('path');

const filesToFix = [
  '../dh-backoffice-react/src/firebase/categoryService.js',
  '../dh-backoffice-react/src/firebase/categorySyncService.js',
  '../dh-backoffice-react/src/firebase/customerAdminService.js',
  '../dh-backoffice-react/src/firebase/shippingService.js',
  '../dh-backoffice-react/src/firebase/transactionImportService.js',
  '../dh-backoffice-react/src/pages/Customers/hooks/useCustomerHistory.js',
  '../dh-backoffice-react/src/pages/GenerateSync/components/RecentImportsModal.jsx',
  '../dh-backoffice-react/src/pages/History/components/MigrationButton.jsx',
  '../dh-backoffice-react/src/pages/managers/pricing/hooks/usePricingSettings.js',
  '../dh-backoffice-react/src/pages/todo/hooks/useSourcingRequests.js',
  '../dh-backoffice-react/src/scripts/run_staff_test.test.js',
  '../dh-staff-app/src/firebase/staffService.js'
];

for (const relPath of filesToFix) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Add import if needed
  if (content.includes("collection(db, '") || content.includes('collection(db, "')) {
    if (!content.includes('getCollectionPath')) {
      // Find the last import statement
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, "import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';");
        content = lines.join('\n');
      }
    }
  }

  // Replace collection(db, 'name') with collection(db, getCollectionPath('name'))
  content = content.replace(/collection\s*\(\s*db\s*,\s*['"]([^'"]+)['"]\s*\)/g, (match, p1) => {
    if (match.includes('getCollectionPath')) return match;
    return `collection(db, getCollectionPath('${p1}'))`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', relPath);
  }
}
