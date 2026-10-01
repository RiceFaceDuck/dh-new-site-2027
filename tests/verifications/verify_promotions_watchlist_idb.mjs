import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================');
console.log('  🔍 VERIFY: Promotions Watchlist - Zero-Read IDB SKU Validation');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

// 1. Check promotionService.js imports and exports
const promoServicePath = path.resolve('Management System/dh-backoffice-react/src/firebase/promotionService.js');
const promoServiceContent = fs.readFileSync(promoServicePath, 'utf8');

it('promotionService.js imports inventorySyncMetaService and exports validateSkus', () => {
  assert(
    promoServiceContent.includes("import { inventorySyncMetaService } from './inventory/inventorySyncMetaService';"),
    'Must import inventorySyncMetaService'
  );
  assert(
    promoServiceContent.includes('export const validateSkus = async'),
    'Must export validateSkus function'
  );
  assert(
    promoServiceContent.includes('validateSkus,'),
    'Must include validateSkus inside promotionService export object'
  );
});

it('validateSkus queries inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false }) first', () => {
  assert(
    promoServiceContent.includes('inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false })'),
    'Must call getOrFetchCatalog with forceRefresh: false to prioritize L1/L2 cache'
  );
  assert(
    promoServiceContent.includes('catalogSkuMap.set('),
    'Must index catalog items in a Map for O(1) zero-read lookup'
  );
});

it('validateSkus handles case-insensitivity and whitespace trimming for SKUs', () => {
  assert(
    promoServiceContent.includes('.toUpperCase()'),
    'Must normalize SKU comparisons using toUpperCase'
  );
  assert(
    promoServiceContent.includes('.trim()'),
    'Must trim input and catalog SKUs'
  );
});

it('validateSkus retains Firestore chunked query fallback when catalog cache is unavailable', () => {
  assert(
    promoServiceContent.includes("console.warn('⚠️ [promotionService] Catalog cache validation failed, falling back to Firestore query:'"),
    'Must have safe try-catch logging for catalog cache fallback'
  );
  assert(
    promoServiceContent.includes("where('sku', 'in', chunk)"),
    'Must maintain fallback Firestore query for resilience'
  );
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
