/**
 * Empirical Adversarial Challenger Test Suite
 * Storefront Catalog: Stock Parser & Promotion Math Stress Tests
 * 
 * Target Files:
 * - dh-frontend/src/components/ProductList.jsx
 * - dh-frontend/src/hooks/usePromotions.js
 * 
 * Location: Management System/tests/adversarial/challenger_storefront_stock_and_promotions_adversarial.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  ⚔️ ADVERSARIAL CHALLENGER SUITE: Stock Parser & Promotion Math');
console.log('================================================================\n');

// ---------------------------------------------------------------------------
// 1. EXTRACT ACTUAL IMPLEMENTATION FROM SOURCE FILES
// ---------------------------------------------------------------------------

const productListPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/ProductList.jsx');
const productListCode = fs.readFileSync(productListPath, 'utf8');

const hookPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/hooks/usePromotions.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

// Build ProductList parser simulator with identical logic from lines 14-30 & 61-74
const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }
  return null;
};

const parseStock = (product) => {
  const rawStock = getVal(product, ['stock', 'stockquantity', 'quantity', 'qty', 'amount', 'คงเหลือ', 'สต๊อก', 'inventory', 'available', 'จำนวน', 'จำนวนสินค้า']);
  let stock = 0;
  if (typeof rawStock === 'boolean') {
    stock = rawStock ? 1 : 0;
  } else if (typeof rawStock === 'object' && rawStock !== null) {
    stock = rawStock.quantity ?? rawStock.stock ?? 0;
  } else if (rawStock !== null && rawStock !== undefined && rawStock !== '') {
    const parsed = Number(String(rawStock).replace(/[^0-9.-]+/g,""));
    stock = isNaN(parsed) ? 0 : parsed;
  } else if (product.inStock === true) {
    stock = 1;
  }
  return stock;
};

// Extract usePromotions pure functions directly from hookCode
const startIdx = hookCode.indexOf('export const getEligibleTotals =');
const endIdx = hookCode.indexOf('export function usePromotions');
const promoHelpersCode = hookCode.slice(startIdx, endIdx);
const promoFactory = new Function(`
  ${promoHelpersCode.replace(/export const /g, 'const ')}
  return { getEligibleTotals, evaluatePromotion, evaluateFreebie };
`);
const { getEligibleTotals, evaluatePromotion, evaluateFreebie } = promoFactory();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runCase(category, name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    console.log(`  ✅ [PASS] (${category}) ${name}`);
    passedTests++;
    return result;
  } catch (err) {
    console.log(`  ❌ [FAIL] (${category}) ${name}`);
    console.log(`     Reason: ${err.message}`);
    failedTests++;
    findings.push({ category, name, error: err.message });
  }
}

// ===========================================================================
// SECTION 1: ADVERSARIAL STRESS TEST OF STOCK PARSER (ProductList.jsx)
// ===========================================================================
console.log('\n--- [SECTION 1] Stock Parser Adversarial Stress Tests ---');

// 1.1 boolean true
runCase('StockParser', 'boolean true in rawStock: { stock: true }', () => {
  const s = parseStock({ stock: true });
  assert.strictEqual(s, 1, 'stock: true should parse to 1');
  assert.strictEqual(s > 0, true, 'hasStock should be true');
});

runCase('StockParser', 'boolean true in inStock: { inStock: true }', () => {
  const s = parseStock({ inStock: true });
  assert.strictEqual(s, 1, 'inStock: true fallback should yield 1');
  assert.strictEqual(s > 0, true, 'hasStock should be true');
});

// 1.2 boolean false
runCase('StockParser', 'boolean false in rawStock: { stock: false }', () => {
  const s = parseStock({ stock: false });
  assert.strictEqual(s, 0, 'stock: false should parse to 0');
  assert.strictEqual(s > 0, false, 'hasStock should be false');
});

runCase('StockParser', 'boolean false in inStock: { inStock: false }', () => {
  const s = parseStock({ inStock: false });
  assert.strictEqual(s, 0, 'inStock: false should yield 0');
  assert.strictEqual(s > 0, false, 'hasStock should be false');
});

// 1.3 null
runCase('StockParser', 'null stock with no other fields: { stock: null }', () => {
  const s = parseStock({ stock: null });
  assert.strictEqual(s, 0, 'null stock should parse to 0');
});

runCase('StockParser', 'null stock with inStock: true fallback: { stock: null, inStock: true }', () => {
  const s = parseStock({ stock: null, inStock: true });
  assert.strictEqual(s, 1, 'null stock should fall back to inStock: true -> 1');
});

// 1.4 undefined
runCase('StockParser', 'undefined stock: { stock: undefined }', () => {
  const s = parseStock({ stock: undefined });
  assert.strictEqual(s, 0, 'undefined stock should parse to 0');
});

runCase('StockParser', 'undefined stock with inStock: true: { inStock: true }', () => {
  const s = parseStock({ inStock: true });
  assert.strictEqual(s, 1, 'undefined stock should fall back to inStock: true -> 1');
});

// 1.5 empty string ""
runCase('StockParser', 'empty string stock: { stock: "" }', () => {
  const s = parseStock({ stock: "" });
  assert.strictEqual(s, 0, 'empty string stock should parse to 0');
});

runCase('StockParser', 'empty string stock with inStock: true: { stock: "", inStock: true }', () => {
  const s = parseStock({ stock: "", inStock: true });
  assert.strictEqual(s, 1, 'empty string stock should fall back to inStock: true -> 1');
});

// 1.6 string "0"
runCase('StockParser', 'string "0": { stock: "0" }', () => {
  const s = parseStock({ stock: "0" });
  assert.strictEqual(s, 0, '"0" should parse to 0');
  assert.strictEqual(s > 0, false, 'hasStock should be false');
});

// 1.7 string "15"
runCase('StockParser', 'string "15": { stock: "15" }', () => {
  const s = parseStock({ stock: "15" });
  assert.strictEqual(s, 15, '"15" should parse to 15');
  assert.strictEqual(s > 0, true, 'hasStock should be true');
});

// 1.8 formatted string "1,200"
runCase('StockParser', 'formatted string "1,200": { stock: "1,200" }', () => {
  const s = parseStock({ stock: "1,200" });
  assert.strictEqual(s, 1200, '"1,200" should parse to 1200');
  assert.strictEqual(s > 0, true, 'hasStock should be true');
});

// 1.9 object { quantity: 10 }
runCase('StockParser', 'nested object { quantity: 10 }: { stock: { quantity: 10 } }', () => {
  const s = parseStock({ stock: { quantity: 10 } });
  assert.strictEqual(s, 10, 'nested object quantity should parse to 10');
});

runCase('StockParser', 'top-level quantity: { quantity: 10 }', () => {
  const s = parseStock({ quantity: 10 });
  assert.strictEqual(s, 10, 'top level quantity should parse to 10');
});

// 1.10 object { stock: 0 }
runCase('StockParser', 'nested object { stock: 0 }: { stock: { stock: 0 } }', () => {
  const s = parseStock({ stock: { stock: 0 } });
  assert.strictEqual(s, 0, 'nested stock: 0 should parse to 0');
});

runCase('StockParser', 'top-level numeric stock: 0', () => {
  const s = parseStock({ stock: 0 });
  assert.strictEqual(s, 0, 'top level stock 0 should parse to 0');
});

// 1.11 object { amount: 5 }
runCase('StockParser', 'top-level amount: 5: { amount: 5 }', () => {
  const s = parseStock({ amount: 5 });
  assert.strictEqual(s, 5, 'amount: 5 at root should parse to 5');
});

runCase('StockParser', 'nested object with amount: 5: { stock: { amount: 5 } }', () => {
  const s = parseStock({ stock: { amount: 5 } });
  // Note: rawStock.quantity ?? rawStock.stock ?? 0 -> 0!
  // Document behavior
  console.log(`     [Detail] nested { stock: { amount: 5 } } parses to: ${s}`);
  assert.strictEqual(s, 0, 'nested object amount is not parsed by rawStock.quantity ?? rawStock.stock');
});

// 1.12 instock casing: { instock: true } vs { inStock: true }
runCase('StockParser', 'lowercase instock: { instock: true }', () => {
  const s = parseStock({ instock: true });
  console.log(`     [Detail] { instock: true } parses to: ${s}`);
  // Let's check whether it parses or fails
  assert.strictEqual(s, 1, 'Should recognize lowercase { instock: true } as available stock');
});

runCase('StockParser', 'snake_case in_stock: { in_stock: true }', () => {
  const s = parseStock({ in_stock: true });
  console.log(`     [Detail] { in_stock: true } parses to: ${s}`);
  assert.strictEqual(s, 1, 'Should recognize snake_case { in_stock: true } as available stock');
});

// 1.13 corrupted values
runCase('StockParser', 'corrupted string "NaN": { stock: "NaN" }', () => {
  const s = parseStock({ stock: "NaN" });
  assert.strictEqual(s, 0, '"NaN" should safely parse to 0');
});

runCase('StockParser', 'corrupted negative number: { stock: -10 }', () => {
  const s = parseStock({ stock: -10 });
  assert.strictEqual(s, -10, 'negative stock preserved');
  assert.strictEqual(s > 0, false, 'hasStock correctly false for negative stock');
});

runCase('StockParser', 'corrupted negative string: { stock: "-5" }', () => {
  const s = parseStock({ stock: "-5" });
  assert.strictEqual(s, -5, 'negative string parses to -5');
  assert.strictEqual(s > 0, false, 'hasStock correctly false for negative stock');
});

runCase('StockParser', 'corrupted text string "In Stock": { stock: "In Stock" }', () => {
  const s = parseStock({ stock: "In Stock" });
  console.log(`     [Detail] { stock: "In Stock" } parses to: ${s}`);
  // In JS, "In Stock".replace(/[^0-9.-]+/g,"") is "" -> Number("") is 0!
  assert.strictEqual(s, 0, '"In Stock" string contains no digits, parsed to 0');
});

runCase('StockParser', 'string with unit "25 pcs": { stock: "25 pcs" }', () => {
  const s = parseStock({ stock: "25 pcs" });
  assert.strictEqual(s, 25, '"25 pcs" parses cleanly to 25');
  assert.strictEqual(s > 0, true, 'hasStock should be true');
});

runCase('StockParser', 'corrupted array: { stock: [10] }', () => {
  const s = parseStock({ stock: [10] });
  console.log(`     [Detail] { stock: [10] } parses to: ${s}`);
  // [10] is an object without .quantity or .stock -> 0
  assert.strictEqual(s, 0, 'array stock fallback to 0');
});

// 1.14 Thai language keys
runCase('StockParser', 'Thai key "คงเหลือ": { "คงเหลือ": 42 }', () => {
  const s = parseStock({ 'คงเหลือ': 42 });
  assert.strictEqual(s, 42, 'Thai key คงเหลือ parses to 42');
});

runCase('StockParser', 'Thai key "จำนวนสินค้า": { "จำนวนสินค้า": 88 }', () => {
  const s = parseStock({ 'จำนวนสินค้า': 88 });
  assert.strictEqual(s, 88, 'Thai key จำนวนสินค้า parses to 88');
});

// 1.15 Can valid inventory items ever be mistakenly marked as out of stock?
runCase('StockParser', 'MISTAKEN OUT-OF-STOCK PROBE: { stockQuantity: 5 }', () => {
  const s = parseStock({ stockQuantity: 5 });
  assert.strictEqual(s > 0, true, 'stockQuantity: 5 must NOT be marked out of stock');
});

runCase('StockParser', 'MISTAKEN OUT-OF-STOCK PROBE: { stock: 0, inStock: true }', () => {
  const s = parseStock({ stock: 0, inStock: true });
  console.log(`     [Detail] { stock: 0, inStock: true } parses to: ${s}`);
  // If numeric stock is explicitly 0, should it be 0?
  assert.strictEqual(s, 0, 'Explicit stock: 0 should override inStock: true as 0 (out of stock)');
});


// ===========================================================================
// SECTION 2: ADVERSARIAL TEST OF PROMOTION & FREEBIE EVALUATION MATH
// ===========================================================================
console.log('\n--- [SECTION 2] Promotion & Freebie Evaluation Math Stress Tests ---');

// 2.1 Missing items and malformed cart inputs
runCase('PromotionMath', 'getEligibleTotals with empty cart []', () => {
  const res = getEligibleTotals([], [], []);
  assert.strictEqual(res.subtotal, 0);
  assert.strictEqual(res.qty, 0);
});

runCase('PromotionMath', 'getEligibleTotals with null cartItems', () => {
  const res = getEligibleTotals([], [], null);
  assert.strictEqual(res.subtotal, 0);
  assert.strictEqual(res.qty, 0);
});

runCase('PromotionMath', 'getEligibleTotals with undefined cartItems', () => {
  const res = getEligibleTotals([], [], undefined);
  assert.strictEqual(res.subtotal, 0);
  assert.strictEqual(res.qty, 0);
});

runCase('PromotionMath', 'getEligibleTotals with malformed items: [null, undefined, {}]', () => {
  const res = getEligibleTotals([], [], [null, undefined, {}]);
  console.log(`     [Detail] malformed items result:`, res);
  // {} has no qty, fallback: (Number(undefined) || 1) -> 1
  assert.strictEqual(typeof res.subtotal, 'number');
  assert.strictEqual(typeof res.qty, 'number');
});

runCase('PromotionMath', 'getEligibleTotals with retailPrice fallback', () => {
  const cart = [{ sku: 'SKU1', retailPrice: 250, quantity: 2 }];
  const res = getEligibleTotals([], [], cart);
  assert.strictEqual(res.subtotal, 500);
  assert.strictEqual(res.qty, 2);
});

// 2.2 Percentage discounts with maxDiscount cap
runCase('PromotionMath', 'Percentage discount below cap: 10% on 500, cap 100', () => {
  const promo = { type: 'PERCENTAGE', value: 10, maxDiscount: 100, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 500, qty: 1 }], 500);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 50);
});

runCase('PromotionMath', 'Percentage discount exceeding cap: 10% on 1500, cap 100', () => {
  const promo = { type: 'PERCENTAGE', value: 10, maxDiscount: 100, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 1500, qty: 1 }], 1500);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 100, 'Discount must be capped at 100');
});

runCase('PromotionMath', 'Percentage discount with maxDiscount = 0 (uncapped): 10% on 2000', () => {
  const promo = { type: 'PERCENTAGE', value: 10, maxDiscount: 0, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 2000, qty: 1 }], 2000);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 200, 'maxDiscount 0 should mean uncapped 200');
});

runCase('PromotionMath', 'Percentage discount float rounding: 15% on 235', () => {
  // 235 * 0.15 = 35.25 -> Math.floor should be 35
  const promo = { type: 'PERCENTAGE', value: 15, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 235, qty: 1 }], 235);
  assert.strictEqual(res.discountValue, 35, 'Should truncate/floor fractional satangs');
});

// 2.3 Fixed amount discounts exceeding spend
runCase('PromotionMath', 'Fixed amount discount exceeding spend: 500 discount on 300 spend', () => {
  const promo = { type: 'FIXED_AMOUNT', value: 500, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 300, qty: 1 }], 300);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 300, 'Discount must NOT exceed total spend (capped at 300)');
});

runCase('PromotionMath', 'Fixed amount discount exactly equal to spend: 300 discount on 300 spend', () => {
  const promo = { type: 'FIXED_AMOUNT', value: 300, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 300, qty: 1 }], 300);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 300);
});

runCase('PromotionMath', 'Fixed amount discount below spend: 100 discount on 300 spend', () => {
  const promo = { type: 'FIXED_AMOUNT', value: 100, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 300, qty: 1 }], 300);
  assert.strictEqual(res.isApplicable, true);
  assert.strictEqual(res.discountValue, 100);
});

// 2.4 Customer type filtering ('ALL' vs 'RETAIL' vs 'WHOLESALE')
runCase('PromotionMath', 'Customer type ALL allows RETAIL', () => {
  const promo = { customerType: 'ALL', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'RETAIL');
  assert.strictEqual(res.isApplicable, true);
});

runCase('PromotionMath', 'Customer type ALL allows WHOLESALE', () => {
  const promo = { customerType: 'ALL', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'WHOLESALE');
  assert.strictEqual(res.isApplicable, true);
});

runCase('PromotionMath', 'Customer type RETAIL blocks WHOLESALE', () => {
  const promo = { customerType: 'RETAIL', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'WHOLESALE');
  assert.strictEqual(res.isApplicable, false);
});

runCase('PromotionMath', 'Customer type WHOLESALE blocks RETAIL', () => {
  const promo = { customerType: 'WHOLESALE', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'RETAIL');
  assert.strictEqual(res.isApplicable, false);
});

runCase('PromotionMath', 'Customer type case-insensitivity: lowercase "all" in promo config', () => {
  const promo = { customerType: 'all', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'RETAIL');
  console.log(`     [Detail] promo.customerType = 'all' result for RETAIL: isApplicable = ${res.isApplicable}`);
  // If line 58 is: `if (promo.customerType && promo.customerType !== 'ALL')`, 'all' !== 'ALL' is TRUE!
  // Then line 60 compares 'ALL' !== 'RETAIL' -> false!
  assert.strictEqual(res.isApplicable, true, 'Lowercase customerType: "all" should be valid for RETAIL');
});

runCase('PromotionMath', 'Customer type case-insensitivity: lowercase "retail" passed as customerType', () => {
  const promo = { customerType: 'RETAIL', isActive: true, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200, 'retail');
  assert.strictEqual(res.isApplicable, true, 'Lowercase user role "retail" should match promo "RETAIL"');
});

// 2.5 Date expiration boundaries
runCase('PromotionMath', 'Firestore Timestamp date within valid range', () => {
  const yesterday = new Date(Date.now() - 86400000);
  const tomorrow = new Date(Date.now() + 86400000);
  const promo = {
    isActive: true,
    startDate: { toDate: () => yesterday },
    endDate: { toDate: () => tomorrow },
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true);
});

runCase('PromotionMath', 'Firestore Timestamp expired promo (endDate in past)', () => {
  const twoDaysAgo = new Date(Date.now() - 172800000);
  const yesterday = new Date(Date.now() - 86400000);
  const promo = {
    isActive: true,
    startDate: { toDate: () => twoDaysAgo },
    endDate: { toDate: () => yesterday },
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false, 'Expired promo must not be applicable');
});

runCase('PromotionMath', 'String ISO date within range', () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const promo = {
    isActive: true,
    startDate: yesterday,
    endDate: tomorrow,
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true);
});

runCase('PromotionMath', 'String ISO date expired promo', () => {
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const promo = {
    isActive: true,
    startDate: twoDaysAgo,
    endDate: yesterday,
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false);
});

runCase('PromotionMath', 'Future promo (not yet started)', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const promo = {
    isActive: true,
    startDate: tomorrow,
    endDate: nextWeek,
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false, 'Future promo must not be applicable');
});

// 2.6 Quota limits
runCase('PromotionMath', 'Quota limit not reached: 5/10 used', () => {
  const promo = { isActive: true, quotaLimit: 10, quotaUsed: 5, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true);
});

runCase('PromotionMath', 'Quota limit reached exactly: 10/10 used', () => {
  const promo = { isActive: true, quotaLimit: 10, quotaUsed: 10, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false, 'Quota exhausted must block promotion');
});

runCase('PromotionMath', 'Quota limit exceeded: 12/10 used', () => {
  const promo = { isActive: true, quotaLimit: 10, quotaUsed: 12, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false);
});

runCase('PromotionMath', 'Quota limit undefined / 0: unlimited', () => {
  const promo = { isActive: true, quotaUsed: 9999, type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true, 'Without quotaLimit should be unlimited');
});

// 2.7 Freebie Evaluation Corner Cases
runCase('FreebieMath', 'evaluateFreebie matching SKU', () => {
  const freebie = { isActive: true, applicableSkus: ['KB001'], minQty: 1 };
  const res = evaluateFreebie(freebie, [{ sku: 'KB001', qty: 1, price: 100 }], 100);
  assert.strictEqual(res.isApplicable, true);
});

runCase('FreebieMath', 'evaluateFreebie non-matching SKU', () => {
  const freebie = { isActive: true, applicableSkus: ['KB001'], minQty: 1 };
  const res = evaluateFreebie(freebie, [{ sku: 'OTHER', qty: 1, price: 100 }], 100);
  assert.strictEqual(res.isApplicable, false);
});

runCase('FreebieMath', 'evaluateFreebie minSpend requirement', () => {
  const freebie = { isActive: true, minSpend: 1000 };
  const resFail = evaluateFreebie(freebie, [{ sku: 'A', qty: 1, price: 800 }], 800);
  assert.strictEqual(resFail.isApplicable, false);
  const resPass = evaluateFreebie(freebie, [{ sku: 'A', qty: 1, price: 1200 }], 1200);
  assert.strictEqual(resPass.isApplicable, true);
});

runCase('FreebieMath', 'evaluateFreebie customerType filtering with lowercase "all"', () => {
  const freebie = { customerType: 'all', isActive: true, minSpend: 0 };
  const res = evaluateFreebie(freebie, [{ sku: 'A', qty: 1, price: 100 }], 100, 'RETAIL');
  console.log(`     [Detail] freebie.customerType = 'all' result for RETAIL: isApplicable = ${res.isApplicable}`);
  assert.strictEqual(res.isApplicable, true, 'Lowercase customerType: "all" in freebie should be valid');
});

// 2.8 Cart with mixed eligible and non-eligible items (minSpend isolation)
runCase('PromotionMath', 'minSpend is calculated ONLY against eligible items, not whole cart', () => {
  const promo = {
    isActive: true,
    applicableSkus: ['KEYBOARD_1'],
    minSpend: 500,
    type: 'FIXED_AMOUNT',
    value: 50
  };
  // Cart has $2000 total, but only $300 of KEYBOARD_1
  const cart = [
    { sku: 'KEYBOARD_1', price: 300, qty: 1 },
    { sku: 'MONITOR_1', price: 1700, qty: 1 }
  ];
  const res = evaluatePromotion(promo, cart, 2000);
  assert.strictEqual(res.isApplicable, false, 'Should fail minSpend because eligible items only equal 300 < 500');
  assert.strictEqual(res.missingSpend, 200, 'Missing spend should be 200');
});

// 2.9 Negative promo value handling
runCase('PromotionMath', 'Negative percentage value: -10% on 500', () => {
  const promo = { type: 'PERCENTAGE', value: -10, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 500, qty: 1 }], 500);
  console.log(`     [Detail] negative percentage discountValue = ${res.discountValue}`);
  assert.strictEqual(res.discountValue <= 0, true, 'Negative promo produces non-positive discount');
});

runCase('PromotionMath', 'Negative fixed amount value: -50 on 500', () => {
  const promo = { type: 'FIXED_AMOUNT', value: -50, isActive: true };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 500, qty: 1 }], 500);
  console.log(`     [Detail] negative fixed discountValue = ${res.discountValue}`);
  assert.strictEqual(res.discountValue <= 0, true, 'Negative fixed value produces negative discount');
});

// 2.10 String coercion for quotaLimit and quotaUsed
runCase('PromotionMath', 'String quota comparison: quotaLimit = "10", quotaUsed = "10"', () => {
  const promo = { isActive: true, quotaLimit: "10", quotaUsed: "10", type: 'FIXED_AMOUNT', value: 50 };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, false, 'String "10" >= "10" should evaluate as reached');
});

// 2.11 Exact Date Boundary Matching
runCase('PromotionMath', 'Exact Date Boundary: now === start', () => {
  const now = new Date();
  const promo = {
    isActive: true,
    startDate: now,
    endDate: new Date(now.getTime() + 100000),
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true, 'now === start should be applicable');
});

runCase('PromotionMath', 'Exact Date Boundary: now === end', () => {
  const now = new Date();
  const promo = {
    isActive: true,
    startDate: new Date(now.getTime() - 100000),
    endDate: now,
    type: 'FIXED_AMOUNT',
    value: 50
  };
  const res = evaluatePromotion(promo, [{ sku: 'A', price: 200, qty: 1 }], 200);
  assert.strictEqual(res.isApplicable, true, 'now === end should still be applicable');
});

// 2.12 Thai and text strings in StockParser
runCase('StockParser', 'Text stock "มีสินค้า" with inStock: true', () => {
  const s = parseStock({ stock: "มีสินค้า", inStock: true });
  console.log(`     [Detail] { stock: "มีสินค้า", inStock: true } parses to: ${s}`);
  // Notice: rawStock is "มีสินค้า", parsed is Number("") which is 0, so inStock: true fallback is shadowed!
  assert.strictEqual(s, 1, 'Text stock string like "มีสินค้า" should fall back to inStock: true');
});

console.log('\n================================================================');
console.log(`  Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================');

if (findings.length > 0) {
  console.log('\n🚨 FINDINGS / FAILURES:');
  findings.forEach((f, i) => {
    console.log(`  ${i+1}. [${f.category}] ${f.name} -> ${f.error}`);
  });
}
