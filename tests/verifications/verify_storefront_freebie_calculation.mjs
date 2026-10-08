import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Storefront Freebie Per-Item & Per-Bill Calculations');
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

// Extract pure functions using Function constructor
const startIndex = hookCode.indexOf('export const getEligibleTotals =');
const endIndex = hookCode.indexOf('export function usePromotions');
const rawCode = hookCode.slice(startIndex, endIndex);
const codeToRun = `
  ${rawCode.replace(/export const /g, 'const ')}
  return { getEligibleTotals, evaluatePromotion, evaluateFreebie };
`;
const factory = new Function(codeToRun);
const { evaluateFreebie } = factory();

// Test 1: Per-Item calculation with matching PANEL category
test('Per-Item: Buy 2 PANEL items with 1 gift per item -> calculatedQty = 2', () => {
  const freebieRule = {
    id: 'freebie-1',
    title: 'ซื้อจอทุกรุ่น แถมกาว',
    itemName: 'TO0158',
    qty: 1,
    distributionMode: 'per_item',
    maxPerBill: 100,
    applicableTypes: ['PANEL'],
    isActive: true
  };

  const cartItems = [
    { sku: 'PANEL-14', name: 'LED 14.0', type: 'PANEL', price: 3090, qty: 1 },
    { sku: 'FAN-DELL', name: 'FAN-DELL', type: 'FAN', price: 190, qty: 1 },
    { sku: 'PANEL-15', name: 'LED 15.6', type: 'PANEL', price: 2690, qty: 1 }
  ];

  const result = evaluateFreebie(freebieRule, cartItems, 5970, 'RETAIL');
  assert.equal(result.isApplicable, true, 'Rule must be applicable');
  assert.equal(result.eligibleQty, 2, 'Must match 2 eligible PANEL items');
  assert.equal(result.calculatedQty, 2, 'calculatedQty must be 2 (1 * 2)');
});

// Test 2: Per-Item respects maxPerBill cap
test('Per-Item: Buy 5 PANEL items with maxPerBill = 3 -> calculatedQty capped at 3', () => {
  const freebieRule = {
    id: 'freebie-2',
    title: 'ซื้อจอทุกรุ่น แถมกาว',
    itemName: 'TO0158',
    qty: 1,
    distributionMode: 'per_item',
    maxPerBill: 3,
    applicableTypes: ['PANEL'],
    isActive: true
  };

  const cartItems = [
    { sku: 'PANEL-14', name: 'LED 14.0', type: 'PANEL', price: 3090, qty: 5 }
  ];

  const result = evaluateFreebie(freebieRule, cartItems, 15450, 'RETAIL');
  assert.equal(result.isApplicable, true);
  assert.equal(result.calculatedQty, 3, 'Must be capped at maxPerBill = 3');
});

// Test 3: Per-Bill mode grants fixed quantity regardless of item count
test('Per-Bill: Buy 5 items with per_bill mode -> calculatedQty = base qty (1)', () => {
  const freebieRule = {
    id: 'freebie-3',
    title: 'แถมของขวัญต่อบิล',
    itemName: 'GIFT-01',
    qty: 1,
    distributionMode: 'per_bill',
    maxPerBill: 1,
    applicableTypes: ['PANEL'],
    isActive: true
  };

  const cartItems = [
    { sku: 'PANEL-14', name: 'LED 14.0', type: 'PANEL', price: 3090, qty: 5 }
  ];

  const result = evaluateFreebie(freebieRule, cartItems, 15450, 'RETAIL');
  assert.equal(result.isApplicable, true);
  assert.equal(result.calculatedQty, 1, 'Must give fixed 1 gift per bill');
});

// Test 4: Quota clamp
test('Quota limit clamp: Remaining quota overrides requested count if exhausted', () => {
  const freebieRule = {
    id: 'freebie-4',
    title: 'ซื้อจอทุกรุ่น แถมกาว',
    itemName: 'TO0158',
    qty: 1,
    distributionMode: 'per_item',
    maxPerBill: 100,
    quotaLimit: 10,
    quotaUsed: 8, // 2 left
    applicableTypes: ['PANEL'],
    isActive: true
  };

  const cartItems = [
    { sku: 'PANEL-14', name: 'LED 14.0', type: 'PANEL', price: 3090, qty: 5 }
  ];

  const result = evaluateFreebie(freebieRule, cartItems, 15450, 'RETAIL');
  assert.equal(result.isApplicable, true);
  assert.equal(result.calculatedQty, 2, 'Must clamp to remaining quota 2');
});

// Test 5: Code contract check for Checkout and Submission
test('Frontend code contracts correctly consume calculatedQty', () => {
  const cartFreebiePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/cart/CartFreebieProgress.jsx');
  const cartFreebieCode = fs.readFileSync(cartFreebiePath, 'utf8');
  assert.ok(cartFreebieCode.includes('calculatedQty: currentCalculatedQty'), 'CartFreebieProgress must include calculatedQty');

  const privSelectorPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/checkout/PrivilegeSelector.jsx');
  const privSelectorCode = fs.readFileSync(privSelectorPath, 'utf8');
  assert.ok(privSelectorCode.includes('calculatedQty: evalRes.calculatedQty'), 'PrivilegeSelector must store calculatedQty');
  assert.ok(privSelectorCode.includes('f.calculatedQty'), 'PrivilegeSelector must render calculatedQty');

  const detailsPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/checkout/summary/CheckoutSummaryDetails.jsx');
  const detailsCode = fs.readFileSync(detailsPath, 'utf8');
  assert.ok(detailsCode.includes('freebie.calculatedQty'), 'CheckoutSummaryDetails must prioritize calculatedQty');

  const submitPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/checkout/checkoutSubmitService.js');
  const submitCode = fs.readFileSync(submitPath, 'utf8');
  assert.ok(submitCode.includes('freebie.calculatedQty'), 'checkoutSubmitService must use calculatedQty for requestedQty');
});

console.log(`\n================================================================`);
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
