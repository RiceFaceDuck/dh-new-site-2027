import { calculateCanonicalTotals } from '../../dh-shared/src/priceEngine.js';
import { calculateDetailedVat } from '../../dh-shared/src/taxEngine.js';

console.log('================================================================================');
console.log('🧪 VERIFICATION SUITE: Post-Tax/Shipping Other Fee Adjustment Verification');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(desc, condition, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${desc}`);
        passCount++;
    } else {
        console.error(`  ❌ [FAIL] ${desc} | ${details}`);
        failCount++;
    }
}

// --- TEST 1: User Case DHO-47111 (Excluded VAT with Credit Note -613.43) ---
console.log('--- TEST 1: Exact Case DHO-47111 (Excluded VAT with Credit Note) ---');
const orderExcludedVat = {
    items: [{ sku: 'LED21522', price: 2050, qty: 1 }],
    shippingFee: 150,
    vatType: 'excluded',
    vatOnShipping: true,
    vatRate: 7,
    otherFeeAmount: -613.43,
    otherFeeName: 'ทำใบลดหนี้รับคืน LED14003'
};

const canonicalExcluded = calculateCanonicalTotals(orderExcludedVat);
assert(
    'VAT 7% is calculated on full base (2,050 + 150 = 2,200 * 0.07 = 154.00)',
    canonicalExcluded.vatBreakdown.vatAmount === 154,
    `Got: ${canonicalExcluded.vatBreakdown.vatAmount}`
);
assert(
    'Taxable product base is not reduced by otherFeeAmount (2,050.00)',
    canonicalExcluded.vatBreakdown.productBase === 2050,
    `Got: ${canonicalExcluded.vatBreakdown.productBase}`
);
assert(
    'Net Total equals exactly 1,740.57 THB (matches original correct bill DHO-47111)',
    canonicalExcluded.netTotal === 1740.57,
    `Got: ${canonicalExcluded.netTotal}`
);

// --- TEST 2: Exempt VAT (No VAT) ---
console.log('\n--- TEST 2: Exempt VAT (No VAT) with Credit Note ---');
const orderExempt = {
    items: [{ sku: 'LED21522', price: 2050, qty: 1 }],
    shippingFee: 150,
    vatType: 'exempt',
    otherFeeAmount: -613.43
};

const canonicalExempt = calculateCanonicalTotals(orderExempt);
assert(
    'VAT is 0 for exempt order',
    canonicalExempt.vatBreakdown.vatAmount === 0,
    `Got: ${canonicalExempt.vatBreakdown.vatAmount}`
);
assert(
    'Net Total equals 1,586.57 THB (2050 + 150 - 613.43)',
    canonicalExempt.netTotal === 1586.57,
    `Got: ${canonicalExempt.netTotal}`
);

// --- TEST 3: Positive otherFee (+50 THB) ---
console.log('\n--- TEST 3: Positive otherFee (+50 THB packaging) ---');
const orderPositiveFee = {
    items: [{ sku: 'ITEM1', price: 1000, qty: 1 }],
    shippingFee: 100,
    vatType: 'excluded',
    vatOnShipping: true,
    otherFeeAmount: 50,
    otherFeeName: 'ค่าแพ็คไม้'
};

const canonicalPositive = calculateCanonicalTotals(orderPositiveFee);
assert(
    'VAT is calculated on 1,100 (77.00)',
    canonicalPositive.vatBreakdown.vatAmount === 77,
    `Got: ${canonicalPositive.vatBreakdown.vatAmount}`
);
assert(
    'Net Total is 1,227.00 THB (1,000 + 100 + 77 + 50)',
    canonicalPositive.netTotal === 1227,
    `Got: ${canonicalPositive.netTotal}`
);

// --- TEST 4: Zero otherFee regression check ---
console.log('\n--- TEST 4: Zero otherFee regression check ---');
const orderStandard = {
    items: [{ sku: 'ITEM1', price: 500, qty: 2 }],
    shippingFee: 80,
    vatType: 'included',
    vatOnShipping: false,
    otherFeeAmount: 0
};

const canonicalStandard = calculateCanonicalTotals(orderStandard);
assert(
    'Standard order calculation intact',
    canonicalStandard.netTotal === 1080,
    `Got: ${canonicalStandard.netTotal}`
);

console.log('\n================================================================================');
console.log(`Verification Summary: Total ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`);
console.log('================================================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
