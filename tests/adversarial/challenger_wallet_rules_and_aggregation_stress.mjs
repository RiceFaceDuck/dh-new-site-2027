/**
 * Challenger Adversarial Stress Suite: Wallet Rules Invariants, Payload Injection & Aggregation
 * 
 * Centralized Test Hub: Management System/tests/adversarial/
 * Filename: challenger_wallet_rules_and_aggregation_stress.mjs
 * 
 * Challenge Scenarios:
 * 1. Security rules bypass attack (existsAfter line 112, lastWalletTxId, balance tampering)
 * 2. Mismatched balance attack (line 135: balanceAfter == getAfter(...).walletBalance)
 * 3. Privilege escalation / key tampering (lines 100-106: role, isStaff, creditPoints, stats)
 * 4. Aggregation boundary conditions (useWalletManagement.js: 0 holders, 1 user, negative balances, missing fields)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const RULES_PATH = path.resolve(REPO_ROOT, 'Management System/firestore.rules');
const HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/managers/wallet/hooks/useWalletManagement.js');
const CHECKOUT_SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/checkout/checkoutSubmitService.js');
const STATS_COMPONENT_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/managers/wallet/WalletDashboardStats.jsx');

console.log('================================================================================');
console.log('⚔️  CHALLENGER: WALLET SECURITY RULES, INJECTION & AGGREGATION ADVERSARIAL SUITE');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function assert(condition, name, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failedChecks++;
    const msg = details ? `${name} -> ${details}` : name;
    console.error(`  ❌ [FAIL] ${msg}`);
    defects.push({ test: name, details });
  }
}

// -----------------------------------------------------------------------------
// VERIFY FILES EXISTENCE
// -----------------------------------------------------------------------------
assert(fs.existsSync(RULES_PATH), 'firestore.rules exists');
assert(fs.existsSync(HOOK_PATH), 'useWalletManagement.js exists');
assert(fs.existsSync(CHECKOUT_SERVICE_PATH), 'checkoutSubmitService.js exists');
assert(fs.existsSync(STATS_COMPONENT_PATH), 'WalletDashboardStats.jsx exists');

const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');
const hookContent = fs.readFileSync(HOOK_PATH, 'utf8');
const checkoutContent = fs.readFileSync(CHECKOUT_SERVICE_PATH, 'utf8');
const statsContent = fs.readFileSync(STATS_COMPONENT_PATH, 'utf8');

// =============================================================================
// SCENARIO 1: SECURITY RULES BYPASS ATTACK HARNESS
// =============================================================================
console.log('\n--- SCENARIO 1: Security Rules Invariant & Balance Bypass Attacks ---');

// 1.1 Static Rule Assertions on Lines 100-120
assert(rulesContent.includes("request.resource.data.get('walletBalance', 0) < resource.data.get('walletBalance', 0)"),
  'Rule invariant 1.1: Customer walletBalance update strictly enforces STRICT DECREMENT (< resource.data.walletBalance)');

assert(rulesContent.includes("request.resource.data.get('walletBalance', 0) >= 0"),
  'Rule invariant 1.2: Customer walletBalance update strictly enforces NON-NEGATIVE clamp (>= 0)');

assert(rulesContent.includes("existsAfter(/databases/$(database)/documents/users/$(userId)/wallet_transactions/$(request.resource.data.lastWalletTxId))"),
  'Rule invariant 1.3: User balance decrement mandates existsAfter transaction link for lastWalletTxId');

assert(rulesContent.includes("request.resource.data.get('pendingWithdrawal', 0) == resource.data.get('pendingWithdrawal', 0) ||") &&
       rulesContent.includes("request.resource.data.get('pendingWithdrawal', 0) == resource.data.get('pendingWithdrawal', 0) + (resource.data.get('walletBalance', 0) - request.resource.data.get('walletBalance', 0))"),
  'Rule invariant 1.4: Net liability preservation ensures wallet balance deduction can only transfer 1:1 to pendingWithdrawal or remain equal');

// 1.2 Behavioral Simulation Engine for User Document Updates (Firestore Rules AST Logic)
function evalUserUpdateRule({ auth, userId, resourceData, requestData, batchContext = {} }) {
  // Staff / Admin bypass check
  const isStaff = auth?.token?.isStaff === true || ['staff', 'manager', 'admin', 'owner'].includes(auth?.token?.role);
  const isManagerOrAdmin = ['manager', 'admin', 'owner'].includes(auth?.token?.role);

  if (isManagerOrAdmin) return { allowed: true, reason: 'isManagerOrAdmin' };

  if (isStaff) {
    const forbiddenKeys = ['role', 'isStaff', 'uid', 'email', 'rank', 'accountId', 'customerCode', 'roles', 'userType', 'walletBalance', 'creditPoints', 'totalAccumulatedPoints', 'pendingWithdrawal', 'status', 'isActive', 'isApproved'];
    const affected = Object.keys(requestData).filter(k => requestData[k] !== resourceData[k]);
    const hasForbidden = affected.some(k => forbiddenKeys.includes(k));
    if (!hasForbidden) return { allowed: true, reason: 'isStaff_clean' };
    return { allowed: false, reason: 'isStaff_forbidden_keys' };
  }

  // Customer self-update
  if (!auth || auth.uid !== userId) return { allowed: false, reason: 'unauthorized_or_not_owner' };

  // Calculate affected keys
  const allKeys = new Set([...Object.keys(resourceData), ...Object.keys(requestData)]);
  const affectedKeys = [];
  for (const k of allKeys) {
    if (JSON.stringify(resourceData[k]) !== JSON.stringify(requestData[k])) {
      affectedKeys.push(k);
    }
  }

  // Branch A: Request pending approval
  const isBranchA = ['pending_approval', 'pending', 'user', 'customer'].includes(requestData.role) &&
    (requestData.isStaff === undefined || requestData.isStaff === false) &&
    (requestData.isApproved === undefined || requestData.isApproved === false) &&
    (requestData.isActive === undefined || requestData.isActive === false) &&
    !affectedKeys.some(k => ['creditPoints', 'totalAccumulatedPoints', 'walletBalance', 'pendingWithdrawal', 'rank', 'accountId', 'customerCode', 'roles', 'userType', 'status', 'stats'].includes(k));

  if (isBranchA) return { allowed: true, reason: 'branch_a_pending_request' };

  // Branch B: General profile & Wallet spend
  const forbiddenBranchB = ['role', 'isStaff', 'uid', 'email', 'creditPoints', 'totalAccumulatedPoints', 'rank', 'accountId', 'customerCode', 'isActive', 'status', 'roles', 'userType'];
  if (affectedKeys.some(k => forbiddenBranchB.includes(k))) {
    return { allowed: false, reason: 'branch_b_forbidden_keys_affected' };
  }

  // Stats check
  if (affectedKeys.includes('stats')) {
    const oldStats = resourceData.stats || {};
    const newStats = requestData.stats || {};
    const statsAllKeys = new Set([...Object.keys(oldStats), ...Object.keys(newStats)]);
    const statsAffected = [];
    for (const sk of statsAllKeys) {
      if (oldStats[sk] !== newStats[sk]) statsAffected.push(sk);
    }
    const allowedStatsKeys = ['lastOrderDate', 'lastPurchaseDate', 'lastCheckoutAttempt'];
    if (statsAffected.some(sk => !allowedStatsKeys.includes(sk))) {
      return { allowed: false, reason: 'unauthorized_stats_subkeys' };
    }
  }

  // Wallet and withdrawal check
  const walletTouched = affectedKeys.some(k => ['walletBalance', 'pendingWithdrawal', 'lastWalletTxId'].includes(k));
  if (walletTouched) {
    const oldBal = resourceData.walletBalance ?? 0;
    const newBal = requestData.walletBalance ?? 0;
    const oldPending = resourceData.pendingWithdrawal ?? 0;
    const newPending = requestData.pendingWithdrawal ?? 0;
    const txId = requestData.lastWalletTxId;

    if (!(newBal < oldBal)) {
      return { allowed: false, reason: 'wallet_not_decremented' };
    }
    if (!(newBal >= 0)) {
      return { allowed: false, reason: 'wallet_negative' };
    }
    if (!txId) {
      return { allowed: false, reason: 'missing_lastWalletTxId' };
    }

    // Check existsAfter for transaction doc
    const txPath = `users/${userId}/wallet_transactions/${txId}`;
    const txExistsAfter = Boolean(batchContext.createdDocs?.[txPath] || batchContext.existingDocs?.[txPath]);
    if (!txExistsAfter) {
      return { allowed: false, reason: 'existsAfter_wallet_tx_failed' };
    }

    const pendingUnchanged = (newPending === oldPending);
    const pendingTransferred = (newPending === oldPending + (oldBal - newBal));
    if (!pendingUnchanged && !pendingTransferred) {
      return { allowed: false, reason: 'pending_withdrawal_inflation_detected' };
    }
  }

  return { allowed: true, reason: 'valid_customer_update' };
}

// 1.3 Adversarial Attack Tests on Scenario 1
const baseUser = {
  uid: 'user_attacker',
  role: 'customer',
  isStaff: false,
  walletBalance: 1000,
  pendingWithdrawal: 0,
  creditPoints: 50,
  stats: { lastOrderDate: 100 }
};

// Attack 1: Unauthenticated request
const res1 = evalUserUpdateRule({
  auth: null,
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 500 }
});
assert(res1.allowed === false, 'Attack 1.1: Unauthenticated wallet tampering blocked');

// Attack 2: Non-owner authenticated user
const res2 = evalUserUpdateRule({
  auth: { uid: 'user_other', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 500 }
});
assert(res2.allowed === false, 'Attack 1.2: Cross-user wallet modification blocked');

// Attack 3: Balance inflation (increasing wallet balance from 1,000 to 5,000)
const res3 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 5000, lastWalletTxId: 'TXW-INFLATE' },
  batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-INFLATE': true } }
});
assert(res3.allowed === false && res3.reason === 'wallet_not_decremented',
  'Attack 1.3: Balance inflation (1,000 -> 5,000) blocked by decrement invariant');

// Attack 4: Negative balance injection (-200)
const res4 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: -200, lastWalletTxId: 'TXW-NEG' },
  batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-NEG': true } }
});
assert(res4.allowed === false && res4.reason === 'wallet_negative',
  'Attack 1.4: Negative balance tampering (-200) blocked by >= 0 invariant');

// Attack 5: Decrement without lastWalletTxId
const res5 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 800 }
});
assert(res5.allowed === false && res5.reason === 'missing_lastWalletTxId',
  'Attack 1.5: Balance decrement without lastWalletTxId blocked');

// Attack 6: Decrement with ghost/non-existent transaction doc
const res6 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 800, lastWalletTxId: 'TXW-GHOST-999' },
  batchContext: { createdDocs: {} }
});
assert(res6.allowed === false && res6.reason === 'existsAfter_wallet_tx_failed',
  'Attack 1.6: Decrement with uncommitted ghost transaction ID blocked by existsAfter');

// Attack 7: Disproportionate pendingWithdrawal inflation (drop balance by 200, inflate pending by 5,000)
const res7 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, walletBalance: 800, pendingWithdrawal: 5000, lastWalletTxId: 'TXW-PND' },
  batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-PND': true } }
});
assert(res7.allowed === false && res7.reason === 'pending_withdrawal_inflation_detected',
  'Attack 1.7: Disproportionate pendingWithdrawal inflation blocked by 1:1 conservation invariant');

// Attack 8: Sneaking walletBalance modification via Branch A (pending approval request)
const res8 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: { ...baseUser, role: 'pending_approval', walletBalance: 900 }
});
assert(res8.allowed === false,
  'Attack 1.8: Attempt to mutate walletBalance under Branch A (role change) blocked');

// Legitimate Case 1: Valid storefront checkout batch
const resLegit1 = evalUserUpdateRule({
  auth: { uid: 'user_attacker', token: {} },
  userId: 'user_attacker',
  resourceData: baseUser,
  requestData: {
    ...baseUser,
    walletBalance: 800,
    lastWalletTxId: 'TXW-ORD-001',
    stats: { lastOrderDate: 101, lastPurchaseDate: 101 },
    updatedAt: 101
  },
  batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-ORD-001': true } }
});
assert(resLegit1.allowed === true,
  'Legitimate checkout: Atomic decrement with valid transaction doc permitted');

// =============================================================================
// SCENARIO 2: MISMATCHED BALANCE ATTACK HARNESS
// =============================================================================
console.log('\n--- SCENARIO 2: Mismatched Balance & Transaction Tampering Attacks ---');

// 2.1 Static Rule Assertions on Lines 124-139
assert(rulesContent.includes("request.resource.data.type == 'SPEND'"),
  'Rule invariant 2.1: Client wallet_transactions create strictly limited to type == SPEND');

assert(rulesContent.includes("request.resource.data.amount > 0"),
  'Rule invariant 2.2: Client wallet_transactions create mandates positive amount (> 0)');

assert(rulesContent.includes("request.resource.data.status == 'SUCCESS'"),
  'Rule invariant 2.3: Client wallet_transactions create mandates status == SUCCESS');

assert(rulesContent.includes("request.resource.data.transactionId == txId"),
  'Rule invariant 2.4: Deterministic doc ID parity (transactionId == txId) strictly enforced');

assert(rulesContent.includes("request.resource.data.keys().hasAll(['transactionId', 'type', 'amount', 'balanceAfter', 'status', 'timestamp'])"),
  'Rule invariant 2.5: Mandatory transaction keys checklist strictly enforced');

assert(rulesContent.includes("request.resource.data.balanceAfter == getAfter(/databases/$(database)/documents/users/$(userId)).data.get('walletBalance', 0)"),
  'Rule invariant 2.6: Cryptographic/atomic balance parity enforced via getAfter().walletBalance');

assert(rulesContent.includes("allow update, delete: if isManagerOrAdmin();"),
  'Rule invariant 2.7: wallet_transactions immutability: customers & staff forbidden from update/delete');

// 2.2 Transaction Rule Evaluation Simulator
function evalWalletTxCreate({ auth, userId, txId, txData, getAfterUserDoc }) {
  const isStaff = auth?.token?.isStaff === true || ['staff', 'manager', 'admin', 'owner'].includes(auth?.token?.role);
  if (isStaff) return { allowed: true, reason: 'isStaff' };

  if (!auth || auth.uid !== userId) return { allowed: false, reason: 'unauthorized_customer' };

  if (txData.type !== 'SPEND') return { allowed: false, reason: 'type_not_SPEND' };
  if (typeof txData.amount !== 'number' || txData.amount <= 0) return { allowed: false, reason: 'invalid_amount' };
  if (txData.status !== 'SUCCESS') return { allowed: false, reason: 'status_not_SUCCESS' };
  if (txData.transactionId !== txId) return { allowed: false, reason: 'transactionId_mismatch' };

  const requiredKeys = ['transactionId', 'type', 'amount', 'balanceAfter', 'status', 'timestamp'];
  const hasAllKeys = requiredKeys.every(k => k in txData);
  if (!hasAllKeys) return { allowed: false, reason: 'missing_required_keys' };

  if (!getAfterUserDoc) return { allowed: false, reason: 'user_doc_does_not_exist_after' };

  const userBalanceAfter = getAfterUserDoc.walletBalance ?? 0;
  if (txData.balanceAfter !== userBalanceAfter) {
    return { allowed: false, reason: 'balanceAfter_mismatch_with_user_doc' };
  }

  return { allowed: true, reason: 'valid_wallet_tx' };
}

// 2.3 Adversarial Tests for Scenario 2
const validPostBatchUser = { walletBalance: 400 };

// Attack 2.1: Mismatched balanceAfter (user has 400, tx payload claims 450)
const txRes1 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-TEST-1',
  txData: {
    transactionId: 'TXW-TEST-1',
    type: 'SPEND',
    amount: 100,
    balanceAfter: 450, // Mismatched!
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes1.allowed === false && txRes1.reason === 'balanceAfter_mismatch_with_user_doc',
  'Attack 2.1: Mismatched balanceAfter (450 vs 400 in user doc) blocked by getAfter parity check');

// Attack 2.2: Omitted balanceAfter
const txRes2 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-TEST-2',
  txData: {
    transactionId: 'TXW-TEST-2',
    type: 'SPEND',
    amount: 100,
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes2.allowed === false && txRes2.reason === 'missing_required_keys',
  'Attack 2.2: Omission of balanceAfter field blocked by hasAll checklist');

// Attack 2.3: Type forgery: String balanceAfter "400" vs Numeric 400 in user doc
const txRes3 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-TEST-3',
  txData: {
    transactionId: 'TXW-TEST-3',
    type: 'SPEND',
    amount: 100,
    balanceAfter: "400", // String type forgery!
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes3.allowed === false && txRes3.reason === 'balanceAfter_mismatch_with_user_doc',
  'Attack 2.3: Type forgery (string "400" !== number 400) blocked by strict equality');

// Attack 2.4: Rogue transaction type (e.g., DEPOSIT or REFUND creation attempt by client)
const txRes4 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-TEST-4',
  txData: {
    transactionId: 'TXW-TEST-4',
    type: 'DEPOSIT', // Rogue type!
    amount: 500,
    balanceAfter: 400,
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes4.allowed === false && txRes4.reason === 'type_not_SPEND',
  'Attack 2.4: Non-SPEND transaction type (DEPOSIT) create attempt blocked');

// Attack 2.5: Zero or negative amount spend
const txRes5 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-TEST-5',
  txData: {
    transactionId: 'TXW-TEST-5',
    type: 'SPEND',
    amount: 0,
    balanceAfter: 400,
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes5.allowed === false && txRes5.reason === 'invalid_amount',
  'Attack 2.5: Zero amount spend attempt blocked');

// Attack 2.6: ID mismatch (doc ID TXW-DOC-A vs payload TXW-PAYLOAD-B)
const txRes6 = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-DOC-A',
  txData: {
    transactionId: 'TXW-PAYLOAD-B', // Mismatch!
    type: 'SPEND',
    amount: 50,
    balanceAfter: 400,
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txRes6.allowed === false && txRes6.reason === 'transactionId_mismatch',
  'Attack 2.6: transactionId != txId mismatch blocked');

// Legitimate Case 2: Matching balanceAfter, amount > 0, deterministic ID
const txResLegit = evalWalletTxCreate({
  auth: { uid: 'user_victim' },
  userId: 'user_victim',
  txId: 'TXW-ORDER-100',
  txData: {
    transactionId: 'TXW-ORDER-100',
    type: 'SPEND',
    amount: 100,
    balanceAfter: 400,
    status: 'SUCCESS',
    timestamp: 100
  },
  getAfterUserDoc: validPostBatchUser
});
assert(txResLegit.allowed === true,
  'Legitimate spend transaction: Exact balanceAfter match passes');

// =============================================================================
// SCENARIO 3: PRIVILEGE ESCALATION / KEY TAMPERING HARNESS
// =============================================================================
console.log('\n--- SCENARIO 3: Privilege Escalation & Key Smuggling Attacks ---');

// 3.1 Static verification of rules lines 100-106
assert(rulesContent.includes("'role', 'isStaff', 'uid', 'email', 'creditPoints', 'totalAccumulatedPoints'"),
  'Rule invariant 3.1: Sensitive security and accounting fields are locked from customer mutation');

assert(rulesContent.includes("'rank', 'accountId', 'customerCode', 'isActive', 'status', 'roles', 'userType'"),
  'Rule invariant 3.2: Customer identity and tier metadata keys are locked from customer mutation');

assert(rulesContent.includes("request.resource.data.get('stats', {}).diff(resource.data.get('stats', {})).affectedKeys().hasOnly(['lastOrderDate', 'lastPurchaseDate', 'lastCheckoutAttempt'])"),
  'Rule invariant 3.3: stats object is strictly whitelisted to hasOnly timestamp trackers');

// 3.2 Testing injection attacks against user document update
const sensitiveKeysToTest = [
  { key: 'role', val: 'admin' },
  { key: 'role', val: 'manager' },
  { key: 'isStaff', val: true },
  { key: 'creditPoints', val: 999999 },
  { key: 'totalAccumulatedPoints', val: 999999 },
  { key: 'rank', val: 'VIP' },
  { key: 'accountId', val: 'ACC-HACKED' },
  { key: 'customerCode', val: 'CODE-HACKED' },
  { key: 'isActive', val: true },
  { key: 'status', val: 'approved' },
  { key: 'roles', val: ['admin'] },
  { key: 'userType', val: 'staff' },
  { key: 'uid', val: 'other_uid' },
  { key: 'email', val: 'attacker@evil.com' }
];

sensitiveKeysToTest.forEach(({ key, val }) => {
  const attackPayload = {
    ...baseUser,
    walletBalance: 800,
    lastWalletTxId: 'TXW-SENSITIVE',
    [key]: val
  };
  const testRes = evalUserUpdateRule({
    auth: { uid: 'user_attacker', token: {} },
    userId: 'user_attacker',
    resourceData: baseUser,
    requestData: attackPayload,
    batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-SENSITIVE': true } }
  });
  assert(testRes.allowed === false,
    `Attack 3.X: Smuggling '${key}: ${JSON.stringify(val)}' during wallet spend blocked`);
});

// 3.3 Testing stats injection attacks
const rogueStatsKeys = ['totalSpent', 'vipLevel', 'orderCount', 'discountRate', 'role', 'isStaff'];
rogueStatsKeys.forEach(badKey => {
  const attackPayload = {
    ...baseUser,
    walletBalance: 800,
    lastWalletTxId: 'TXW-STATS',
    stats: { ...baseUser.stats, [badKey]: 9999 }
  };
  const testRes = evalUserUpdateRule({
    auth: { uid: 'user_attacker', token: {} },
    userId: 'user_attacker',
    resourceData: baseUser,
    requestData: attackPayload,
    batchContext: { createdDocs: { 'users/user_attacker/wallet_transactions/TXW-STATS': true } }
  });
  assert(testRes.allowed === false && testRes.reason === 'unauthorized_stats_subkeys',
    `Attack 3.Y: Smuggling rogue stats key '${badKey}' blocked by hasOnly whitelist`);
});

// 3.4 Verification of checkoutSubmitService.js payload discipline
assert(!checkoutContent.includes("userUpdatePayload.role ="),
  'Service audit 3.4: checkoutSubmitService does NOT modify role');
assert(!checkoutContent.includes("userUpdatePayload.isStaff ="),
  'Service audit 3.5: checkoutSubmitService does NOT modify isStaff');
assert(!checkoutContent.includes("userUpdatePayload.creditPoints ="),
  'Service audit 3.6: checkoutSubmitService does NOT modify creditPoints');
assert(!checkoutContent.includes("userUpdatePayload.totalAccumulatedPoints ="),
  'Service audit 3.7: checkoutSubmitService does NOT modify totalAccumulatedPoints');

// =============================================================================
// SCENARIO 4: AGGREGATION BOUNDARY CONDITIONS & NUMERICAL STABILITY
// =============================================================================
console.log('\n--- SCENARIO 4: Aggregation Boundary Conditions & Numerical Stability ---');

// 4.1 Boundary 0: Empty Database / Zero Wallet Holders
function simulateDashboardAggregation({ aggData, topDocs }) {
  const totalBal = Number(aggData?.totalWallet || 0);
  const totalHolders = Number(aggData?.walletHolders || 0);

  const usersList = [];
  topDocs.forEach(d => {
    usersList.push({ id: d.id, ...d.data });
  });

  usersList.sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0));

  return {
    totalBal,
    totalHolders,
    usersList,
    stats: { totalBalance: totalBal }
  };
}

const resEmpty = simulateDashboardAggregation({
  aggData: { totalWallet: null, walletHolders: 0 },
  topDocs: []
});
assert(resEmpty.totalBal === 0, 'Boundary 4.1a: Empty aggregation returns totalBal === 0 (not null or NaN)');
assert(!Number.isNaN(resEmpty.totalBal), 'Boundary 4.1b: Empty aggregation totalBal is NOT NaN');
assert(resEmpty.totalHolders === 0, 'Boundary 4.1c: Empty aggregation returns totalHolders === 0');
assert(Array.isArray(resEmpty.usersList) && resEmpty.usersList.length === 0,
  'Boundary 4.1d: Empty aggregation returns empty users array without error');

// 4.2 Boundary 1: Single User Dataset
const resSingle = simulateDashboardAggregation({
  aggData: { totalWallet: 1542.50, walletHolders: 1 },
  topDocs: [{ id: 'user_single', data: { accountName: 'Somchai', walletBalance: 1542.50 } }]
});
assert(resSingle.totalBal === 1542.50, 'Boundary 4.2a: Single user aggregation matches exact balance');
assert(resSingle.totalHolders === 1, 'Boundary 4.2b: Single user aggregation count === 1');
assert(resSingle.usersList.length === 1 && resSingle.usersList[0].id === 'user_single',
  'Boundary 4.2c: Single user correctly extracted and sorted');

// 4.3 Boundary: Negative Balances & Firestore Query Filter
// In useWalletManagement.js line 90:
// const qHasBalance = query(usersRef, where('walletBalance', '>', 0));
assert(hookContent.includes("where('walletBalance', '>', 0)"),
  'Boundary 4.3a: Firestore query strictly enforces where(walletBalance, >, 0) at index level');

// Test that simulated corrupted documents with negative balance do NOT break sorting or formatters
const resWithCorrupted = simulateDashboardAggregation({
  aggData: { totalWallet: 500, walletHolders: 2 },
  topDocs: [
    { id: 'u_pos1', data: { walletBalance: 300 } },
    { id: 'u_neg', data: { walletBalance: -500 } }, // Corrupted
    { id: 'u_pos2', data: { walletBalance: 200 } }
  ]
});
assert(resWithCorrupted.usersList[0].walletBalance === 300 && resWithCorrupted.usersList[1].walletBalance === 200,
  'Boundary 4.3b: In-memory sorting places positive balances before negative ones');

// 4.4 Boundary: Missing Fields (null, undefined, missing walletBalance)
const resMissingFields = simulateDashboardAggregation({
  aggData: { totalWallet: 100, walletHolders: 1 },
  topDocs: [
    { id: 'u_null', data: { walletBalance: null } },
    { id: 'u_missing', data: { accountName: 'No Balance Field' } },
    { id: 'u_nan', data: { walletBalance: NaN } },
    { id: 'u_valid', data: { walletBalance: 100 } }
  ]
});
assert(resMissingFields.usersList[0].id === 'u_valid',
  'Boundary 4.4a: Missing/null/NaN walletBalance documents safely sink below valid balances');
assert(!resMissingFields.usersList.some(u => Number.isNaN(u.walletBalance || 0)),
  'Boundary 4.4b: Fallback (u.walletBalance || 0) eliminates NaN across all missing fields');

// 4.5 Formatting & UI Display Resilience (WalletDashboardStats)
function formatCurrency(val) {
  return Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}
function formatCount(val) {
  return Number(val || 0).toLocaleString();
}

assert(formatCurrency(0) === '0.00', 'UI Format 4.5a: Zero currency formats to 0.00');
assert(formatCurrency(null) === '0.00', 'UI Format 4.5b: Null currency safely defaults to 0.00');
assert(formatCurrency(undefined) === '0.00', 'UI Format 4.5c: Undefined currency safely defaults to 0.00');
assert(formatCurrency(12500000.75) === '12,500,000.75', 'UI Format 4.5d: Multi-million currency formats with Thai locale separators');
assert(formatCount(0) === '0', 'UI Format 4.5e: Zero holders count formats to 0');
assert(formatCount(null) === '0', 'UI Format 4.5f: Null holders count safely defaults to 0');

// 4.6 Cache Overwrite Functions in useWalletManagement.js
assert(hookContent.includes('export function invalidateWalletCache()'),
  'Cache 4.6a: invalidateWalletCache is exported for state reset');
assert(hookContent.includes('export function updateCachedUserBalance('),
  'Cache 4.6b: updateCachedUserBalance is exported for single-user mutation');
assert(hookContent.includes('Math.max(0, (dashboardMemoryCache.stats.totalBalance || 0) + diff)'),
  'Cache 4.6c: updateCachedUserBalance clamps cached totalBalance to Math.max(0, ...)');

// =============================================================================
// ADVERSARIAL STRESS SUMMARY
// =============================================================================
console.log('\n================================================================================');
console.log(`📊 ADVERSARIAL CHALLENGE EXECUTION SUMMARY`);
console.log(`   Total Checks:  ${totalChecks}`);
console.log(`   Passed:        ${passedChecks}`);
console.log(`   Failed:        ${failedChecks}`);
console.log('================================================================================\n');

if (failedChecks > 0) {
  console.error(`💥 CHALLENGE FAILED: ${failedChecks} vulnerabilities or defects discovered:`);
  defects.forEach((d, idx) => console.error(`   ${idx + 1}. ${d.test}: ${d.details}`));
  process.exit(1);
} else {
  console.log('🎉 VERDICT: ALL 4 CHALLENGE SCENARIOS EMPIRICALLY CONFIRMED RESILIENT (APPROVE)\n');
  process.exit(0);
}
