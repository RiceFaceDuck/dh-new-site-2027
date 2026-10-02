/**
 * Adversarial Stress & Boundary Challenge Suite: Buffer Stock Hierarchy & Availability Engine
 * 
 * Target: dh-shared/src/utils/stockUtils.js and cross-system buffer hierarchy
 * Location: Management System/tests/adversarial/challenger_buffer_hierarchy_stress.mjs
 * 
 * Scope:
 * 1. Extreme boundary matrix for SKU buffer (null, undefined, "", 0, -5, "10", NaN, floats, objects)
 * 2. Extreme boundary matrix for Global buffer (null, undefined, "", 0, -3, "5", NaN, floats)
 * 3. Extreme boundary matrix for Physical stock (0, negative, large integer, float, NaN)
 * 4. Buffer > Physical stock clamping verification (never negative available stock)
 * 5. SKU override = 0 explicitly when Global buffer = 10 (precedence verification)
 * 6. High-volume stress harness (100,000 iterations fuzzing)
 * 7. Verification of export signatures and aliases
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARED_PATH = path.resolve(__dirname, '../../dh-shared/src/utils/stockUtils.js');

const stockUtils = await import(`file://${SHARED_PATH}`);
const {
  resolveEffectiveBuffer,
  calculateAvailableStock,
  isStockAvailableForSale,
  isProductOutOfStock,
  isProductLowStock
} = stockUtils;

console.log('========================================================================');
console.log('  ⚔️ ADVERSARIAL CHALLENGER: Buffer Stock Hierarchy & Boundary Stress');
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runChallenge(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Challenge 1: Export Signatures & Function Identity Audit
// -----------------------------------------------------------------------------
runChallenge('Challenge 1: Function Signatures & Named Exports Audit', () => {
  assert.equal(typeof resolveEffectiveBuffer, 'function', 'resolveEffectiveBuffer must be exported');
  assert.equal(typeof calculateAvailableStock, 'function', 'calculateAvailableStock must be exported');
  assert.equal(typeof isStockAvailableForSale, 'function', 'isStockAvailableForSale must be exported');
  assert.equal(typeof isProductOutOfStock, 'function', 'isProductOutOfStock must be exported');
  assert.equal(typeof isProductLowStock, 'function', 'isProductLowStock must be exported');

  // Check alias compatibility check
  const hasComputeAvailable = typeof stockUtils.computeAvailableStock === 'function';
  const hasGetEffectiveBuffer = typeof stockUtils.getEffectiveBufferStock === 'function';
  console.log(`     ℹ️ Alias audit: computeAvailableStock=${hasComputeAvailable}, getEffectiveBufferStock=${hasGetEffectiveBuffer}`);
  console.log(`     ℹ️ Canonical API in codebase: resolveEffectiveBuffer + calculateAvailableStock`);
});

// -----------------------------------------------------------------------------
// Challenge 2: SKU Override = 0 vs Global Buffer Precedence (Crucial Requirement)
// -----------------------------------------------------------------------------
runChallenge('Challenge 2: SKU override = 0 explicitly when Global buffer = 10 (Zero Precedence)', () => {
  const globalBuffer = 10;

  // Numeric 0 must take precedence over global buffer
  const bufferNumeric0 = resolveEffectiveBuffer(0, globalBuffer);
  assert.equal(bufferNumeric0, 0, 'Numeric 0 SKU buffer MUST resolve to 0, not fall back to global 10');

  // String "0" must take precedence over global buffer
  const bufferString0 = resolveEffectiveBuffer('0', globalBuffer);
  assert.equal(bufferString0, 0, 'String "0" SKU buffer MUST resolve to 0, not fall back to global 10');

  // Trimmable string " 0 " must also resolve to 0
  const bufferTrim0 = resolveEffectiveBuffer(' 0 ', globalBuffer);
  assert.equal(bufferTrim0, 0, 'Trimmed " 0 " SKU buffer MUST resolve to 0');

  // Verify availability with physical stock = 5, global = 10, sku = 0
  // Without SKU override (global 10), available would be max(0, 5 - 10) = 0 (out of stock).
  // WITH SKU override = 0, available must be max(0, 5 - 0) = 5 (fully sellable).
  const availableStock = calculateAvailableStock(5, bufferNumeric0);
  assert.equal(availableStock, 5, 'Physical 5 with SKU buffer 0 must have availableStock = 5');
  assert.equal(isProductOutOfStock(5, bufferNumeric0), false, 'Product with physical 5 and buffer 0 is NOT out of stock');
  assert.equal(isStockAvailableForSale(5, bufferNumeric0, 5), true, 'Customer can buy all 5 items when buffer is 0');
  assert.equal(isStockAvailableForSale(5, bufferNumeric0, 6), false, 'Customer cannot buy 6 items when physical is 5');
});

// -----------------------------------------------------------------------------
// Challenge 3: Extreme Boundary Conditions for SKU Buffer
// -----------------------------------------------------------------------------
runChallenge('Challenge 3: SKU buffer extreme boundary inputs with valid global buffer (10)', () => {
  const globalBuffer = 10;

  // 1. null -> falls back to global 10
  assert.equal(resolveEffectiveBuffer(null, globalBuffer), 10, 'null SKU buffer must fall back to global');

  // 2. undefined -> falls back to global 10
  assert.equal(resolveEffectiveBuffer(undefined, globalBuffer), 10, 'undefined SKU buffer must fall back to global');

  // 3. empty string "" -> falls back to global 10
  assert.equal(resolveEffectiveBuffer('', globalBuffer), 10, 'empty string SKU buffer must fall back to global');

  // 4. whitespace string "   " -> falls back to global 10
  assert.equal(resolveEffectiveBuffer('   ', globalBuffer), 10, 'whitespace string SKU buffer must fall back to global');

  // 5. negative number -5 -> clamped to 0 (per design spec)
  assert.equal(resolveEffectiveBuffer(-5, globalBuffer), 0, 'negative number -5 must be clamped to 0');

  // 6. negative string "-5" -> clamped to 0
  assert.equal(resolveEffectiveBuffer('-5', globalBuffer), 0, 'negative string "-5" must be clamped to 0');

  // 7. numeric string "10" -> parsed as 10
  assert.equal(resolveEffectiveBuffer('10', globalBuffer), 10, 'numeric string "10" must be parsed as 10');

  // 8. NaN -> falls back to global 10
  assert.equal(resolveEffectiveBuffer(NaN, globalBuffer), 10, 'NaN SKU buffer must fall back to global');

  // 9. string "NaN" / "invalid" -> falls back to global 10
  assert.equal(resolveEffectiveBuffer('NaN', globalBuffer), 10, '"NaN" string must fall back to global');
  assert.equal(resolveEffectiveBuffer('invalid', globalBuffer), 10, '"invalid" string must fall back to global');

  // 10. float 7.9 -> floored to 7
  assert.equal(resolveEffectiveBuffer(7.9, globalBuffer), 7, 'float 7.9 must be floored to 7');
});

// -----------------------------------------------------------------------------
// Challenge 4: Extreme Boundary Conditions for Global Buffer
// -----------------------------------------------------------------------------
runChallenge('Challenge 4: Global buffer extreme boundary inputs with null SKU buffer', () => {
  const skuBuffer = null; // Forces fallback to globalBuffer

  // 1. Global = null -> falls back to defaultFallback (2)
  assert.equal(resolveEffectiveBuffer(skuBuffer, null), 2, 'null global buffer must fall back to default (2)');

  // 2. Global = undefined -> falls back to defaultFallback (2)
  assert.equal(resolveEffectiveBuffer(skuBuffer, undefined), 2, 'undefined global buffer must fall back to default (2)');

  // 3. Global = "" -> falls back to defaultFallback (2)
  assert.equal(resolveEffectiveBuffer(skuBuffer, ''), 2, 'empty string global buffer must fall back to default (2)');

  // 4. Global = "   " -> falls back to defaultFallback (2)
  assert.equal(resolveEffectiveBuffer(skuBuffer, '   '), 2, 'whitespace global buffer must fall back to default (2)');

  // 5. Global = 0 -> respected as 0 (does NOT fall back to 2!)
  assert.equal(resolveEffectiveBuffer(skuBuffer, 0), 0, 'global buffer 0 must be respected and not fall back to 2');
  assert.equal(resolveEffectiveBuffer(skuBuffer, '0'), 0, 'global buffer "0" must be respected and not fall back to 2');

  // 6. Global = -3 -> clamped to 0
  assert.equal(resolveEffectiveBuffer(skuBuffer, -3), 0, 'negative global buffer -3 must be clamped to 0');
  assert.equal(resolveEffectiveBuffer(skuBuffer, '-3'), 0, 'negative global buffer "-3" must be clamped to 0');

  // 7. Global = "5" -> parsed as 5
  assert.equal(resolveEffectiveBuffer(skuBuffer, '5'), 5, 'numeric string "5" global buffer must be parsed as 5');

  // 8. Global = NaN -> falls back to defaultFallback (2)
  assert.equal(resolveEffectiveBuffer(skuBuffer, NaN), 2, 'NaN global buffer must fall back to default (2)');
  assert.equal(resolveEffectiveBuffer(skuBuffer, 'abc'), 2, 'invalid global buffer must fall back to default (2)');

  // 9. Custom defaultFallback
  assert.equal(resolveEffectiveBuffer(skuBuffer, null, 4), 4, 'custom default fallback 4 must be honored');
  assert.equal(resolveEffectiveBuffer(skuBuffer, null, 0), 0, 'custom default fallback 0 must be honored');
  assert.equal(resolveEffectiveBuffer(skuBuffer, null, -1), 0, 'custom negative default fallback must be clamped to 0');
  assert.equal(resolveEffectiveBuffer(skuBuffer, null, 'invalid'), 2, 'invalid default fallback must default to 2');
});

// -----------------------------------------------------------------------------
// Challenge 5: Extreme Boundary Conditions for Physical Stock & Clamping
// -----------------------------------------------------------------------------
runChallenge('Challenge 5: Physical stock extreme boundary inputs & clamping invariants', () => {
  // Invariant: Available stock MUST NEVER be negative! Math.max(0, stock - buffer)

  // 1. Buffer stock > Physical stock (must clamp to 0)
  assert.equal(calculateAvailableStock(5, 10), 0, 'stock 5, buffer 10 -> available 0');
  assert.equal(calculateAvailableStock(0, 5), 0, 'stock 0, buffer 5 -> available 0');
  assert.equal(calculateAvailableStock(1, 2), 0, 'stock 1, buffer 2 -> available 0');
  assert.equal(calculateAvailableStock(99, 100), 0, 'stock 99, buffer 100 -> available 0');

  // 2. Physical stock = 0
  assert.equal(calculateAvailableStock(0, 0), 0, 'stock 0, buffer 0 -> available 0');
  assert.equal(calculateAvailableStock(0, 2), 0, 'stock 0, buffer 2 -> available 0');

  // 3. Physical stock is negative (e.g. oversold or data glitch)
  assert.equal(calculateAvailableStock(-1, 0), 0, 'stock -1, buffer 0 -> available 0 (clamped)');
  assert.equal(calculateAvailableStock(-10, 5), 0, 'stock -10, buffer 5 -> available 0 (clamped)');
  assert.equal(calculateAvailableStock(-5, -2), 0, 'stock -5, buffer -2 -> available 0 (clamped)');

  // 4. Large integers
  assert.equal(calculateAvailableStock(1_000_000, 10), 999_990, '1M stock minus 10 buffer');
  assert.equal(calculateAvailableStock(Number.MAX_SAFE_INTEGER, 100), Number.MAX_SAFE_INTEGER - 100);

  // 5. Floating point stock
  assert.equal(calculateAvailableStock(5.5, 2), 3.5, 'stock 5.5, buffer 2 -> available 3.5');
  assert.equal(calculateAvailableStock(1.5, 2), 0, 'stock 1.5, buffer 2 -> available 0 (clamped)');

  // 6. Non-numeric / null / undefined stock
  assert.equal(calculateAvailableStock(null, 2), 0, 'null stock treated as 0 -> available 0');
  assert.equal(calculateAvailableStock(undefined, 2), 0, 'undefined stock treated as 0 -> available 0');
  assert.equal(calculateAvailableStock('20', 5), 15, 'string "20" stock minus 5 buffer -> available 15');
  assert.equal(calculateAvailableStock(NaN, 2), 0, 'NaN stock treated as 0 -> available 0');
  assert.equal(calculateAvailableStock('abc', 2), 0, 'invalid stock treated as 0 -> available 0');
});

// -----------------------------------------------------------------------------
// Challenge 6: Out of Stock & Low Stock Predicates Adversarial Testing
// -----------------------------------------------------------------------------
runChallenge('Challenge 6: isProductOutOfStock & isProductLowStock edge-case boundaries', () => {
  const buffer = 3;

  // When physical = 3, buffer = 3:
  // available = 0 -> OutOfStock = true, LowStock = false (must NOT show as low stock if 0 available!)
  assert.equal(isProductOutOfStock(3, buffer), true, 'Stock 3, Buffer 3 is out of stock');
  assert.equal(isProductLowStock(3, buffer), false, 'Stock 3, Buffer 3 is NOT low stock (it is 0 available)');

  // When physical = 2, buffer = 3:
  assert.equal(isProductOutOfStock(2, buffer), true, 'Stock 2, Buffer 3 is out of stock');
  assert.equal(isProductLowStock(2, buffer), false, 'Stock 2, Buffer 3 is NOT low stock');

  // When physical = 4, buffer = 3:
  // available = 1 -> OutOfStock = false, LowStock = true (available 1 <= threshold 2)
  assert.equal(isProductOutOfStock(4, buffer), false, 'Stock 4, Buffer 3 is not out of stock');
  assert.equal(isProductLowStock(4, buffer, 2), true, 'Stock 4, Buffer 3 (available 1) is low stock');

  // When physical = 5, buffer = 3:
  // available = 2 -> OutOfStock = false, LowStock = true (available 2 <= threshold 2)
  assert.equal(isProductOutOfStock(5, buffer), false, 'Stock 5, Buffer 3 is not out of stock');
  assert.equal(isProductLowStock(5, buffer, 2), true, 'Stock 5, Buffer 3 (available 2) is low stock');

  // When physical = 6, buffer = 3:
  // available = 3 -> OutOfStock = false, LowStock = false (available 3 > threshold 2)
  assert.equal(isProductOutOfStock(6, buffer), false, 'Stock 6, Buffer 3 is not out of stock');
  assert.equal(isProductLowStock(6, buffer, 2), false, 'Stock 6, Buffer 3 (available 3) is healthy stock');

  // When physical = 0, buffer = 0:
  assert.equal(isProductOutOfStock(0, 0), true, 'Stock 0, Buffer 0 is out of stock');
  assert.equal(isProductLowStock(0, 0), false, 'Stock 0, Buffer 0 is NOT low stock');
});

// -----------------------------------------------------------------------------
// Challenge 7: isStockAvailableForSale Adversarial Purchasing Scenarios
// -----------------------------------------------------------------------------
runChallenge('Challenge 7: isStockAvailableForSale purchasing permissions and edge cases', () => {
  const buffer = 5;

  // Case A: Exact threshold purchase
  // stock = 10, buffer = 5: can buy up to 5
  assert.equal(isStockAvailableForSale(10, buffer, 5), true, 'Stock 10, buffer 5, buy 5 -> remaining 5 >= 5 (OK)');
  assert.equal(isStockAvailableForSale(10, buffer, 6), false, 'Stock 10, buffer 5, buy 6 -> remaining 4 < 5 (BLOCKED)');

  // Case B: Boundary at stock = buffer
  // stock = 5, buffer = 5: buying 1 must be blocked
  assert.equal(isStockAvailableForSale(5, buffer, 1), false, 'Stock 5, buffer 5, buy 1 -> remaining 4 < 5 (BLOCKED)');

  // Case C: canBypassBuffer = true (Manager / POS / Claims)
  assert.equal(isStockAvailableForSale(5, buffer, 1, true), true, 'Bypass allowed: buy 1 leaves 4 >= 0 (OK)');
  assert.equal(isStockAvailableForSale(5, buffer, 5, true), true, 'Bypass allowed: buy 5 leaves 0 >= 0 (OK)');
  assert.equal(isStockAvailableForSale(5, buffer, 6, true), false, 'Bypass allowed: buy 6 leaves -1 < 0 (BLOCKED - cannot sell more than physical!)');

  // Case D: Zero or negative requested quantity
  // If requestedQty = 0 or negative, Number(requestedQty) || 1 falls back to 1
  assert.equal(isStockAvailableForSale(10, buffer, 0), true, 'requestedQty = 0 falls back to 1 (remaining 9 >= 5)');
  assert.equal(isStockAvailableForSale(10, buffer, null), true, 'requestedQty = null falls back to 1');
  assert.equal(isStockAvailableForSale(5, buffer, 0), false, 'requestedQty = 0 falls back to 1 -> remaining 4 < 5 (BLOCKED)');
});

// -----------------------------------------------------------------------------
// Challenge 8: Full Combinatorial Boundary Matrix (Cross-Product Fuzzing)
// -----------------------------------------------------------------------------
runChallenge('Challenge 8: Exhaustive Combinatorial Cross-Product (13 x 11 matrix)', () => {
  const skuValues = [null, undefined, '', '   ', 0, '0', -5, '-5', 10, '10', NaN, 'NaN', 'invalid'];
  const globalValues = [null, undefined, '', '   ', 0, '0', -3, '-3', 5, '5', NaN];

  for (const sku of skuValues) {
    for (const glob of globalValues) {
      const res = resolveEffectiveBuffer(sku, glob);
      
      // Strict Invariants:
      assert(typeof res === 'number', `Result must always be a number for sku=${sku}, glob=${glob}`);
      assert(!Number.isNaN(res), `Result must never be NaN for sku=${sku}, glob=${glob}`);
      assert(res >= 0, `Result must never be negative for sku=${sku}, glob=${glob}`);
      assert(Number.isInteger(res), `Result must always be an integer for sku=${sku}, glob=${glob}`);

      // If SKU is 0 or '0', result MUST be 0
      if (sku === 0 || sku === '0') {
        assert.equal(res, 0, `SKU override 0 MUST be 0 regardless of global=${glob}`);
      }
      
      // If SKU is positive number, result MUST be that number
      if (sku === 10 || sku === '10') {
        assert.equal(res, 10, `SKU override 10 MUST be 10 regardless of global=${glob}`);
      }
    }
  }
});

// -----------------------------------------------------------------------------
// Challenge 9: High-Volume Fuzzing & Performance Stress Harness (100,000 iterations)
// -----------------------------------------------------------------------------
runChallenge('Challenge 9: High-Volume Fuzzing (100,000 iterations random inputs)', () => {
  const startTime = Date.now();
  const iterations = 100_000;
  
  const sampleInputs = [
    null, undefined, '', ' ', 0, '0', -100, -1, 1, 2, 5, 10, 100, 1000,
    '5', '10', '0', '-5', NaN, 'invalid', 1.5, 9.99, Number.MAX_SAFE_INTEGER
  ];

  let calculatedCount = 0;

  for (let i = 0; i < iterations; i++) {
    const sku = sampleInputs[Math.floor(Math.random() * sampleInputs.length)];
    const glob = sampleInputs[Math.floor(Math.random() * sampleInputs.length)];
    const stock = sampleInputs[Math.floor(Math.random() * sampleInputs.length)];

    const buffer = resolveEffectiveBuffer(sku, glob);
    const available = calculateAvailableStock(stock, buffer);
    const outOfStock = isProductOutOfStock(stock, buffer);
    const lowStock = isProductLowStock(stock, buffer);

    // Invariants check on every single fuzz iteration:
    assert(available >= 0, `Available stock must never be negative: stock=${stock}, buffer=${buffer}`);
    assert(!Number.isNaN(available), `Available stock must not be NaN: stock=${stock}, buffer=${buffer}`);
    assert(typeof outOfStock === 'boolean', 'outOfStock must be boolean');
    assert(typeof lowStock === 'boolean', 'lowStock must be boolean');

    // Mutually exclusive rule: If outOfStock is true, lowStock cannot be true!
    if (outOfStock) {
      assert.equal(lowStock, false, `Conflict: Item cannot be both OutOfStock and LowStock (available=${available})`);
    }

    calculatedCount++;
  }

  const durationMs = Date.now() - startTime;
  console.log(`     ⚡ Performance: ${calculatedCount.toLocaleString()} fuzz iterations completed in ${durationMs}ms (${Math.round(calculatedCount / (durationMs || 1))} ops/ms)`);
  assert(durationMs < 2000, `Stress harness took too long: ${durationMs}ms`);
});

console.log('\n========================================================================');
console.log(`  🎉 ALL ADVERSARIAL CHALLENGES PASSED: ${passedTests}/${totalTests} tests verified!`);
console.log('========================================================================\n');
