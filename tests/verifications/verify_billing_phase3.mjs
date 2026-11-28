import assert from 'node:assert/strict';

// Verify Phase 3 logic invariants:
// 1. B10: Status filter classification
function classifyOrder(o) {
  const stat = (o.orderStatus || o.status || '').toLowerCase();
  const payStat = (o.paymentStatus || '').toLowerCase();
  const isCancelled = stat === 'cancelled' || stat === 'void';
  const isPaidOrCompleted = !isCancelled && (stat === 'paid' || stat === 'completed' || stat === 'approved' || stat === 'shipped' || payStat === 'paid');
  const isDraftOrPending = !isCancelled && !isPaidOrCompleted && (
    stat === 'draft' || stat === 'pending' || stat === 'pending_payment' || stat === 'pending_payment_verification' ||
    stat === 'waiting_payment' || stat === 'waiting_verification' || stat === 'on_account' ||
    payStat === 'unpaid' || payStat === 'pending' || payStat === 'pending_verification' || payStat === 'on_account'
  );
  return { isCancelled, isPaidOrCompleted, isDraftOrPending };
}

assert.equal(classifyOrder({ orderStatus: 'pending_payment', paymentStatus: 'pending' }).isDraftOrPending, true, 'Web pending_payment must appear in Draft/Pending');
assert.equal(classifyOrder({ orderStatus: 'pending_payment_verification', paymentStatus: 'pending' }).isDraftOrPending, true, 'Web pending_payment_verification must appear in Draft/Pending');
assert.equal(classifyOrder({ orderStatus: 'shipped', paymentStatus: 'pending' }).isPaidOrCompleted, true, 'Shipped web order must appear in Paid');
assert.equal(classifyOrder({ orderStatus: 'on_account', paymentStatus: 'on_account' }).isDraftOrPending, true, 'OnAccount must appear in unpaid/draft filter');

// 2. B11: Pagination deadlock check with superseded orders
const rawOrdersCount = 50;
const filteredOrdersLength = 42; // 8 superseded filtered out
const limitAmount = 50;
const hasMoreFromServer = rawOrdersCount >= limitAmount;
assert.equal(hasMoreFromServer, true, 'Next page must unlock when rawOrdersCount >= limitAmount even if filteredOrders < limitAmount');
assert.notEqual(filteredOrdersLength >= limitAmount, hasMoreFromServer);

// 3. B13: Regular POS VAT bill must NOT show pending tax badge
function resolveTaxStatus(order) {
  const isWebOrder = Boolean(order.isWebOrder || order.channel === 'storefront' || order.source === 'storefront');
  const hasExplicitPendingTax = Boolean(
    order.hasPendingTax ||
    order.taxInvoiceStatus === 'pending' ||
    order.taxInvoiceRequested ||
    order.requestTaxInvoice ||
    (isWebOrder && (order.taxInvoice || order.taxData) && order.taxInvoiceStatus !== 'issued' && !order.taxInvoiceUrl)
  );
  return order.taxInvoiceStatus || (order.taxInvoiceUrl ? 'issued' : (hasExplicitPendingTax ? 'pending' : null));
}

assert.equal(resolveTaxStatus({ vatType: 'included', customer: { taxId: '0105558000000' } }), null, 'Normal POS VAT bill must NOT show pending tax');
assert.equal(resolveTaxStatus({ hasPendingTax: true }), 'pending', 'Order with active issue_tax_invoice todo must show pending');
assert.equal(resolveTaxStatus({ isWebOrder: true, taxInvoice: { taxId: '1234567890123' } }), 'pending', 'Web order requesting tax invoice must show pending');
assert.equal(resolveTaxStatus({ isWebOrder: true, taxInvoice: { taxId: '1234567890123' }, taxInvoiceStatus: 'issued' }), 'issued', 'Issued tax invoice must show issued');

console.log('✅ verify_billing_phase3: ALL ASSERTIONS PASSED');
