/**
 * Verification Test Suite: Buffer Stock Hierarchy & Availability Engine
 * 
 * Tests the 6 core business rules and edge cases:
 * Case 1: Unset SKU buffer (null/empty) falls back to Global Buffer (never null/0 bypass)
 * Case 2: Intentional 0 buffer override is preserved (never forced to 2)
 * Case 3: Specific SKU override takes precedence over Global Buffer
 * Case 4: Storefront & Cart block sale when stock is within buffer zone
 * Case 5: Global buffer = 0 allows complete sell-out when no SKU override
 * Case 6: User with canBypassBuffer permission can transact into buffer zone
 * Case 7: BigSeller export correctly respects SKU overrides and available stock
 * 
 * Location: Management System/tests/adversarial/verify_buffer_hierarchy.test.mjs
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARED_PATH = path.resolve(__dirname, '../../dh-shared/src/utils/stockUtils.js');

// Dynamically import the centralized stockUtils engine
const {
  resolveEffectiveBuffer,
  calculateAvailableStock,
  isStockAvailableForSale,
  isProductOutOfStock,
  isProductLowStock
} = await import(`file://${SHARED_PATH}`);

console.log('================================================================');
console.log('  🛡️ VERIFICATION TEST: Stock Buffer Hierarchy & Availability Engine');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------------------------

// Case 1: Null buffer bypass prevention
runTest('Case 1: SKU buffer = null / empty falls back to global buffer (prevents null bypass bug)', () => {
  const globalBuffer = 3;
  
  assert.equal(resolveEffectiveBuffer(null, globalBuffer), 3, 'null must resolve to globalBuffer');
  assert.equal(resolveEffectiveBuffer(undefined, globalBuffer), 3, 'undefined must resolve to globalBuffer');
  assert.equal(resolveEffectiveBuffer('', globalBuffer), 3, 'empty string must resolve to globalBuffer');
  assert.equal(resolveEffectiveBuffer('   ', globalBuffer), 3, 'whitespace string must resolve to globalBuffer');

  // Verify that with stock = 3, globalBuffer = 3, buying 1 is BLOCKED
  const effectiveBuffer = resolveEffectiveBuffer(null, globalBuffer);
  assert.equal(isStockAvailableForSale(3, effectiveBuffer, 1), false, 'Must not allow buying into global buffer');
});

// Case 2: Intentional zero buffer
runTest('Case 2: SKU buffer = 0 is preserved (never forced to 2 by falsy || 2)', () => {
  const globalBuffer = 5;
  
  assert.equal(resolveEffectiveBuffer(0, globalBuffer), 0, 'Numeric 0 must be respected');
  assert.equal(resolveEffectiveBuffer('0', globalBuffer), 0, 'String "0" must be respected');
  
  // Can sell all 5 items down to 0
  const effectiveBuffer = resolveEffectiveBuffer(0, globalBuffer);
  assert.equal(isStockAvailableForSale(5, effectiveBuffer, 5), true, 'Stock = 5, Buffer = 0 allows buying 5');
  assert.equal(isStockAvailableForSale(5, effectiveBuffer, 6), false, 'Stock = 5 cannot buy 6');
});

// Case 3: SKU override priority
runTest('Case 3: SKU override takes priority over Global Buffer', () => {
  assert.equal(resolveEffectiveBuffer(10, 2), 10, 'SKU buffer 10 overrides global 2');
  assert.equal(resolveEffectiveBuffer(1, 5), 1, 'SKU buffer 1 overrides global 5');
  assert.equal(resolveEffectiveBuffer('7', 2), 7, 'String SKU buffer overrides global');
});

// Case 4: Storefront & Cart Out of Stock detection
runTest('Case 4: Stock within buffer is marked Out of Stock and blocked from cart', () => {
  const stock = 2;
  const buffer = 2;
  
  assert.equal(calculateAvailableStock(stock, buffer), 0, 'Available stock should be 0');
  assert.equal(isProductOutOfStock(stock, buffer), true, 'Product should be marked out of stock');
  assert.equal(isProductLowStock(stock, buffer), false, 'Product is out of stock, not low stock');
  assert.equal(isStockAvailableForSale(stock, buffer, 1), false, 'Cannot add to cart / purchase');

  // When stock is 3 (1 available), it is low stock
  assert.equal(calculateAvailableStock(3, buffer), 1, 'Stock 3 has 1 available');
  assert.equal(isProductOutOfStock(3, buffer), false, 'Stock 3 is not out of stock');
  assert.equal(isProductLowStock(3, buffer), true, 'Stock 3 is low stock');
  assert.equal(isStockAvailableForSale(3, buffer, 1), true, 'Stock 3 allows purchasing 1');
  assert.equal(isStockAvailableForSale(3, buffer, 2), false, 'Stock 3 blocks purchasing 2');
});

// Case 5: Global buffer = 0 allows sell-out
runTest('Case 5: Global buffer = 0 allows complete sell-out when no SKU override', () => {
  const effectiveBuffer = resolveEffectiveBuffer(null, 0);
  assert.equal(effectiveBuffer, 0, 'Global buffer 0 respected for empty SKU');
  
  assert.equal(isProductOutOfStock(1, effectiveBuffer), false, '1 item is available');
  assert.equal(isStockAvailableForSale(1, effectiveBuffer, 1), true, 'Allows purchasing the last item');
  assert.equal(isProductOutOfStock(0, effectiveBuffer), true, '0 items is out of stock');
});

// Case 6: RBAC bypass permission
runTest('Case 6: canBypassBuffer permission allows purchasing reserved buffer stock', () => {
  const stock = 2;
  const buffer = 2;
  
  // Normal customer: blocked
  assert.equal(isStockAvailableForSale(stock, buffer, 2, false), false, 'Normal customer blocked by buffer');
  
  // Manager / POS with bypass: allowed
  assert.equal(isStockAvailableForSale(stock, buffer, 2, true), true, 'Actor with bypass allowed to sell buffer stock');
  assert.equal(isStockAvailableForSale(stock, buffer, 3, true), false, 'Cannot sell more than physical stock even with bypass');
});

// Case 7: BigSeller export dataset accuracy
runTest('Case 7: BigSeller catalog export calculates countStock with SKU and Global buffer', () => {
  const products = [
    { sku: 'SKU-DEFAULT', stockQuantity: 10, bufferStock: null },
    { sku: 'SKU-OVERRIDE', stockQuantity: 10, bufferStock: 5 },
    { sku: 'SKU-ZERO', stockQuantity: 10, bufferStock: 0 }
  ];
  
  const globalBuffer = 2;
  
  const exported = products.map(item => {
    const effectiveBuffer = resolveEffectiveBuffer(item.bufferStock, globalBuffer);
    const countStock = calculateAvailableStock(item.stockQuantity, effectiveBuffer);
    return { sku: item.sku, countStock, effectiveBuffer };
  });

  // SKU-DEFAULT: 10 - 2 = 8
  assert.equal(exported[0].effectiveBuffer, 2);
  assert.equal(exported[0].countStock, 8);

  // SKU-OVERRIDE: 10 - 5 = 5
  assert.equal(exported[1].effectiveBuffer, 5);
  assert.equal(exported[1].countStock, 5);

  // SKU-ZERO: 10 - 0 = 10
  assert.equal(exported[2].effectiveBuffer, 0);
  assert.equal(exported[2].countStock, 10);
});

console.log('\n================================================================');
console.log(`  🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} tests verified successfully!`);
console.log('================================================================\n');
