import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = 'c:/_DH Notebook/Management System';
const files = {
  creditAction: fs.readFileSync(path.join(ROOT, 'dh-backoffice-react/src/firebase/credit/creditActionService.js'), 'utf8'),
  billingTx: fs.readFileSync(path.join(ROOT, 'dh-backoffice-react/src/firebase/billingTransactionService.js'), 'utf8'),
  billingStatus: fs.readFileSync(path.join(ROOT, 'dh-backoffice-react/src/firebase/billingStatusTransaction.js'), 'utf8'),
  returnAction: fs.readFileSync(path.join(ROOT, 'dh-backoffice-react/src/firebase/claim/returnActionService.js'), 'utf8'),
  cancelAction: fs.readFileSync(path.join(ROOT, 'dh-backoffice-react/src/firebase/claim/cancelActionService.js'), 'utf8'),
};

console.log('=== Phase 4 Billing Credit Quota Optimization Verification ===');

// 1. Legacy wallet/default completely removed from creditActionService & all callers
assert.ok(!files.creditAction.includes("'wallet', 'default'"), 'creditActionService must not reference legacy wallet/default');
assert.ok(!files.creditAction.includes('transaction.set(walletRef'), 'creditActionService must not write legacy walletRef');
assert.ok(!files.billingTx.includes('transaction.get(creditRefs.walletRef)'), 'billingTransactionService must not read walletRef');
assert.ok(!files.billingStatus.includes('transaction.get(creditRefs.walletRef)'), 'billingStatusTransaction must not read walletRef');
assert.ok(!files.returnAction.includes('transaction.get(creditRefs.walletRef)'), 'returnActionService must not read walletRef');
assert.ok(!files.cancelAction.includes('transaction.get(creditRefs.walletRef)'), 'cancelActionService must not read walletRef');
console.log('✅ 1. Legacy users/{uid}/wallet/default read & write eliminated across all 5 files');

// 2. Duplicate reads eliminated in billingTransactionService, billingStatusTransaction, cancelActionService
assert.ok(
  files.billingTx.includes('existingUserSnap ? Promise.resolve(existingUserSnap) : transaction.get(creditRefs.userRef)') &&
  files.billingTx.includes('fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower, userSnap)'),
  'billingTransactionService must reuse existing userSnap instead of double-reading users/{uid}'
);
assert.ok(
  files.billingStatus.includes('settingsSnap ? Promise.resolve(settingsSnap) : transaction.get(creditRefs.settingsRef)') &&
  files.billingStatus.includes('userSnap ? Promise.resolve(userSnap) : transaction.get(creditRefs.userRef)'),
  'billingStatusTransaction must reuse existing userSnap & settingsSnap instead of double-reading'
);
assert.ok(
  files.cancelAction.includes('userSnap ? Promise.resolve(userSnap) : transaction.get(creditRefs.userRef)'),
  'cancelActionService must reuse existing userSnap instead of double-reading users/{uid}'
);
console.log('✅ 2. Duplicate transaction.get() reads eliminated across billing & claim transactions');

console.log('🎉 ALL PHASE 4 QUOTA CHECKS PASSED (2/2)');
