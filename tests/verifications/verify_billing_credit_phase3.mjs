import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = 'c:/_DH Notebook/Management System';
const billingTxPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const returnActionPath = path.join(ROOT, 'dh-backoffice-react/src/firebase/claim/returnActionService.js');
const orderSummaryPath = path.join(ROOT, 'dh-backoffice-react/src/components/billing/dashboard/OrderSummary.jsx');
const orderSummaryTotalsPath = path.join(ROOT, 'dh-backoffice-react/src/components/billing/dashboard/order-summary/OrderSummaryTotals.jsx');

const billingTxSrc = fs.readFileSync(billingTxPath, 'utf8');
const returnActionSrc = fs.readFileSync(returnActionPath, 'utf8');
const orderSummarySrc = fs.readFileSync(orderSummaryPath, 'utf8');
const orderSummaryTotalsSrc = fs.readFileSync(orderSummaryTotalsPath, 'utf8');

console.log('=== Phase 3 Billing Credit Cache Parity, Ledger & Calm UI Verification ===');

// 1. billingTransactionService syncs updatedCreditPoints into customer directory chunk
assert.ok(
  billingTxSrc.includes('if (creditRes && typeof creditRes.newBalance === \'number\') updatedCreditPoints = creditRes.newBalance;') &&
  billingTxSrc.includes('creditPoints: updatedCreditPoints, points: updatedCreditPoints'),
  'billingTransactionService must sync updatedCreditPoints to customer directory chunk'
);
console.log('✅ 1. Customer directory creditPoints cache sync verified');

// 2. returnActionService records negative clawbackPoints in transactions ledger
assert.ok(
  returnActionSrc.includes('creditPointsDelta: clawbackPoints > 0 ? -clawbackPoints : 0'),
  'returnActionService must record -clawbackPoints in financialDelta.creditPointsDelta'
);
console.log('✅ 2. Return ledger financialDelta.creditPointsDelta verified');

// 3. OrderSummary & OrderSummaryTotals display earnedPoints with Calm UI (no pulse/bounce/spin)
assert.ok(
  orderSummarySrc.includes('const earnedPoints = Number(selectedOrder.earnedPoints || 0);') &&
  orderSummarySrc.includes('earnedPoints={earnedPoints}'),
  'OrderSummary must pass earnedPoints to OrderSummaryTotals'
);
assert.ok(
  orderSummaryTotalsSrc.includes('{!isCancelled && earnedPoints > 0 && (') &&
  orderSummaryTotalsSrc.includes('แต้มสะสมที่ได้รับ') &&
  !orderSummaryTotalsSrc.includes('animate-pulse') &&
  !orderSummaryTotalsSrc.includes('animate-bounce'),
  'OrderSummaryTotals must show earnedPoints as Calm UI static badge (zero animation)'
);
console.log('✅ 3. OrderSummaryTotals Calm UI earnedPoints display verified');

console.log('🎉 ALL PHASE 3 CHECKS PASSED (3/3)');
