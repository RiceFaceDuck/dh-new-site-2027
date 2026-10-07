import fs from 'fs';
import path from 'path';

console.log("🚀 Starting Phase 2 Verification: Validation, Sanitization & Guards...");

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check useAdManager.js has sanitizeUrl, URL protocol check, MIME type check, and price guard
const useAdManagerPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
const useAdManagerContent = fs.readFileSync(useAdManagerPath, 'utf8');

assert(
  useAdManagerContent.includes("const sanitizeUrl = (url) =>"),
  "useAdManager.js has sanitizeUrl function"
);
assert(
  useAdManagerContent.includes("validImageTypes = ['image/jpeg', 'image/png', 'image/webp'"),
  "useAdManager.js validates file.type against image MIME types"
);
assert(
  useAdManagerContent.includes("Number(formData.price) < 0"),
  "useAdManager.js blocks negative price submission"
);
assert(
  useAdManagerContent.includes("['http:', 'https:'].includes(parsed.protocol)"),
  "useAdManager.js validates URL protocol scheme"
);

// 2. Check AdFormModal.jsx has accept and min attributes
const adFormModalPath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdFormModal.jsx');
const adFormModalContent = fs.readFileSync(adFormModalPath, 'utf8');

assert(
  adFormModalContent.includes('min="0"'),
  "AdFormModal.jsx sets min=\"0\" on price input"
);
assert(
  adFormModalContent.includes('accept="image/jpeg,image/png,image/webp,image/gif"'),
  "AdFormModal.jsx sets explicit image MIME types in file inputs"
);

// 3. Check AdListTable.jsx uses getSafeUrl
const adListTablePath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
const adListTableContent = fs.readFileSync(adListTablePath, 'utf8');

assert(
  adListTableContent.includes("const getSafeUrl = (url) =>"),
  "AdListTable.jsx contains getSafeUrl helper"
);
assert(
  adListTableContent.includes("getSafeUrl(ad.targetUrl)"),
  "AdListTable.jsx uses getSafeUrl on targetUrl anchor links"
);

console.log(`\n========================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
