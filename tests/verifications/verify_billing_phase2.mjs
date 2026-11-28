import assert from 'node:assert/strict';

// Verify Phase 2 logic invariants:
// 1. Receipt A5 payableTotal & displayShipping math across all 3 VAT modes
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100;

function calcReceiptFooterPreview({ itemSubTotal, shippingFee, vatType, vatOnShipping, walletUsed, otherFee = 0 }) {
  const vatRate = 7;
  const vatMultiplier = 1 + vatRate / 100;
  const isVatIncluded = vatType === 'included';
  const isVatExcluded = vatType === 'excluded';
  const taxable = itemSubTotal + (vatOnShipping ? shippingFee : 0);

  let vatAmount = 0;
  let netTotal = 0;
  if (isVatIncluded) {
    vatAmount = round2(taxable * 7 / 107);
    netTotal = round2(itemSubTotal + shippingFee + otherFee);
  } else if (isVatExcluded) {
    vatAmount = round2(taxable * 0.07);
    netTotal = round2(itemSubTotal + shippingFee + vatAmount + otherFee);
  } else {
    netTotal = round2(itemSubTotal + shippingFee + otherFee);
  }

  const displaySubTotal = isVatIncluded ? round2(itemSubTotal / vatMultiplier) : itemSubTotal;
  const displayShipping = (isVatIncluded && vatOnShipping && shippingFee > 0)
    ? round2(shippingFee / vatMultiplier)
    : shippingFee;
  const payableTotal = Math.max(0, round2(netTotal - walletUsed));

  const reconstructedNet = round2(displaySubTotal + displayShipping + vatAmount + otherFee);
  return { displaySubTotal, displayShipping, vatAmount, netTotal, payableTotal, reconstructedNet };
}

// Included VAT + vatOnShipping=true + wallet=200
const rInc = calcReceiptFooterPreview({ itemSubTotal: 1070, shippingFee: 107, vatType: 'included', vatOnShipping: true, walletUsed: 200 });
assert.equal(rInc.displaySubTotal, 1000);
assert.equal(rInc.displayShipping, 100);
assert.equal(rInc.vatAmount, 77);
assert.equal(rInc.netTotal, 1177);
assert.equal(rInc.reconstructedNet, 1177, 'Included VAT receipt rows must sum exactly to netTotal');
assert.equal(rInc.payableTotal, 977, 'Payable total must deduct walletUsed');

// Excluded VAT + vatOnShipping=true + wallet=100
const rExc = calcReceiptFooterPreview({ itemSubTotal: 1000, shippingFee: 100, vatType: 'excluded', vatOnShipping: true, walletUsed: 100 });
assert.equal(rExc.displaySubTotal, 1000);
assert.equal(rExc.displayShipping, 100, 'Excluded VAT shipping row must NOT multiply by 1.07 again');
assert.equal(rExc.vatAmount, 77);
assert.equal(rExc.netTotal, 1177);
assert.equal(rExc.reconstructedNet, 1177, 'Excluded VAT receipt rows must sum exactly to netTotal');
assert.equal(rExc.payableTotal, 1077, 'Payable total must deduct walletUsed');

// Exempt + vatOnShipping=true (stale flag) + wallet=50
const rExm = calcReceiptFooterPreview({ itemSubTotal: 500, shippingFee: 60, vatType: 'exempt', vatOnShipping: true, walletUsed: 50 });
assert.equal(rExm.displayShipping, 60, 'Exempt mode shipping must stay 60');
assert.equal(rExm.payableTotal, 510);

// 2. Empty initial tab with auto DH-TEMP orderId must NOT count as meaningful cloud draft
const hasMeaningfulDraftContent = (t) => Boolean(
  (Array.isArray(t?.items) && t.items.length > 0) ||
  t?.customer ||
  (t?.walkInName && String(t.walkInName).trim()) ||
  (t?.walkInPhone && String(t.walkInPhone).trim()) ||
  (t?.billNote && String(t.billNote).trim()) ||
  t?.docId
);
assert.equal(hasMeaningfulDraftContent({ id: '1', orderId: 'DH-TEMP-1234', docId: null, items: [], customer: null }), false);
assert.equal(hasMeaningfulDraftContent({ id: '2', orderId: 'DH-TEMP-1234', docId: null, items: [{ sku: 'A1' }] }), true);

console.log('✅ verify_billing_phase2: ALL ASSERTIONS PASSED');
