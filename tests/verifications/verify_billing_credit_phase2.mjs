import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = 'c:/_DH Notebook/Management System';
const statusTxPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/billingStatusTransaction.js');
const walletHandlerPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');
const posPaymentPath = path.join(ROOT, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosPayment.js');

const statusTxSrc = fs.readFileSync(statusTxPath, 'utf8');
const walletHandlerSrc = fs.readFileSync(walletHandlerPath, 'utf8');
const posPaymentSrc = fs.readFileSync(posPaymentPath, 'utf8');

console.log('=== Phase 2 Billing Credit Formula & Reference ID Parity Verification ===');

// 1. billingStatusTransaction pre-reads counter during READ phase & preloads TXP_{resolvedOrderIdForCredit}
assert.ok(
  statusTxSrc.includes('const shouldPreloadEarn = isConfirmingPayment && (amountForPoints > 0 || Number(orderData.pendingCredits || 0) > 0);'),
  'billingStatusTransaction must preload earn credit snaps whenever amountForPoints > 0 (supports <100 THB + SKU Bonus)'
);
assert.ok(
  statusTxSrc.includes('refForPreload = `TXP_${resolvedOrderIdForCredit}`;'),
  'billingStatusTransaction must preload TXP using official resolvedOrderIdForCredit'
);
const counterReadIdx = statusTxSrc.indexOf('const counterSnap = await transaction.get(counterRef);');
const firstWriteIdx = statusTxSrc.indexOf('transaction.set(counterRef,');
assert.ok(
  counterReadIdx > 0 && firstWriteIdx > counterReadIdx,
  'Firestore transaction invariant: counterRef READ must occur strictly before WRITE'
);
console.log('✅ 1. billingStatusTransaction READ-before-WRITE & TXP official ID verified');

// 2. statusWalletHandler uses resolvedOrderId = updates.orderId || orderId
assert.ok(
  walletHandlerSrc.includes('const resolvedOrderId = updates.orderId || orderId;') &&
  walletHandlerSrc.includes('`TXP_${resolvedOrderId}`'),
  'handlePointsEarned must pass TXP_{resolvedOrderId} matching preloaded ref'
);
console.log('✅ 2. statusWalletHandler TXP_{resolvedOrderId} parity verified');

// 3. usePosPayment loads credit_config + role_tier_config with 10-min SessionStorage cache and uses calculateEarnedPoints
assert.ok(
  posPaymentSrc.includes('calculateEarnedPoints(remainingToPay, creditConfig, activeTab.items || [], userTotalAccumulated)'),
  'usePosPayment must calculate earnedPoints using shared calculateEarnedPoints engine'
);
assert.ok(
  posPaymentSrc.includes('fetchAndCacheRoleTiers()') && posPaymentSrc.includes('setCachedTiers('),
  'usePosPayment must hydrate role_tier_config cache for Backoffice getUserTier()'
);
assert.ok(
  posPaymentSrc.includes("activeTab.customer.uid === 'WALK-IN'"),
  'usePosPayment must return 0 earnedPoints for WALK-IN customers'
);
assert.ok(
  !posPaymentSrc.includes('setDoc('),
  'usePosPayment credit_config loader must be strictly read-only (safe for isStaff)'
);
console.log('✅ 3. usePosPayment formula parity, role_tier hydration & read-only cache verified');

console.log('🎉 ALL PHASE 2 CHECKS PASSED (3/3)');
