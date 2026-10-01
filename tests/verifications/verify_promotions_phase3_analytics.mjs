import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  📊 VERIFY: Promotions Phase 3 Schema Registry & GA4 Analytics');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Verify schemaKeys.js contains PROMOTIONS and FREEBIES
test('schemaKeys.js contains PROMOTIONS and FREEBIES in COLLECTIONS', async () => {
  const schemaKeysPath = path.resolve(REPO_ROOT, 'Management System/dh-shared/src/firebase/schemaKeys.js');
  const code = fs.readFileSync(schemaKeysPath, 'utf8');

  assert.ok(code.includes("PROMOTIONS: 'promotions'"), 'Must include PROMOTIONS');
  assert.ok(code.includes("FREEBIES: 'freebies'"), 'Must include FREEBIES');

  const { pathToFileURL } = await import('node:url');
  const fileUrl = pathToFileURL(schemaKeysPath).href;
  const { COLLECTIONS } = await import(fileUrl);
  assert.equal(COLLECTIONS.PROMOTIONS, 'promotions');
  assert.equal(COLLECTIONS.FREEBIES, 'freebies');
});

// 2. Verify promotionAnalyticsService exports tracking helpers
test('promotionAnalyticsService.js exports trackPromotionView and trackPromotionSelect', () => {
  const servicePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/promotionAnalyticsService.js');
  const code = fs.readFileSync(servicePath, 'utf8');

  assert.ok(code.includes('export const trackPromotionView ='), 'Must export trackPromotionView');
  assert.ok(code.includes('export const trackPromotionSelect ='), 'Must export trackPromotionSelect');
  assert.ok(code.includes("'view_promotion'"), 'Must emit GA4 view_promotion event');
  assert.ok(code.includes("'select_promotion'"), 'Must emit GA4 select_promotion event');
});

// 3. Verify CartActivePromotions tracks view_promotion
test('CartActivePromotions.jsx integrates trackPromotionView', () => {
  const cartPromoPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/cart/CartActivePromotions.jsx');
  const code = fs.readFileSync(cartPromoPath, 'utf8');

  assert.ok(code.includes('trackPromotionView(promotions)'), 'Must call trackPromotionView with active promotions');
});

// 4. Verify PrivilegeSelector tracks select_promotion
test('PrivilegeSelector.jsx integrates trackPromotionSelect', () => {
  const selectorPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/checkout/PrivilegeSelector.jsx');
  const code = fs.readFileSync(selectorPath, 'utf8');

  assert.ok(code.includes('trackPromotionSelect(bestPromo)'), 'Must call trackPromotionSelect on bestPromo application');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
