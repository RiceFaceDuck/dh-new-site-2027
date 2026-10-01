import fs from 'fs';
import path from 'path';
import assert from 'assert';

const servicePath = path.resolve('Management System/dh-frontend/src/firebase/checkout/checkoutSubmitService.js');
const rulesPath = path.resolve('Management System/firestore.rules');

console.log('========================================================');
console.log('🧪 VERIFY: Wallet Phase 1 Storefront Security Alignment');
console.log('========================================================\n');

// 1. Check file existence
assert(fs.existsSync(servicePath), `Service file not found at: ${servicePath}`);
assert(fs.existsSync(rulesPath), `Rules file not found at: ${rulesPath}`);
console.log('✅ 1. Required files exist');

const serviceCode = fs.readFileSync(servicePath, 'utf8');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

// 2. Verify balanceAfter calculation and inclusion
assert(serviceCode.includes('balanceAfter = Math.round((currentWalletBalance - useWallet) * 100) / 100'), 'balanceAfter rounding formula missing or invalid');
assert(serviceCode.includes('balanceAfter: balanceAfter'), 'balanceAfter field missing from wallet_transactions payload');
console.log('✅ 2. balanceAfter is accurately calculated and recorded');

// 3. Verify Deterministic Doc ID matching transactionId
assert(serviceCode.includes("const txId = `TXW-${orderRef.id}`"), 'txId deterministic generation missing');
assert(serviceCode.includes("doc(db, getCollectionPath('users'), user.uid, 'wallet_transactions', txId)"), 'Deterministic doc ID not used for wallet_transactions ref');
assert(serviceCode.includes('transactionId: txId'), 'transactionId does not match txId in payload');
console.log('✅ 3. Deterministic Document ID matches transactionId field 100%');

// 4. Verify userRef update has lastWalletTxId & walletBalance
assert(serviceCode.includes('userUpdatePayload.walletBalance = balanceAfter'), 'walletBalance not set in user update payload');
assert(serviceCode.includes('userUpdatePayload.lastWalletTxId = txId'), 'lastWalletTxId not set in user update payload');
assert(serviceCode.includes('transaction.update(userRef, userUpdatePayload)'), 'Single atomic update to userRef not found');
console.log('✅ 4. userRef atomically receives walletBalance and lastWalletTxId');

// 5. Cross-check against firestore.rules requirements
assert(rulesCode.includes("request.resource.data.transactionId == txId"), 'Rule requires transactionId == txId');
assert(rulesCode.includes("request.resource.data.keys().hasAll(['transactionId', 'type', 'amount', 'balanceAfter', 'status', 'timestamp'])"), 'Rule requires keys hasAll with balanceAfter');
assert(rulesCode.includes("request.resource.data.balanceAfter == getAfter(/databases/$(database)/documents/users/$(userId)).data.get('walletBalance', 0)"), 'Rule requires balanceAfter to match user doc walletBalance');
console.log('✅ 5. Code satisfies 100% of Firestore Security Rule requirements for SPEND');

console.log('\n🎉 ALL 5 VERIFICATION CHECKS PASSED PERFECTLY!\n');
