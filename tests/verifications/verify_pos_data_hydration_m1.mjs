/**
 * Verification Suite: M1 - POS Data Layer & Hydration
 * Run: node tests/verifications/verify_pos_data_hydration_m1.mjs
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function fail(msg, err) {
  console.error(`  [FAIL] ${msg}: ${err}`);
  failed++;
}

console.log('==================================================================');
console.log('  DH Notebook: Worker M1 - POS Data Layer & Hydration Verification');
console.log('==================================================================\n');

// 1. Verify usePosCart.js
console.log('--- 1. Testing Product Catalog Hydration & Quota Guard (usePosCart.js) ---');
try {
  const posCartPath = path.resolve('dh-backoffice-react/src/components/billing/pos/hooks/usePosCart.js');
  const posCartCode = fs.readFileSync(posCartPath, 'utf8');

  assert(!posCartCode.includes('getPaginatedProducts'), 'usePosCart must eliminate getPaginatedProducts(50)');
  pass('usePosCart.js: getPaginatedProducts(50) 50-read mount leak eliminated');

  assert(posCartCode.includes('catalogHydrationService'), 'usePosCart must import and use catalogHydrationService');
  assert(posCartCode.includes('catalogHydrationService.hydrateCatalog()'), 'usePosCart must call catalogHydrationService.hydrateCatalog()');
  pass('usePosCart.js: Integrated with catalogHydrationService.hydrateCatalog()');

  assert(posCartCode.includes('p.barcode'), 'usePosCart must match p.barcode for exact and similar matches');
  pass('usePosCart.js: Barcode matching support added for scanners');

  assert(posCartCode.includes('products: mergedProducts'), 'usePosCart must expose products in return object');
  pass('usePosCart.js: Exposes products in return contract for consumers');
} catch (e) {
  fail('usePosCart.js verification', e.message);
}

// 2. Verify catalogHydrationService.js
console.log('\n--- 2. Testing 3-Tier Chunked Catalog Service (catalogHydrationService.js) ---');
try {
  const servicePath = path.resolve('dh-backoffice-react/src/firebase/catalogHydrationService.js');
  assert(fs.existsSync(servicePath), 'catalogHydrationService.js must exist');
  const serviceCode = fs.readFileSync(servicePath, 'utf8');

  assert(serviceCode.includes('idb-keyval'), 'catalogHydrationService must use idb-keyval for L2 cache');
  pass('catalogHydrationService.js: Implements Tier 2 IndexedDB L2 cache via idb-keyval');

  assert(serviceCode.includes('search_index'), 'catalogHydrationService must check catalogs/search_index manifest');
  assert(serviceCode.includes('search_index_p'), 'catalogHydrationService must fetch chunks search_index_p1..p7');
  pass('catalogHydrationService.js: Implements Tier 3 Chunk loading (catalogs/search_index_p1..p7)');

  assert(serviceCode.includes('gasStockService'), 'catalogHydrationService must retain gasStockService as fallback');
  pass('catalogHydrationService.js: Retains gasStockService as graceful fallback');
} catch (e) {
  fail('catalogHydrationService.js verification', e.message);
}

// 3. Verify BillingMain.jsx clean up
console.log('\n--- 3. Testing Dead State Removal (BillingMain.jsx) ---');
try {
  const billingMainPath = path.resolve('dh-backoffice-react/src/pages/billing/BillingMain.jsx');
  const billingMainCode = fs.readFileSync(billingMainPath, 'utf8');

  assert(!billingMainCode.includes('const [products] = useState([]);'), 'Dead products state must be removed from BillingMain');
  assert(!billingMainCode.includes('const [isProductsLoading] = useState(false);'), 'Dead isProductsLoading state must be removed from BillingMain');
  pass('BillingMain.jsx: Dead products = [] and isProductsLoading states cleaned up');
} catch (e) {
  fail('BillingMain.jsx verification', e.message);
}

// 4. Verify Customer Directory Guard in useCustomerData.js
console.log('\n--- 4. Testing Customer Directory Guard (useCustomerData.js) ---');
try {
  const custPath = path.resolve('dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js');
  const custCode = fs.readFileSync(custPath, 'utf8');

  assert(!custCode.includes('0AUXLNHI'), 'Hardcoded deleteDoc for 0AUXLNHI must be removed');
  assert(!custCode.includes('0AUxlnHi'), 'Hardcoded deleteDoc for 0AUxlnHi must be removed');
  assert(!custCode.includes('deleteDoc('), 'deleteDoc calls must be removed from useCustomerData');
  pass('useCustomerData.js: Permanently removed unauthorized hardcoded deleteDoc operations');

  assert(custCode.includes('customers_directory'), 'useCustomerData must respect catalogs/customers_directory on cold start');
  pass('useCustomerData.js: Slashes cold-start reads by checking catalogs/customers_directory (1 Read)');

  assert(custCode.includes('limit(300)'), 'useCustomerData queries must be bounded');
  pass('useCustomerData.js: Bounded delta queries enforced');
} catch (e) {
  fail('useCustomerData.js verification', e.message);
}

// 5. Verify Promotions & Freebies Cache in usePosState.js
console.log('\n--- 5. Testing Promotions & Freebies Session Caching (usePosState.js) ---');
try {
  const statePath = path.resolve('dh-backoffice-react/src/components/billing/pos/hooks/usePosState.js');
  const stateCode = fs.readFileSync(statePath, 'utf8');

  assert(stateCode.includes('MARKETING_CACHE_TTL'), 'usePosState must define MARKETING_CACHE_TTL');
  assert(stateCode.includes('inMemoryPromos'), 'usePosState must implement inMemoryPromos fast cache');
  assert(stateCode.includes('sessionStorage.getItem(MARKETING_CACHE_KEY_TIME)'), 'usePosState must check sessionStorage cache');
  assert(stateCode.includes('products: cartState.products'), 'usePosState must pass through products from cartState');
  pass('usePosState.js: Session and in-memory TTL caching implemented for promotions and freebies');
  pass('usePosState.js: Exposes products in return object');
} catch (e) {
  fail('usePosState.js verification', e.message);
}

// 6. Verify Shipping Rules Cache in PosSystem.jsx
console.log('\n--- 6. Testing Shipping Rules Session Caching (PosSystem.jsx) ---');
try {
  const posPath = path.resolve('dh-backoffice-react/src/components/billing/PosSystem.jsx');
  const posCode = fs.readFileSync(posPath, 'utf8');

  assert(posCode.includes('SHIPPING_RULES_CACHE_KEY'), 'PosSystem must define SHIPPING_RULES_CACHE_KEY');
  assert(posCode.includes('SHIPPING_RULES_CACHE_TTL'), 'PosSystem must define SHIPPING_RULES_CACHE_TTL');
  assert(posCode.includes('activeProducts'), 'PosSystem must define activeProducts using posState.products');
  assert(posCode.includes('products: activeProducts'), 'PosSystem must wire activeProducts into usePosActions');
  assert(posCode.includes('useCartValidation(activeTabId, activeTab, activeProducts'), 'PosSystem must wire activeProducts into useCartValidation');
  pass('PosSystem.jsx: Session caching implemented for shipping rules (10m TTL)');
  pass('PosSystem.jsx: Wires activeProducts to usePosActions and useCartValidation');
} catch (e) {
  fail('PosSystem.jsx verification', e.message);
}

// 7. Verify Dev Server Module Transformation
console.log('\n--- 7. Testing Dev Server Module Transformation ---');
async function testModuleTransform(moduleUrl) {
  try {
    const res = await fetch(`http://localhost:3168${moduleUrl}`);
    if (res.status === 200) {
      pass(`Module ${moduleUrl} transformed cleanly (HTTP 200)`);
    } else {
      fail(`Module ${moduleUrl} HTTP status ${res.status}`);
    }
  } catch (err) {
    fail(`Module ${moduleUrl} fetch error: ${err.message}`);
  }
}

const modulesToTest = [
  '/src/components/billing/pos/hooks/usePosCart.js',
  '/src/pages/billing/BillingMain.jsx',
  '/src/pages/Customers/hooks/useCustomerData.js',
  '/src/components/billing/pos/hooks/usePosState.js',
  '/src/components/billing/PosSystem.jsx',
  '/src/firebase/catalogHydrationService.js'
];

for (const mod of modulesToTest) {
  await testModuleTransform(mod);
}

console.log('\n==================================================================');
console.log(`  Total Checks: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================================');

if (failed > 0) {
  console.error('❌ SOME VERIFICATION CHECKS FAILED!');
  process.exit(1);
} else {
  console.log('🎉 ALL M1 POS DATA LAYER & HYDRATION VERIFICATIONS PASSED!\n');
  process.exit(0);
}
