import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: usePromotions Evaluation & Contract Verification');
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

const hookPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/hooks/usePromotions.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

// Test 1: Verify hook exports and returns full contract
test('usePromotions.js exports required helpers and hook structure', () => {
  assert.ok(hookCode.includes('export const getEligibleTotals ='), 'Must export getEligibleTotals');
  assert.ok(hookCode.includes('export const evaluatePromotion ='), 'Must export evaluatePromotion');
  assert.ok(hookCode.includes('export const evaluateFreebie ='), 'Must export evaluateFreebie');
  assert.ok(hookCode.includes('export function usePromotions('), 'Must export usePromotions');
  
  // Return contract check
  assert.ok(hookCode.includes('evaluatePromotion: memoEvaluatePromotion'), 'Must return evaluatePromotion in hook');
  assert.ok(hookCode.includes('evaluateFreebie: memoEvaluateFreebie'), 'Must return evaluateFreebie in hook');
  assert.ok(hookCode.includes('getEligibleTotals: memoGetEligibleTotals'), 'Must return getEligibleTotals in hook');
  assert.ok(hookCode.includes('isLoading: loading'), 'Must return isLoading alias');
  assert.ok(hookCode.includes('freebies,'), 'Must return freebies');
  assert.ok(hookCode.includes('promotions,'), 'Must return promotions');
});

// Test 2: Dynamic execution of pure evaluation logic
test('Pure logic: getEligibleTotals correctly calculates totals and filters', () => {
  // Extract pure functions using Function constructor
  const startIndex = hookCode.indexOf('export const getEligibleTotals =');
  const endIndex = hookCode.indexOf('export function usePromotions');
  const rawCode = hookCode.slice(startIndex, endIndex);
  const codeToRun = `
    ${rawCode.replace(/export const /g, 'const ')}
    return { getEligibleTotals, evaluatePromotion, evaluateFreebie };
  `;

  const factory = new Function(codeToRun);
  const { getEligibleTotals, evaluatePromotion, evaluateFreebie } = factory();

  // Test 2.1: unfiltered items
  const cartItems = [
    { sku: 'KBAS001', type: 'KEYBOARD', price: 500, qty: 2 },
    { sku: 'ADAC002', type: 'ADAPTER', price: 300, qty: 1 }
  ];
  const r1 = getEligibleTotals([], [], cartItems);
  assert.equal(r1.subtotal, 1300, 'Subtotal should be 1300');
  assert.equal(r1.qty, 3, 'Qty should be 3');

  // Test 2.2: filtered by sku
  const r2 = getEligibleTotals(['KBAS001'], [], cartItems);
  assert.equal(r2.subtotal, 1000, 'Subtotal should be 1000');
  assert.equal(r2.qty, 2, 'Qty should be 2');

  // Test 2.3: evaluatePromotion percentage discount with maxDiscount
  const promo = {
    id: 'promo_10pct',
    title: 'ลด 10% สูงสุด 100 บาท',
    type: 'PERCENTAGE',
    value: 10,
    maxDiscount: 100,
    isActive: true,
    minSpend: 500
  };
  const promoRes = evaluatePromotion(promo, [{ sku: 'KBAS001', price: 1500, qty: 1 }], 1500, 'RETAIL');
  assert.equal(promoRes.isApplicable, true, 'Should be applicable');
  assert.equal(promoRes.discountValue, 100, 'Discount should be capped at 100');

  // Test 2.4: evaluatePromotion minSpend failure
  const promoMin = {
    id: 'promo_min',
    title: 'ลด 50 บาท เมื่อช้อปครบ 500',
    type: 'FIXED_AMOUNT',
    value: 50,
    isActive: true,
    minSpend: 500
  };
  const promoMinRes = evaluatePromotion(promoMin, [{ sku: 'KBAS001', price: 200, qty: 1 }], 200, 'RETAIL');
  assert.equal(promoMinRes.isApplicable, false, 'Should not be applicable');
  assert.equal(promoMinRes.missingSpend, 300, 'Missing spend should be 300');

  // Test 2.5: evaluateFreebie applicability
  const freebie = {
    id: 'freebie_glue',
    title: 'แถมกาวเมื่อซื้อจอ',
    isActive: true,
    applicableTypes: ['PANEL'],
    minSpend: 0,
    minQty: 1
  };
  const freebieRes1 = evaluateFreebie(freebie, [{ sku: 'PNL001', type: 'PANEL', price: 1200, qty: 1 }], 1200, 'RETAIL');
  assert.equal(freebieRes1.isApplicable, true, 'Freebie should apply when panel in cart');

  const freebieRes2 = evaluateFreebie(freebie, [{ sku: 'KBAS001', type: 'KEYBOARD', price: 500, qty: 1 }], 500, 'RETAIL');
  assert.equal(freebieRes2.isApplicable, false, 'Freebie should not apply without panel');
});

// Test 3: Consumer integration validation
test('CartActivePromotions.jsx and PrivilegeSelector.jsx call signatures match usePromotions', () => {
  const cartPromoPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/cart/CartActivePromotions.jsx');
  const privSelectorPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/checkout/PrivilegeSelector.jsx');
  const cartFreebiePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/cart/CartFreebieProgress.jsx');

  const cartPromoCode = fs.readFileSync(cartPromoPath, 'utf8');
  const privCode = fs.readFileSync(privSelectorPath, 'utf8');
  const freebieCode = fs.readFileSync(cartFreebiePath, 'utf8');

  // CartActivePromotions expects evaluatePromotion and isLoading
  assert.ok(cartPromoCode.includes('evaluatePromotion'), 'CartActivePromotions uses evaluatePromotion');
  assert.ok(hookCode.includes('evaluatePromotion: memoEvaluatePromotion'), 'Hook provides evaluatePromotion');

  // PrivilegeSelector expects promotions, freebies, isLoading, evaluatePromotion, evaluateFreebie
  assert.ok(privCode.includes('evaluateFreebie'), 'PrivilegeSelector uses evaluateFreebie');
  assert.ok(hookCode.includes('evaluateFreebie: memoEvaluateFreebie'), 'Hook provides evaluateFreebie');

  // CartFreebieProgress expects getEligibleTotals
  assert.ok(freebieCode.includes('getEligibleTotals'), 'CartFreebieProgress uses getEligibleTotals');
  assert.ok(hookCode.includes('getEligibleTotals: memoGetEligibleTotals'), 'Hook provides getEligibleTotals');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
