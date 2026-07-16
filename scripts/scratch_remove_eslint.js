const fs = require('fs');
const path = require('path');

const filesToFix = [
  'dh-frontend/src/components/cart/CartActivePromotions.jsx',
  'dh-frontend/src/components/checkout/PrivilegeSelector.jsx',
  'dh-frontend/src/components/product/ProductCommunitySection.jsx',
  'dh-frontend/src/hooks/useCartLogic.js',
  'dh-frontend/src/pages/CategoryPage.jsx',
  'dh-frontend/src/pages/Checkout.jsx',
  'dh-backoffice-react/src/components/billing/pos/hooks/useCartValidation.js'
];

for (const relPath of filesToFix) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // Remove the eslint disable comment for exhaustive-deps
    content = content.replace(/\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\s*\n/g, '');

    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log('Removed eslint-disable in', relPath);
    }
  }
}
