import assert from 'node:assert/strict';
import {
  calculateItemTotal,
  calculateSubtotal,
  calculatePromotionDiscount,
  calculateNetTotal,
  calculateCanonicalTotals
} from '../../dh-shared/src/priceEngine.js';

// Case 1: POS edited unit price + item discount + 10% promo + manual discount
const items1 = [
  { sku: 'ADAC003', price: 200, retailPrice: 250, discount: 20, qty: 2 }, // (200-20)*2 = 360
  { sku: 'FREE01', price: 0, isFreebie: true, qty: 1 }
];
assert.equal(calculateItemTotal(items1[0]), 360, 'calculateItemTotal should use price and deduct item discount');
assert.equal(calculateItemTotal(items1[1]), 0, 'freebie item total must be 0');
assert.equal(calculateSubtotal(items1), 360, 'subtotal must equal 360');

const promo10 = { type: 'PERCENTAGE', value: 10, minSpend: 300 };
assert.equal(calculatePromotionDiscount(360, items1, promo10), 36, '10% promo should apply after item.discount');

const net1 = calculateNetTotal({
  items: items1,
  discountAmount: 10, // manual bill discount
  promotions: [promo10],
  shippingCost: 60
});
// 360 - (10 + 36) + 60 = 374
assert.equal(net1.subtotal, 360);
assert.equal(net1.discountAmount, 46);
assert.equal(net1.netTotal, 374);

// Case 2: Canonical totals parity with item.discount + promoDiscount + overallDiscount
const canonical1 = calculateCanonicalTotals({
  items: items1,
  overallDiscount: 10,
  promoDiscount: 36,
  shippingFee: 60,
  vatType: 'exempt',
  otherFeeAmount: -14,
  totals: { discount: 46 }
});
assert.equal(canonical1.itemsSubTotal, 360);
assert.equal(canonical1.manualDiscount, 10);
assert.equal(canonical1.promoDiscount, 36);
assert.equal(canonical1.netTotal, 360); // 360 - 46 + 60 - 14 = 360

// Case 3: Negative / excessive discount clamping
const badItems = [
  { sku: 'BAD1', price: -50, discount: 10, qty: 2 },
  { sku: 'BAD2', price: 100, discount: 150, qty: 3 }
];
assert.equal(calculateItemTotal(badItems[0]), 0, 'negative price clamps to 0');
assert.equal(calculateItemTotal(badItems[1]), 0, 'discount > price clamps to 0');

// Case 4: FIXED promo exceeding subtotal clamps to subtotal
const fixedBig = { type: 'FIXED', value: 500 };
const smallItem = [{ sku: 'S1', price: 120, discount: 0, qty: 1 }];
assert.equal(calculatePromotionDiscount(120, smallItem, fixedBig), 120, 'FIXED promo must clamp to subtotal');

console.log('✅ verify_billing_phase1: ALL ASSERTIONS PASSED');
