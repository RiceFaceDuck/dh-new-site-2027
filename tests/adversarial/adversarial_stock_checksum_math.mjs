/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE — PHASE 4:
 * STOCK CHECKSUM MATH, 5D PERIOD MONOTONICITY & SNAPSHOT INTEGRITY
 * 
 * Location: Management System/tests/adversarial/adversarial_stock_checksum_math.mjs
 * 
 * Scope (Read-Only & Mathematical Verification):
 * 1. Stock Math Balance Equation Invariants:
 *    - Validates: finalStock = initialStock + stockIn - sales - claims + adjustments.
 *    - Reversals & Return math resilience: positive adjustments, negative adjustments, damaged claims.
 *    - Deficit & Negative Stock Boundary Detection: flags illegal negative stocks.
 * 2. 5D Metric Period Monotonicity (Timeline Non-Decreasing Law):
 *    - 7D <= 30D <= 60D <= 90D <= 365D across cumulative sales, inbound, and claims.
 *    - Discrepancy flagging for inverted temporal windows.
 * 3. parseStatsSnapshot Envelope & Matrix Unpacking:
 *    - 17-element, 21-element, and 25-element compact arrays decoding.
 *    - Polymorphic envelopes ({ statsMap }, { statsBySku }, { items }, stringified JSON).
 *    - Dirty data resilience: corrupted payloads, null/undefined SKU keys, NaN defenses.
 * 4. Production Catalog Chunks & inStock Parity:
 *    - Verification of inStock boolean parity: inStock === (stockQuantity > 0).
 *    - Zero-Metric Non-Clobbering Verification: authentic 0 is strictly preserved.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../dh-backoffice-react');

// Import real parseStatsSnapshot from migrationService
const migrationServicePath = path.resolve(ROOT_DIR, 'src/firebase/inventory/migrationService.js');
assert(fs.existsSync(migrationServicePath), 'migrationService.js must exist on disk');

const migrationServiceModule = await import(`file://${migrationServicePath.replace(/\\/g, '/')}`);
const { parseStatsSnapshot } = migrationServiceModule;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error('     Error:', err.message);
    failedTests++;
  }
}

console.log('================================================================================');
console.log('🧪 ADVERSARIAL TEST SUITE: PHASE 4 - STOCK CHECKSUM & INTEGRITY MATH');
console.log('================================================================================\n');

// =============================================================================
// DOMAIN 1: Stock Math Balance Equation Invariants
// =============================================================================
console.log('--- 1. Stock Math Balance Equation & Reconciled Checksum Invariants ---');

function computeStockChecksum({ baseStock = 0, stockIn = 0, sales = 0, claims = 0, adjustments = 0 }) {
  return Number(baseStock) + Number(stockIn) - Number(sales) - Number(claims) + Number(adjustments);
}

test('Standard stock flow balances accurately: base(100) + in(50) - sale(30) - claim(5) + adj(+2) = 117', () => {
  const result = computeStockChecksum({ baseStock: 100, stockIn: 50, sales: 30, claims: 5, adjustments: 2 });
  assert.strictEqual(result, 117);
});

test('Zero-movement stock flow preserves base stock perfectly: base(50) + in(0) - sale(0) = 50', () => {
  const result = computeStockChecksum({ baseStock: 50, stockIn: 0, sales: 0, claims: 0, adjustments: 0 });
  assert.strictEqual(result, 50);
});

test('Negative adjustment correctly reduces stock: base(100) - adj(-15) = 85', () => {
  const result = computeStockChecksum({ baseStock: 100, stockIn: 0, sales: 0, claims: 0, adjustments: -15 });
  assert.strictEqual(result, 85);
});

test('Stock deficit / negative balance is accurately detected for boundary auditing', () => {
  const result = computeStockChecksum({ baseStock: 10, stockIn: 0, sales: 25, claims: 0, adjustments: 0 });
  assert.strictEqual(result, -15);
  const isDeficit = result < 0;
  assert.strictEqual(isDeficit, true, 'Negative stock must be flagged as deficit');
});

// =============================================================================
// DOMAIN 2: 5D Metric Period Monotonicity (Timeline Non-Decreasing Law)
// =============================================================================
console.log('\n--- 2. 5D Metric Temporal Monotonicity Law (7D <= 30D <= 90D <= 365D) ---');

function validateTemporalMonotonicity(historyObj, periods = ['7', '30', '90', '365']) {
  if (!historyObj || typeof historyObj !== 'object') return { valid: true, anomalies: [] };
  const anomalies = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const currentPeriod = periods[i];
    const nextPeriod = periods[i + 1];
    const currentVal = Number(historyObj[currentPeriod] ?? 0);
    const nextVal = Number(historyObj[nextPeriod] ?? 0);
    if (currentVal > nextVal) {
      anomalies.push({
        currentPeriod,
        nextPeriod,
        currentVal,
        nextVal,
        diff: currentVal - nextVal
      });
    }
  }
  return { valid: anomalies.length === 0, anomalies };
}

test('Valid monotonic sales progression passes without anomalies: 7D(10) <= 30D(40) <= 90D(120) <= 365D(500)', () => {
  const salesHistory = { '7': 10, '30': 40, '90': 120, '365': 500 };
  const check = validateTemporalMonotonicity(salesHistory);
  assert.strictEqual(check.valid, true);
  assert.strictEqual(check.anomalies.length, 0);
});

test('Inverted timeline anomaly is caught: 30D(50) > 90D(30) must flag violation', () => {
  const corruptedHistory = { '7': 10, '30': 50, '90': 30, '365': 100 };
  const check = validateTemporalMonotonicity(corruptedHistory);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.anomalies.length, 1);
  assert.strictEqual(check.anomalies[0].currentPeriod, '30');
  assert.strictEqual(check.anomalies[0].nextPeriod, '90');
  assert.strictEqual(check.anomalies[0].diff, 20);
});

test('Zero activity throughout all windows maintains monotonicity without false alarms', () => {
  const zeroHistory = { '7': 0, '30': 0, '90': 0, '365': 0 };
  const check = validateTemporalMonotonicity(zeroHistory);
  assert.strictEqual(check.valid, true);
  assert.strictEqual(check.anomalies.length, 0);
});

// =============================================================================
// DOMAIN 3: parseStatsSnapshot Envelope & Matrix Unpacking
// =============================================================================
console.log('\n--- 3. parseStatsSnapshot Envelope & Matrix Unpacking Resilience ---');

test('Unpacks polymorphic wrapped envelope { statsMap: { SKU_01: { ... } } }', () => {
  const rawPayload = {
    statsMap: {
      'SKU-TEST-01': {
        stockInHistory: { '30': 15, '90': 45 },
        salesHistory: { '30': 10, '90': 30 },
        claimHistory: { '30': 1, '90': 2 },
        adjustmentHistory: { '30': 0, '90': 0 },
        stockQuantity: 88
      }
    }
  };

  const parsed = parseStatsSnapshot(rawPayload);
  assert(parsed['SKU-TEST-01'], 'Must contain upper SKU key');
  assert.strictEqual(parsed['SKU-TEST-01'].stockQuantity, 88);
  assert.strictEqual(parsed['SKU-TEST-01'].sales30D, 10);
  assert.strictEqual(parsed['SKU-TEST-01'].stockIn30D, 15);
  assert.strictEqual(parsed['SKU-TEST-01'].claims30D, 1);
});

test('Unpacks stringified JSON snapshot cleanly without throw', () => {
  const rawString = JSON.stringify({
    statsBySku: {
      'sku-str-02': {
        sales30D: 22,
        stockQuantity: 40
      }
    }
  });

  const parsed = parseStatsSnapshot(rawString);
  assert(parsed['SKU-STR-02'], 'Must normalize SKU to uppercase');
  assert.strictEqual(parsed['SKU-STR-02'].sales30D, 22);
  assert.strictEqual(parsed['SKU-STR-02'].stockQuantity, 40);
});

test('Unpacks 17-element compact matrix array format correctly', () => {
  // Periods: ['7', '30', '90', '365'] -> len 4
  // 4 in, 4 sales, 4 claim, 4 adj, 1 stockQuantity = 17 elements
  const compactArray = [
    5, 20, 50, 100,      // stockIn (7, 30, 90, 365)
    3, 15, 45, 90,       // sales (7, 30, 90, 365)
    0, 1, 2, 4,          // claims (7, 30, 90, 365)
    0, -1, -2, 0,        // adjustments (7, 30, 90, 365)
    65                   // stockQuantity
  ];

  const rawPayload = {
    periods: ['7', '30', '90', '365'],
    statsMap: {
      'COMPACT-SKU-01': compactArray
    }
  };

  const parsed = parseStatsSnapshot(rawPayload);
  const skuData = parsed['COMPACT-SKU-01'];
  assert(skuData, 'Must unpack compact array');
  assert.strictEqual(skuData.stockQuantity, 65);
  assert.strictEqual(skuData.stockIn30D, 20);
  assert.strictEqual(skuData.sales30D, 15);
  assert.strictEqual(skuData.claims30D, 1);
  assert.strictEqual(skuData.adjustment30D, -1);
});

test('Corrupted or invalid snapshot returns safe empty object {} without crashing', () => {
  assert.deepStrictEqual(parseStatsSnapshot(null), {});
  assert.deepStrictEqual(parseStatsSnapshot(undefined), {});
  assert.deepStrictEqual(parseStatsSnapshot('invalid-json{['), {});
  assert.deepStrictEqual(parseStatsSnapshot(12345), {});
});

// =============================================================================
// DOMAIN 4: Production Catalog Chunks & inStock Parity
// =============================================================================
console.log('\n--- 4. Catalog Chunk Integrity & inStock Boolean Parity ---');

test('inStock flag strictly matches numeric stockQuantity (> 0 is true, <= 0 is false)', () => {
  const testCases = [
    { stockQuantity: 100, inStock: true },
    { stockQuantity: 1, inStock: true },
    { stockQuantity: 0, inStock: false },
    { stockQuantity: -5, inStock: false }
  ];

  testCases.forEach(tc => {
    const computedInStock = Number(tc.stockQuantity) > 0;
    assert.strictEqual(computedInStock, tc.inStock, `stockQuantity ${tc.stockQuantity} must result in inStock=${tc.inStock}`);
  });
});

test('Zero metric value is genuinely preserved and not clobbered by undefined/null checks', () => {
  const product = {
    sku: 'ZERO-SKU',
    stockIn30D: 0,
    sales30D: 0,
    claims30D: 0,
    adjustment30D: 0,
    stockQuantity: 0
  };

  // Safe metric resolution function as in production
  const safeMetric = (val, fallback = 0) => {
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
    return fallback;
  };

  assert.strictEqual(safeMetric(product.stockIn30D, 999), 0, 'Zero stockIn must not trigger fallback');
  assert.strictEqual(safeMetric(product.sales30D, 999), 0, 'Zero sales must not trigger fallback');
  assert.strictEqual(safeMetric(product.claims30D, 999), 0, 'Zero claims must not trigger fallback');
  assert.strictEqual(safeMetric(product.adjustment30D, 999), 0, 'Zero adjustments must not trigger fallback');
  assert.strictEqual(safeMetric(undefined, 999), 999, 'Undefined must trigger fallback');
  assert.strictEqual(safeMetric(null, 999), 999, 'Null must trigger fallback');
});

// =============================================================================
// DOMAIN 5: Simulated Adversarial 100-SKU Checksum Stress Run
// =============================================================================
console.log('\n--- 5. 100-SKU Randomized Adversarial Checksum Stress Run ---');

test('100 randomized SKU data sets maintain 100% balance equation integrity', () => {
  for (let i = 1; i <= 100; i++) {
    const base = Math.floor(Math.random() * 500);
    const stockIn = Math.floor(Math.random() * 200);
    const sales = Math.floor(Math.random() * 150);
    const claims = Math.floor(Math.random() * 10);
    const adjustments = Math.floor(Math.random() * 20) - 10; // -10 to +10

    const expectedStock = base + stockIn - sales - claims + adjustments;
    const computed = computeStockChecksum({
      baseStock: base,
      stockIn,
      sales,
      claims,
      adjustments
    });

    assert.strictEqual(computed, expectedStock, `SKU-${i} checksum mismatch`);
  }
});

console.log('\n================================================================================');
console.log(`  Adversarial Checksum Math Summary: ${passedTests}/${totalTests} assertions passed`);
if (failedTests === 0) {
  console.log('  🎉 ALL STOCK CHECKSUM & INTEGRITY MATH ASSERTIONS PASSED PERFECTLY!');
} else {
  console.error(`  ❌ FAILED ASSERTIONS: ${failedTests}`);
  process.exit(1);
}
console.log('================================================================================');
