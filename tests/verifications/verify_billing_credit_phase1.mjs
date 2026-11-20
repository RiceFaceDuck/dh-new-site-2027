import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = 'c:/_DH Notebook/Management System';
const creditActionPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/credit/creditActionService.js');
const billingTxPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const rulesPath = path.join(ROOT, 'firestore.rules');

const creditActionSrc = fs.readFileSync(creditActionPath, 'utf8');
const billingTxSrc = fs.readFileSync(billingTxPath, 'utf8');
const rulesSrc = fs.readFileSync(rulesPath, 'utf8');

console.log('=== Phase 1 Billing Credit Point Safety Verification ===');

// 1. adjustUserCreditWithTransaction gates accountId/customerCode behind options?.allowIdentityHeal
assert.ok(
  creditActionSrc.includes('options = {}'),
  'adjustUserCreditWithTransaction must accept options = {}'
);
assert.ok(
  creditActionSrc.includes('if (options?.allowIdentityHeal && userData && !userData.accountId)'),
  'accountId auto-heal must be gated by options?.allowIdentityHeal'
);
assert.ok(
  creditActionSrc.includes('if (options?.allowIdentityHeal && userData && !userData.customerCode)'),
  'customerCode auto-heal must be gated by options?.allowIdentityHeal'
);
assert.ok(
  creditActionSrc.includes('{ allowIdentityHeal: true }'),
  'Standalone adjustUserCredit (Manager) should still enable allowIdentityHeal'
);
console.log('✅ 1. isStaff PERMISSION_DENIED guard on users.accountId/customerCode verified');

// 2. ActivePartners update inside transaction strictly writes points + updatedAt (matches firestore.rules)
assert.ok(
  creditActionSrc.includes("transaction.set(activePartnerRef, { points: newPointsBalance, updatedAt: serverTimestamp() }, { merge: true });"),
  'ActivePartners sync in adjustUserCreditWithTransaction must only update points and updatedAt'
);
assert.ok(
  rulesSrc.includes("isStaff() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['points', 'updatedAt'])"),
  'firestore.rules ActivePartners rule parity verified'
);
console.log('✅ 2. isStaff PERMISSION_DENIED guard on ActivePartners verified');

// 3. totalAccumulatedPoints reads canonical userData.totalAccumulatedPoints (Phase 4 removed legacy wallet/default)
assert.ok(
  creditActionSrc.includes('let totalAccumulated = Number(userData.totalAccumulatedPoints || 0);'),
  'totalAccumulated must read canonical userData.totalAccumulatedPoints'
);
console.log('✅ 3. totalAccumulatedPoints non-reset guard verified');

// 4. billingTransactionService preloads credit snaps for both paid and approved + has zero-trust pendingCredits guard
assert.ok(
  billingTxSrc.includes("(statusLower === 'paid' || statusLower === 'approved')"),
  'fetchCreditPreloads & calculateWalletAndPoints must support both paid and approved'
);
assert.ok(
  billingTxSrc.includes('if (earnedPoints >= amountForPoints && amountForPoints > 0)'),
  'Zero-trust guard for inflated pendingCredits must exist in billingTransactionService'
);
console.log('✅ 4. billingTransactionService paid/approved preload & Zero-Trust guard verified');

console.log('🎉 ALL PHASE 1 CHECKS PASSED (4/4)');
