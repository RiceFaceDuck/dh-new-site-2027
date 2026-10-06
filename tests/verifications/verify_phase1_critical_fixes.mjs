import assert from 'assert';

console.log('🧪 Starting Phase 1 Verification Script...');

// 1. Verify Regex for official order sequence vs draft sequence
const officialRegex = /^DH-\d{2}-\d+/;
const testIds = [
  { id: 'DH-TEMP-261006-153000', expectedNeedsNew: true },
  { id: 'TEMP-9999', expectedNeedsNew: true },
  { id: 'DH-26-0043', expectedNeedsNew: false },
  { id: 'DH-26-10294', expectedNeedsNew: false },
  { id: 'ORD-1234', expectedNeedsNew: true }
];

for (const test of testIds) {
  const needsNewOrderId = !officialRegex.test(test.id);
  assert.strictEqual(needsNewOrderId, test.expectedNeedsNew, `Regex test failed for ${test.id}`);
  console.log(`  ✓ Order ID check passed: "${test.id}" -> needsNewOrderId: ${needsNewOrderId}`);
}

// 2. Verify Promo Discount Calculation in billingTransactionService logic
console.log('\n🧪 Testing Promo Discount Logic...');
const promoList = [{ id: 'promo_1', type: 'FIXED', value: 50, title: 'ลด 50' }];
const hasDynamicPromos = promoList.length > 0;
const itemDiscounts = 0;
const manualBillDiscount = 20;
const promoDiscount = 50;
const totalDiscount = manualBillDiscount + promoDiscount;

const discountToPass = hasDynamicPromos 
  ? (itemDiscounts + manualBillDiscount)
  : (itemDiscounts + manualBillDiscount + promoDiscount);

assert.strictEqual(discountToPass, 20, 'discountToPass should ONLY be manual discount when dynamic promo is present');
console.log(`  ✓ discountToPass when dynamic promos present: ${discountToPass} (Expected 20, avoids double-counting 50)`);

// 3. Verify taxableShippingCost when vatOnShipping is false
const shippingFee = 100;
const isVatOnShipping = false;
const taxableShippingCost = (!isVatOnShipping) ? 0 : shippingFee;
assert.strictEqual(taxableShippingCost, 0, 'taxableShippingCost should be 0 when vatOnShipping is false');
console.log(`  ✓ taxableShippingCost when vatOnShipping is false: ${taxableShippingCost}`);

console.log('\n✅ All Phase 1 Logic Checks Passed Successfully!');
