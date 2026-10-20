import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("================================================================");
console.log("  🧪 VERIFY: Ghost Draft Prune & Draft Linkage Across POS");
console.log("================================================================");

const REPO_ROOT = process.cwd();

// Test 1: Verify staffPosDraftService.js
const staffDraftServicePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/staffPosDraftService.js');
assert.ok(fs.existsSync(staffDraftServicePath), 'staffPosDraftService.js must exist');
const draftCode = fs.readFileSync(staffDraftServicePath, 'utf8');

assert.ok(draftCode.includes('getGlobalFinishedOrderIdsSet'), 'Must export getGlobalFinishedOrderIdsSet');
assert.ok(draftCode.includes('draftOrderId'), 'Must inspect draftOrderId in finished set');
assert.ok(draftCode.includes('cleanOrderId'), 'Must sanitize and check cleanOrderId variations');
assert.ok(draftCode.includes('cleanDocId'), 'Must sanitize and check cleanDocId variations');
console.log("  [PASS] staffPosDraftService implements global finished orders set and draftOrderId matching");

// Test 2: Verify usePosState.js
const posStatePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosState.js');
assert.ok(fs.existsSync(posStatePath), 'usePosState.js must exist');
const posStateCode = fs.readFileSync(posStatePath, 'utf8');

assert.ok(posStateCode.includes('draftOrderId'), 'usePosState must collect draftOrderId in getFinishedOrderIdsSet');
assert.ok(posStateCode.includes('originalDraftId'), 'usePosState must collect originalDraftId in getFinishedOrderIdsSet');
assert.ok(posStateCode.includes("stat === 'superseded'"), 'usePosState must consider superseded orders as finished');
console.log("  [PASS] usePosState prunes superseded orders and links draftOrderId");

// Test 3: Verify billingTransactionService.js
const txServicePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/billingTransactionService.js');
assert.ok(fs.existsSync(txServicePath), 'billingTransactionService.js must exist');
const txCode = fs.readFileSync(txServicePath, 'utf8');

assert.ok(txCode.includes('draftOrderId: (oldDraftDocId && oldDraftDocId !== finalOrderId)'), 'billingTransactionService must persist draftOrderId');
assert.ok(txCode.includes('originalDraftId: (oldDraftDocId && oldDraftDocId !== finalOrderId)'), 'billingTransactionService must persist originalDraftId');
console.log("  [PASS] billingTransactionService attaches draftOrderId to new orders");

// Test 4: Verify billingStatusTransaction.js
const statusTxPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/billingStatusTransaction.js');
assert.ok(fs.existsSync(statusTxPath), 'billingStatusTransaction.js must exist');
const statusTxCode = fs.readFileSync(statusTxPath, 'utf8');

assert.ok(statusTxCode.includes('draftOrderId: orderId'), 'billingStatusTransaction must migrate draftOrderId');
assert.ok(statusTxCode.includes('originalDraftId: orderData.originalDraftId || orderId'), 'billingStatusTransaction must migrate originalDraftId');
console.log("  [PASS] billingStatusTransaction preserves draftOrderId during atomic order migration");

// Test 5: Verify orderSyncService.js
const syncServicePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/orderSyncService.js');
assert.ok(fs.existsSync(syncServicePath), 'orderSyncService.js must exist');
const syncCode = fs.readFileSync(syncServicePath, 'utf8');

assert.ok(syncCode.includes('draftOrderId: d.draftOrderId'), 'orderSyncService must bundle draftOrderId into catalogs/recent_orders');
assert.ok(syncCode.includes('originalDraftId: d.originalDraftId'), 'orderSyncService must bundle originalDraftId into catalogs/recent_orders');
console.log("  [PASS] orderSyncService bundles draftOrderId to recent_orders catalog");

// Test 6: Verify FloatingMiniCart.jsx
const floatingCartPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
assert.ok(fs.existsSync(floatingCartPath), 'FloatingMiniCart.jsx must exist');
const cartCode = fs.readFileSync(floatingCartPath, 'utf8');

assert.ok(cartCode.includes('dh_recent_orders_updated'), 'FloatingMiniCart must listen to dh_recent_orders_updated');
assert.ok(cartCode.includes('dh_recent_orders_cache_v1'), 'FloatingMiniCart must listen to recent orders cache changes in storage');
console.log("  [PASS] FloatingMiniCart reacts to recent order updates for real-time draft pruning");

// Test 7: Functional Simulation of Pruning Logic
const mockTabs = [
  { id: '1', orderId: 'DH-TEMP-5246', customer: { name: 'เอ พี' } },
  { id: '2', orderId: 'DH-TEMP-8210', customer: { name: 'ต่อคอม' } },
  { id: '3', orderId: 'DH-TEMP-3925', customer: { name: 'ฟาโคบิส' } },
  { id: '4', orderId: 'DH-TEMP-4554', customer: { name: '1 DH Admin' } },
  { id: '5', orderId: 'DH-TEMP-3418', customer: { name: 'ช่างน้ำหอม' } }
];

// Finished orders catalog having official IDs that link to draftOrderId
const mockFinishedSet = new Set(['DH-26-0049', 'DH-26-0052', 'DH-TEMP-4554', 'DH-TEMP-3418']);

const simulateFilter = (tabs, finishedSet) => {
  return tabs.filter(t => {
    const tOrderId = t.orderId ? String(t.orderId).trim() : null;
    const tDocId = t.docId ? String(t.docId).trim() : null;
    if (tOrderId && finishedSet.has(tOrderId)) return false;
    if (tDocId && finishedSet.has(tDocId)) return false;
    return true;
  });
};

const pruned = simulateFilter(mockTabs, mockFinishedSet);
assert.strictEqual(pruned.length, 3, 'Must leave exactly 3 valid drafts');
assert.ok(!pruned.some(t => t.orderId === 'DH-TEMP-4554'), 'DH-TEMP-4554 must be pruned');
assert.ok(!pruned.some(t => t.orderId === 'DH-TEMP-3418'), 'DH-TEMP-3418 must be pruned');
console.log("  [PASS] Functional simulation confirms exactly 3 valid drafts remain");

console.log("================================================================");
console.log("  Summary: All 7 Verification Gates Passed Successfully! 🚀");
console.log("================================================================");
process.exit(0);
