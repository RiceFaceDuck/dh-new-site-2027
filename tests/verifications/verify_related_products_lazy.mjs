/**
 * verify_related_products_lazy.mjs
 * Verification for Related Products Viewport Lazy Loading & Unmount Shield
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedChecks++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('🔍 VERIFICATION: RELATED PRODUCTS VIEWPORT LAZY LOADING');
console.log('================================================================\n');

// 1. Check RelatedProducts.jsx DOM mount guard & 300px preload margin
console.log('[1/2] Checking RelatedProducts.jsx...');
const compPath = path.join(rootDir, 'dh-frontend/src/components/product/RelatedProducts.jsx');
const compCode = fs.readFileSync(compPath, 'utf8');

assert(
  compCode.includes("rootMargin: '300px 0px'"),
  'RelatedProducts.jsx sets rootMargin to 300px 0px for preloading before scroll reaches element'
);

assert(
  !compCode.includes('if (!loading && products.length === 0) return null;'),
  'RelatedProducts.jsx does NOT early unmount before inView occurs'
);

assert(
  compCode.includes('if (inView && !loading && products.length === 0) return null;'),
  'RelatedProducts.jsx unmounts cleanly ONLY after inView occurs and no products exist'
);

assert(
  compCode.includes('<div ref={inViewRef}'),
  'RelatedProducts.jsx always anchors inViewRef in the DOM structure'
);

// 2. Check useRelatedProducts.js dependency & inView handling
console.log('\n[2/2] Checking useRelatedProducts.js...');
const hookPath = path.join(rootDir, 'dh-frontend/src/pages/hooks/useRelatedProducts.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

assert(
  hookCode.includes('[category, currentProductId, inView]'),
  'useRelatedProducts.js includes inView in the useEffect dependency array'
);

assert(
  hookCode.includes('if (!category || !inView)'),
  'useRelatedProducts.js guards against fetching before inView becomes true'
);

assert(
  hookCode.includes('relatedProductsCache'),
  'useRelatedProducts.js preserves 10-minute in-memory caching'
);

console.log('\n================================================================');
console.log(`📊 RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
  console.log('🎉 ALL RELATED PRODUCTS CHECKS PASSED FLAWLESSLY!');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED!');
  process.exit(1);
}
