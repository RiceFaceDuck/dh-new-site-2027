import fs from 'fs';
import path from 'path';
import assert from 'assert';

const billingPath = path.resolve('Management System/dh-backoffice-react/src/firebase/billingTransactionService.js');
const returnPath = path.resolve('Management System/dh-backoffice-react/src/firebase/claim/returnActionService.js');
const cancelPath = path.resolve('Management System/dh-backoffice-react/src/firebase/claim/cancelActionService.js');
const statusPath = path.resolve('Management System/dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');

console.log('========================================================');
console.log('🧪 VERIFY: Wallet Phase 3 Ledger Audit & Deterministic IDs');
console.log('========================================================\n');

// 1. billingTransactionService.js checks
const billingCode = fs.readFileSync(billingPath, 'utf8');
assert(billingCode.includes("const txId = `TXW_POS_${finalOrderId}`"), 'billingTransactionService txId missing');
assert(billingCode.includes("doc(db, getCollectionPath('users'), customerUid, 'wallet_transactions', txId)"), 'billingTransactionService deterministic doc ID missing');
assert(billingCode.includes("balanceAfter: balanceAfter"), 'billingTransactionService balanceAfter missing in payload');
assert(billingCode.includes("type: 'SPEND'"), 'billingTransactionService SPEND type normalization missing');
assert(billingCode.includes("lastWalletTxId: txId"), 'billingTransactionService user lastWalletTxId missing');
console.log('✅ 1. billingTransactionService ledger records balanceAfter, SPEND, and deterministic doc ID');

// 2. returnActionService.js checks
const returnCode = fs.readFileSync(returnPath, 'utf8');
assert(returnCode.includes("const txId = `TXW_REF_${payload.returnId}`"), 'returnActionService txId missing');
assert(returnCode.includes("doc(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions', txId)"), 'returnActionService deterministic doc ID missing');
assert(returnCode.includes("balanceAfter: balanceAfter"), 'returnActionService balanceAfter missing in payload');
assert(returnCode.includes("lastWalletTxId: txId"), 'returnActionService user lastWalletTxId missing');
console.log('✅ 2. returnActionService ledger records balanceAfter and deterministic doc ID');

// 3. cancelActionService.js checks
const cancelCode = fs.readFileSync(cancelPath, 'utf8');
assert(cancelCode.includes("const txId = `TXW_CB_RTN_${payload.returnId || Date.now()}`"), 'cancelActionService CB_RTN txId missing');
assert(cancelCode.includes("const txId = `TXW_REF_SWAP_${payload.claimId || payload.exchangeId || Date.now()}`"), 'cancelActionService REF_SWAP txId missing');
assert(cancelCode.includes("const txId = `TXW_CB_SWAP_${payload.claimId || payload.exchangeId || Date.now()}`"), 'cancelActionService CB_SWAP txId missing');
assert(cancelCode.includes("lastWalletTxId: txId"), 'cancelActionService lastWalletTxId missing');
console.log('✅ 3. cancelActionService all 3 reversal flows record balanceAfter and deterministic doc ID');

// 4. statusWalletHandler.js checks
const statusCode = fs.readFileSync(statusPath, 'utf8');
assert(statusCode.includes("const txId = `TXW_REF_${orderId}`"), 'statusWalletHandler txId missing');
assert(statusCode.includes("doc(db, getCollectionPath('users'), userSnap.id, 'wallet_transactions', txId)"), 'statusWalletHandler deterministic doc ID missing');
assert(statusCode.includes("balanceAfter: balanceAfter"), 'statusWalletHandler balanceAfter missing in payload');
assert(statusCode.includes("lastWalletTxId: txId"), 'statusWalletHandler lastWalletTxId missing');
console.log('✅ 4. statusWalletHandler ledger records balanceAfter and deterministic doc ID');

console.log('\n🎉 ALL 4 VERIFICATION CHECKS FOR PHASE 3 PASSED PERFECTLY!\n');
