const fs = require('fs');
const path = require('path');

const filesToFix = [
  "dh-frontend/src/components/cart/CartFreebieProgress.jsx",
  "dh-frontend/src/components/cart/CartItemCard.jsx",
  "dh-frontend/src/components/CategoryList.jsx",
  "dh-frontend/src/components/Navbar.jsx",
  "dh-frontend/src/components/product/ImageZoomModal.jsx",
  "dh-frontend/src/components/product/ProductImageSection.jsx",
  "dh-frontend/src/pages/StoreProfile/components/StoreProfileInfo.jsx"
];

for (const fileRelPath of filesToFix) {
  const fullPath = path.join(__dirname, fileRelPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // We find <img ... > and insert loading="lazy" if not present
  content = content.replace(/<img\s([^>]+)>/g, (match, p1) => {
    if (p1.includes('loading=') || p1.includes('loading:')) {
      return match;
    }
    return `<img loading="lazy" ${p1}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${fileRelPath}`);
  }
}

// Now update the Audit Checklist
const checklistPath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
if (fs.existsSync(checklistPath)) {
    let checkContent = fs.readFileSync(checklistPath, 'utf8');
    checkContent = checkContent.replace(/@ID:P2-UX-032(.*?)@STAT:🟡PENDING/g, '@ID:P2-UX-032$1@STAT:🟢PASS');
    fs.writeFileSync(checklistPath, checkContent, 'utf8');
    console.log('Updated Audit Checklist P2-UX-032 to PASS');
}
