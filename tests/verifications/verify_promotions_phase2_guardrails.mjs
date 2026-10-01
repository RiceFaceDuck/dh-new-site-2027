import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🛡️ VERIFY: Promotions Phase 2 Guardrails & Security Rules');
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

// 1. Verify firestore.rules
test('firestore.rules restricts promotion & freebie create/delete to isManagerOrAdmin', () => {
  const rulesPath = path.resolve(REPO_ROOT, 'Management System/firestore.rules');
  const rulesCode = fs.readFileSync(rulesPath, 'utf8');

  // Find promotions block
  const promoBlockStart = rulesCode.indexOf('match /promotions/{promoId}');
  const promoBlockEnd = rulesCode.indexOf('match /freebies/{freebieId}');
  const promoBlock = rulesCode.slice(promoBlockStart, promoBlockEnd);

  assert.ok(promoBlock.includes('allow create, delete: if isManagerOrAdmin();'), 'Promotions create/delete must require isManagerOrAdmin()');
  assert.ok(promoBlock.includes("request.resource.data.get('quotaUsed', 0) <= resource.data.quotaLimit"), 'Promotions update must enforce quotaLimit ceiling');

  // Find freebies block
  const freebieBlockStart = promoBlockEnd;
  const freebieBlockEnd = rulesCode.indexOf('match /partner_ads/{adId}');
  const freebieBlock = rulesCode.slice(freebieBlockStart, freebieBlockEnd);

  assert.ok(freebieBlock.includes('allow create, delete: if isManagerOrAdmin();'), 'Freebies create/delete must require isManagerOrAdmin()');
  assert.ok(freebieBlock.includes("request.resource.data.get('quotaUsed', 0) <= resource.data.quotaLimit"), 'Freebies update must enforce quotaLimit ceiling');
});

// 2. Verify PromoModal.jsx checks all business rules
test('PromoModal.jsx enforces customerType, dates, minQty, and SKUs', () => {
  const modalPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/layout/PromoModal.jsx');
  const modalCode = fs.readFileSync(modalPath, 'utf8');

  assert.ok(modalCode.includes('promo.customerType !== \'ALL\''), 'PromoModal must validate customerType');
  assert.ok(modalCode.includes('promo.quotaLimit'), 'PromoModal must check quotaLimit');
  assert.ok(modalCode.includes('promo.minQty'), 'PromoModal must check minQty');
  assert.ok(modalCode.includes('promo.applicableSkus'), 'PromoModal must check applicableSkus');
  assert.ok(modalCode.includes('promo.applicableTypes'), 'PromoModal must check applicableTypes');
  assert.ok(modalCode.includes('isNotExpired'), 'PromoModal must check expiration date');
  assert.ok(modalCode.includes('isStarted'), 'PromoModal must check start date');
});

// 3. Verify usePosActions.js guards handleApplyPromotion
test('usePosActions guards handleApplyPromotion against quota overflow', () => {
  const actionsPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
  const actionsCode = fs.readFileSync(actionsPath, 'utf8');

  assert.ok(actionsCode.includes('promo.quotaLimit && (promo.quotaUsed || 0) >= promo.quotaLimit'), 'handleApplyPromotion must guard against exhausted quota');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
