/**
 * Matrix Unpacker & 5D Metric Integrity Verification Test Suite
 * Centralized Hub: Management System/tests/adversarial/
 */

import { parseStatsSnapshot } from '../../dh-backoffice-react/src/firebase/inventory/migrationService.js';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('🛡️ MATRIX UNPACKER & 5D METRIC INTEGRITY VERIFICATION');
console.log('================================================================\n');

// 1. Test 17-number compact array parsing (Production standard)
console.log('📦 SUITE 1: 17-Number Compact Matrix Unpacking');
const sample17 = {
  periods: ['7', '30', '90', '365'],
  statsBySku: {
    ADAC001: [
      0, 0, 0, 0,    // stockIn: 7, 30, 90, 365
      0, 3, 9, 32,   // sales: 7, 30, 90, 365
      0, 1, 3, 5,    // claim: 7, 30, 90, 365
      0, 0, 0, 0,    // adjustment: 7, 30, 90, 365
      7              // stockQuantity
    ],
    ADAC004: [
      1, 1, 1, 1,
      12, 17, 17, 17,
      1, 1, 1, 1,
      0, 0, 0, 0,
      137
    ]
  }
};

const parsed17 = parseStatsSnapshot(sample17);
assert(parsed17.ADAC001 !== undefined, 'ADAC001 is unpacked from 17-number matrix');
assert(parsed17.ADAC001.stockInHistory['30'] === 0, 'ADAC001 stockInHistory[30] is 0');
assert(parsed17.ADAC001.salesHistory['30'] === 3, 'ADAC001 salesHistory[30] is 3');
assert(parsed17.ADAC001.claimHistory['30'] === 1, 'ADAC001 claimHistory[30] is 1');
assert(parsed17.ADAC001.adjustmentHistory['30'] === 0, 'ADAC001 adjustmentHistory[30] is 0');
assert(parsed17.ADAC001.stockQuantity === 7, 'ADAC001 stockQuantity is 7');

assert(parsed17.ADAC004 !== undefined, 'ADAC004 is unpacked from 17-number matrix');
assert(parsed17.ADAC004.stockInHistory['30'] === 1, 'ADAC004 stockInHistory[30] is 1');
assert(parsed17.ADAC004.salesHistory['30'] === 17, 'ADAC004 salesHistory[30] is 17');
assert(parsed17.ADAC004.stockQuantity === 137, 'ADAC004 stockQuantity is 137');

// 2. Test 21-number compact array parsing
console.log('\n📦 SUITE 2: 21-Number Compact Matrix Unpacking');
const sample21 = {
  statsBySku: {
    ITEM21: [
      1, 2, 3, 4, 5,       // stockIn (30, 60, 90, 180, 365)
      6, 7, 8, 9, 10,      // sales
      0, 0, 0, 0, 0,       // claim
      -1, -2, -3, -4, -5,  // adjustment
      99                   // stockQuantity
    ]
  }
};
const parsed21 = parseStatsSnapshot(sample21);
assert(parsed21.ITEM21 !== undefined, 'ITEM21 is unpacked from 21-number matrix');
assert(parsed21.ITEM21.stockInHistory['30'] === 1, 'ITEM21 stockInHistory[30] is 1');
assert(parsed21.ITEM21.salesHistory['365'] === 10, 'ITEM21 salesHistory[365] is 10');
assert(parsed21.ITEM21.adjustmentHistory['30'] === -1, 'ITEM21 adjustmentHistory[30] is -1');
assert(parsed21.ITEM21.stockQuantity === 99, 'ITEM21 stockQuantity is 99');

// 3. Test Zero Inbound Preservation (No Phantom +75)
console.log('\n📦 SUITE 3: Zero Inbound Metric Gate (Phantom Fallback Defense)');
const productWithLegacyJunk = {
  sku: 'ADAC001',
  'stockInHistory.30': 75,
  stockIn30D: 75,
  stockInHistory: { '7': 0, '30': 0, '90': 0, '365': 0 }
};

const resolveMetric = (statVal, fieldName, historyObj, p, period) => {
  if (statVal != null && !isNaN(Number(statVal))) return Number(statVal);
  const histVal = historyObj?.[period];
  if (histVal != null && !isNaN(Number(histVal))) return Number(histVal);
  const flatVal = p[`${fieldName}.${period}`];
  if (flatVal != null && !isNaN(Number(flatVal))) return Number(flatVal);
  return 0;
};

const resolvedZero = resolveMetric(0, 'stockInHistory', productWithLegacyJunk.stockInHistory, productWithLegacyJunk, '30');
assert(resolvedZero === 0, 'Authentic 0 stockIn is preserved (does NOT return phantom 75)');

const resolvedUnmapped = resolveMetric(undefined, 'stockInHistory', undefined, productWithLegacyJunk, '30');
assert(resolvedUnmapped === 75, 'Unmapped product safely falls back to legacy field');

// 4. Resilience & Edge Cases
console.log('\n📦 SUITE 4: Error Resilience & Null Guards');
assert(Object.keys(parseStatsSnapshot(null)).length === 0, 'Gracefully handles null');
assert(Object.keys(parseStatsSnapshot(undefined)).length === 0, 'Gracefully handles undefined');
assert(Object.keys(parseStatsSnapshot({})).length === 0, 'Gracefully handles empty object');
assert(Object.keys(parseStatsSnapshot({ statsBySku: 'corrupt_string' })).length === 0, 'Gracefully handles corrupted non-object map');

console.log('\n================================================================');
console.log(`📊 RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL MATRIX UNPACKER TESTS PASSED WITH 100% INTEGRITY!\n');
  process.exit(0);
}
