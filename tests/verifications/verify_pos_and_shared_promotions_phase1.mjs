import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Promotions Phase 1 Fixes (Shared Engine, POS & UI)');
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

// 1. Verify priceEngine.js implementation
test('priceEngine supports FIXED_AMOUNT and case-insensitive SKUs', async () => {
  const enginePath = path.resolve(REPO_ROOT, 'Management System/dh-shared/src/priceEngine.js');
  const engineCode = fs.readFileSync(enginePath, 'utf8');

  assert.ok(engineCode.includes("promoType === 'FIXED_AMOUNT'"), 'Must support FIXED_AMOUNT promo type');
  assert.ok(engineCode.includes("toUpperCase()"), 'Must normalize SKU / Type to upperCase');

  const { pathToFileURL } = await import('node:url');
  const fileUrl = pathToFileURL(path.resolve(REPO_ROOT, 'Management System/dh-shared/src/priceEngine.js')).href;
  const { calculatePromotionDiscount } = await import(fileUrl);

  // Test FIXED_AMOUNT
  const fixedPromo = { type: 'FIXED_AMOUNT', value: 100 };
  const items = [{ id: 'ITEM_1', price: 500, qty: 1 }];
  const d1 = calculatePromotionDiscount(500, items, fixedPromo);
  assert.equal(d1, 100, 'FIXED_AMOUNT should calculate 100 discount');

  // Test FIXED fallback
  const fixedLegacy = { type: 'FIXED', value: 50 };
  const d2 = calculatePromotionDiscount(500, items, fixedLegacy);
  assert.equal(d2, 50, 'Legacy FIXED should calculate 50 discount');

  // Test Case-insensitive SKU
  const skuPromo = { type: 'PERCENTAGE', value: 10, applicableSkus: ['case-01'] };
  const skuItems = [{ sku: 'CASE-01', price: 1000, qty: 1 }];
  const d3 = calculatePromotionDiscount(1000, skuItems, skuPromo);
  assert.equal(d3, 100, 'Case-insensitive SKU match should calculate 100 discount');
});

// 2. Verify billingTransactionService and usePosActions quota linkage
test('billingTransactionService resolves appliedPromotion and appliedPromotions', () => {
  const billingTxPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/billingTransactionService.js');
  const billingTxCode = fs.readFileSync(billingTxPath, 'utf8');

  assert.ok(billingTxCode.includes('promosList'), 'Must define unified promosList');
  assert.ok(billingTxCode.includes('orderData.appliedPromotion'), 'Must support orderData.appliedPromotion single object');
  assert.ok(billingTxCode.includes('orderData.appliedPromotions'), 'Must support orderData.appliedPromotions array');
});

// 3. Verify usePosActions sends appliedPromotions
test('usePosActions sends appliedPromotions array upon checkout', () => {
  const posActionsPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
  const posActionsCode = fs.readFileSync(posActionsPath, 'utf8');

  assert.ok(posActionsCode.includes('appliedPromotions: activeTab.appliedPromoDetails ? [activeTab.appliedPromoDetails] : []'), 'usePosActions must send appliedPromotions array');
});

// 4. Verify PromotionTable buttons are visible without hover
test('PromotionTable action buttons are permanently visible', () => {
  const tablePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/managers/components/promotion/PromotionTable.jsx');
  const tableCode = fs.readFileSync(tablePath, 'utf8');

  assert.ok(!tableCode.includes('opacity-0 group-hover:opacity-100'), 'Actions column must not hide buttons with opacity-0 group-hover:opacity-100');
  assert.ok(tableCode.includes('แก้ไขโปรโมชัน'), 'Must have accessible title for Edit');
  assert.ok(tableCode.includes('ลบโปรโมชัน'), 'Must have accessible title for Delete');
});

// 5. Verify PromotionCard has clean Thai text and binds type/value
test('PromotionCard renders clean Thai text and binds type/value', () => {
  const cardPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/todo/cards/PromotionCard.jsx');
  const cardCode = fs.readFileSync(cardPath, 'utf8');

  assert.ok(!cardCode.includes('เธ เธฒเธฃ'), 'Must not contain mojibake text');
  assert.ok(cardCode.includes('การแจ้งเตือนโปรโมชัน'), 'Must contain clean Thai title');
  assert.ok(cardCode.includes('promoType === \'PERCENTAGE\''), 'Must support promoType');
  assert.ok(cardCode.includes('promoValue'), 'Must bind promoValue');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
