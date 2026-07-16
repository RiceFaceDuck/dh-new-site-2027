const fs = require('fs');
const path = require('path');

const files = [
  'dh-frontend/src/context/FavoritesProvider.jsx',
  'dh-frontend/src/firebase/footerClientService.js',
  'dh-frontend/src/firebase/partnerLocationService.js',
  'dh-frontend/src/firebase/privacyCookiesClientService.js',
  'dh-frontend/src/firebase/storefrontSettingsService.js',
  'dh-frontend/src/hooks/useCookieConsent.js',
  'dh-frontend/src/hooks/useStorefrontTheme.js',
  'dh-frontend/src/pages/Home/components/HeroSection.jsx',
  'dh-frontend/src/pages/SearchPage.jsx',
  'dh-frontend/src/pages/hooks/useProductDetail.js',
  
  'dh-backoffice-react/src/components/billing/dashboard/order-summary/OrderSummaryItems.jsx',
  'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js',
  'dh-backoffice-react/src/components/billing/pos/hooks/usePosCart.js',
  'dh-backoffice-react/src/components/billing/pos/hooks/usePosState.js',
  'dh-backoffice-react/src/components/inventory/hooks/useInventorySearch.js',
  'dh-backoffice-react/src/components/search/HistoryLogPanel.jsx',
  'dh-backoffice-react/src/components/todo/WholesaleCard.jsx',
  'dh-backoffice-react/src/firebase/transactionImportService.js',
  'dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js',
  'dh-backoffice-react/src/pages/GenerateSync/components/GlobalSchemaSettings.jsx',
  'dh-backoffice-react/src/pages/GenerateSync/hooks/useUploadTransactionsLogic.js',
  'dh-backoffice-react/src/pages/hooks/useProductSearchQuery.js',
  
  'dh-staff-app/src/pages/ProfileMain.jsx'
];

let updatedCount = 0;

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn('File not found:', fullPath);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Skip if already has safeJsonParse
  if (content.includes('safeJsonParse')) {
    continue;
  }
  
  // Check if it uses JSON.parse (but ignore JSON.parse(JSON.stringify) - though we filtered those from the list)
  if (content.includes('JSON.parse(')) {
    // Add import statement after the last import
    const importRegex = /import\s+.*?['"];?\s*\n/g;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = match.index + match[0].length;
    }
    
    const importStmt = `import { safeJsonParse } from 'dh-shared';\n`;
    content = content.slice(0, lastIndex) + importStmt + content.slice(lastIndex);
    
    // Replace JSON.parse with safeJsonParse
    content = content.replace(/JSON\.parse\(/g, 'safeJsonParse(');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    updatedCount++;
    console.log('Updated:', relPath);
  }
}

console.log(`Successfully updated ${updatedCount} files.`);
