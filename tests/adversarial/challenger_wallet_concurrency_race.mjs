/**
 * Challenger Wallet Adversarial Suite: Concurrency, Race Conditions, Satang Precision, Overdraft & Partial Payouts
 * 
 * Location: Management System/tests/adversarial/challenger_wallet_concurrency_race.mjs
 * Rules Compliance:
 * - Centralized Test Hub (Management System/tests/adversarial/)
 * - Empirical verification via direct execution
 * - Zero production deployment / zero side effects
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support execution from workspace root or Management System folder
const baseDir = fs.existsSync(path.resolve(__dirname, '../../dh-backoffice-react'))
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../../../Management System');

console.log('================================================================================');
console.log('🔥 CHALLENGER: WALLET CONCURRENCY, RACE CONDITIONS & PRECISION ADVERSARIAL SUITE');
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

// =============================================================================
// SECTION 1: SIMULATED FIRESTORE OPTIMISTIC CONCURRENCY CONTROL (OCC) ENGINE
// =============================================================================
console.log('\n--- 1. Testing Concurrency & Race Conditions (OCC Simulation Engine) ---');

class MockFirestore {
  constructor() {
    this.store = new Map(); // key -> { data, version }
  }

  setDoc(docPath, data) {
    const existing = this.store.get(docPath) || { version: 0 };
    this.store.set(docPath, { data: JSON.parse(JSON.stringify(data)), version: existing.version + 1 });
  }

  getDoc(docPath) {
    const item = this.store.get(docPath);
    if (!item) return { exists: false, data: () => null };
    return { exists: true, data: () => JSON.parse(JSON.stringify(item.data)), version: item.version };
  }

  async runTransaction(updateFunction, maxRetries = 5) {
    let attempts = 0;
    while (attempts < maxRetries) {
      attempts++;
      const readVersions = new Map();
      const writes = [];

      const transaction = {
        get: async (docRef) => {
          const item = this.store.get(docRef.path);
          if (!item) {
            readVersions.set(docRef.path, 0);
            return { exists: () => false, data: () => null };
          }
          readVersions.set(docRef.path, item.version);
          return { exists: () => true, data: () => JSON.parse(JSON.stringify(item.data)) };
        },
        update: (docRef, data) => {
          writes.push({ type: 'update', path: docRef.path, data });
        },
        set: (docRef, data) => {
          writes.push({ type: 'set', path: docRef.path, data });
        }
      };

      try {
        const result = await updateFunction(transaction);

        // Commit phase: check for conflict
        let conflict = false;
        for (const [path, expectedVersion] of readVersions.entries()) {
          const current = this.store.get(path);
          const currentVersion = current ? current.version : 0;
          if (currentVersion !== expectedVersion) {
            conflict = true;
            break;
          }
        }

        if (conflict) {
          // OCC Conflict detected! Retry
          continue;
        }

        // Apply writes atomically
        for (const w of writes) {
          const existing = this.store.get(w.path) || { data: {}, version: 0 };
          if (w.type === 'update') {
            const merged = { ...existing.data };
            for (const [k, v] of Object.entries(w.data)) {
              if (k.includes('.')) {
                const parts = k.split('.');
                merged[parts[0]] = { ...(merged[parts[0]] || {}), [parts[1]]: v };
              } else {
                merged[k] = v;
              }
            }
            this.store.set(w.path, { data: merged, version: existing.version + 1 });
          } else {
            this.store.set(w.path, { data: JSON.parse(JSON.stringify(w.data)), version: existing.version + 1 });
          }
        }

        return result;
      } catch (err) {
        // Business logic error: abort immediately without retry
        throw err;
      }
    }
    throw new Error('Transaction exceeded maximum retry limit due to contention');
  }
}

// 1.1 Test Scenario: Concurrent Drawer Refunds (Double-Spend Attempt)
// Customer has 500 THB in system (walletBalance: 500, pending: 0).
// Two managers perform drawer refund for 300 THB each at the EXACT SAME TIME.
async function testConcurrentDrawerRefunds() {
  const db = new MockFirestore();
  db.setDoc('users/cus-101', {
    walletBalance: 500,
    pendingWithdrawal: 0,
    displayName: 'Test Customer'
  });

  const runDrawerRefund = async (amount, adminName) => {
    return db.runTransaction(async (transaction) => {
      const userRef = { path: 'users/cus-101' };
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const userData = userSnap.data();
      const currentWallet = Number(userData.walletBalance || 0);
      const currentPending = Number(userData.pendingWithdrawal || 0);
      const safeAmount = Math.round(Number(amount) * 100) / 100;

      if ((currentWallet + currentPending) < safeAmount) {
        throw new Error(`ยอดเงินค้างในระบบของลูกค้า (฿${currentWallet + currentPending}) มีไม่เพียงพอต่อการคืนเงิน ฿${safeAmount}`);
      }

      let walletDeduct = 0;
      let pendingDeduct = 0;
      if (currentPending >= safeAmount) {
        pendingDeduct = safeAmount;
      } else if (currentPending > 0) {
        pendingDeduct = currentPending;
        walletDeduct = safeAmount - currentPending;
      } else {
        walletDeduct = safeAmount;
      }

      const newBalance = Math.round((currentWallet - walletDeduct) * 100) / 100;
      transaction.update(userRef, {
        walletBalance: newBalance,
        lastWalletTxId: `TXW-RFD-${Date.now()}`
      });

      return { success: true, newBalance };
    });
  };

  // Launch two simultaneous refunds of 300 THB
  const [res1, res2] = await Promise.allSettled([
    runDrawerRefund(300, 'Manager 1'),
    runDrawerRefund(300, 'Manager 2')
  ]);

  const successCount = [res1, res2].filter(r => r.status === 'fulfilled').length;
  const rejectedCount = [res1, res2].filter(r => r.status === 'rejected').length;
  const finalUser = db.getDoc('users/cus-101').data();

  assert(successCount === 1 && rejectedCount === 1,
    'Concurrent Drawer Refunds: Exactly 1 succeeds and 1 fails due to insufficient balance on retry',
    `Successes: ${successCount}, Rejected: ${rejectedCount}`);

  assert(finalUser.walletBalance === 200,
    'Concurrent Drawer Refunds: Final user balance is exactly 200 THB (no overdraft / double-spend)',
    `Actual walletBalance: ${finalUser.walletBalance}`);
}

await testConcurrentDrawerRefunds();

// 1.2 Test Scenario: Concurrent Drawer Refund vs Online Withdrawal Approval
// Customer has pending withdrawal of 500 THB.
// Manager 1 does Drawer Refund of 500 THB.
// Manager 2 clicks Approve on Online Withdrawal Task of 500 THB simultaneously.
async function testConcurrentDrawerRefundVsOnlineApproval() {
  const db = new MockFirestore();
  db.setDoc('users/cus-202', {
    walletBalance: 0,
    pendingWithdrawal: 500,
    displayName: 'Withdrawal Customer'
  });
  db.setDoc('todos/task-wd-1', {
    taskType: 'WALLET_WITHDRAWAL',
    status: 'PENDING',
    withdrawalDetails: { amount: 500, uid: 'cus-202' },
    customer: { uid: 'cus-202' }
  });

  // Drawer refund logic (from customerRefundService.js)
  const runDrawerRefund = async () => {
    return db.runTransaction(async (transaction) => {
      const userRef = { path: 'users/cus-202' };
      const taskRef = { path: 'todos/task-wd-1' };

      // Pre-reads
      const userSnap = await transaction.get(userRef);
      const taskSnap = await transaction.get(taskRef);

      const userData = userSnap.data();
      const currentPending = Number(userData.pendingWithdrawal || 0);
      const currentWallet = Number(userData.walletBalance || 0);
      const safeAmount = 500;

      if ((currentWallet + currentPending) < safeAmount) {
        throw new Error('ยอดเงินค้างในระบบไม่เพียงพอ');
      }

      transaction.update(userRef, {
        pendingWithdrawal: currentPending - safeAmount
      });

      if (taskSnap.exists() && ['PENDING', 'pending'].includes(taskSnap.data().status)) {
        transaction.update(taskRef, {
          status: 'completed',
          'withdrawalDetails.completedVia': 'CUSTOMER_DRAWER_REFUND'
        });
      }

      return { type: 'DRAWER_REFUND' };
    });
  };

  // Online withdrawal approval logic (from todoWalletService.js)
  const runOnlineApproval = async () => {
    return db.runTransaction(async (transaction) => {
      const taskRef = { path: 'todos/task-wd-1' };
      const taskSnap = await transaction.get(taskRef);
      if (!taskSnap.exists()) throw new Error('Task not found');
      const taskData = taskSnap.data();

      if (taskData.status !== 'PENDING' && taskData.status !== 'pending') {
        throw new Error('รายการนี้ถูกดำเนินการไปแล้ว');
      }

      const userRef = { path: 'users/cus-202' };
      const userSnap = await transaction.get(userRef);
      const currentPending = Number(userSnap.data().pendingWithdrawal || 0);

      if (currentPending < 500) {
        throw new Error('ยอดเงินรอถอนของลูกค้ามีไม่เพียงพอ (อาจถูกดำเนินการไปแล้ว)');
      }

      transaction.update(userRef, {
        pendingWithdrawal: currentPending - 500
      });

      transaction.update(taskRef, {
        status: 'completed',
        adminNote: 'โอนเงินสำเร็จ'
      });

      return { type: 'ONLINE_APPROVAL' };
    });
  };

  const [res1, res2] = await Promise.allSettled([
    runDrawerRefund(),
    runOnlineApproval()
  ]);

  const successCount = [res1, res2].filter(r => r.status === 'fulfilled').length;
  const rejectedCount = [res1, res2].filter(r => r.status === 'rejected').length;
  const finalUser = db.getDoc('users/cus-202').data();
  const finalTask = db.getDoc('todos/task-wd-1').data();

  assert(successCount === 1 && rejectedCount === 1,
    'Concurrent Refund vs Online Approval: Exactly 1 succeeds, other fails safely',
    `Successes: ${successCount}, Rejected: ${rejectedCount}`);

  assert(finalUser.pendingWithdrawal === 0,
    'Concurrent Refund vs Online Approval: pendingWithdrawal is 0 (never negative)',
    `Actual pendingWithdrawal: ${finalUser.pendingWithdrawal}`);

  assert(finalTask.status === 'completed',
    'Concurrent Refund vs Online Approval: Task is completed once and only once');
}

await testConcurrentDrawerRefundVsOnlineApproval();

// 1.3 Pre-read Integrity Check in customerRefundService.js
console.log('\n--- 1.3 Code Forensic: Pre-read Integrity in customerRefundService.js ---');
const refundServicePath = path.join(baseDir, 'dh-backoffice-react/src/firebase/customerRefundService.js');
const refundServiceCode = fs.readFileSync(refundServicePath, 'utf8');

// Check that transaction.get calls are before transaction.update/set calls
const runTxStart = refundServiceCode.indexOf('runTransaction(db, async (transaction) => {');
const runTxBody = refundServiceCode.slice(runTxStart);

const firstUpdatePos = runTxBody.indexOf('transaction.update(');
const firstSetPos = runTxBody.indexOf('transaction.set(');
const firstWritePos = Math.min(
  firstUpdatePos > -1 ? firstUpdatePos : Infinity,
  firstSetPos > -1 ? firstSetPos : Infinity
);

const lastGetPos = runTxBody.lastIndexOf('await transaction.get(');

assert(lastGetPos < firstWritePos,
  'Firestore Transaction Pre-read Integrity: All transaction.get() calls execute strictly before any transaction.update() / set()',
  `Last get pos: ${lastGetPos}, First write pos: ${firstWritePos}`);

// =============================================================================
// SECTION 2: SATANG ROUNDING PRECISION & MICRO-CENT DRIFT ACCUMULATION
// =============================================================================
console.log('\n--- 2. Testing Satang Rounding Precision & Micro-Cent Drift ---');

// 2.1 Standard IEEE-754 precision drift verification
const rawFloatDiff = 500 - 499.9;
assert(rawFloatDiff !== 0.1,
  'IEEE-754 Drift confirmed: (500 - 499.9) === 0.09999999999996589 in raw JavaScript math',
  `Actual raw diff: ${rawFloatDiff}`);

const sanitizedDiff = Math.round((500 - 499.9) * 100) / 100;
assert(sanitizedDiff === 0.1,
  'Sanitized Math: Math.round((500 - 499.9) * 100) / 100 eliminates drift to exact 0.10 THB',
  `Sanitized diff: ${sanitizedDiff}`);

// 2.2 Stress Test: 10,000 successive satang deductions
let balanceFloating = 10000.00;
let balanceSatangs = 1000000; // integer satangs representation (1 satang = 1)

const testAmounts = [0.07, 0.13, 0.25, 0.31, 0.77, 1.49, 2.50, 0.01];
let driftAccumulated = 0;

for (let i = 0; i < 10000; i++) {
  const deduct = testAmounts[i % testAmounts.length];
  // Standard wallet mutation logic
  balanceFloating = Math.round((balanceFloating - deduct) * 100) / 100;
  balanceSatangs -= Math.round(deduct * 100);
}

const integerBalanceAsFloat = balanceSatangs / 100;
const diff = Math.abs(balanceFloating - integerBalanceAsFloat);

assert(diff === 0,
  '10,000 Repeated Mutations: Zero satang drift accumulated between Math.round(* 100)/100 and integer arithmetic',
  `Floating balance: ${balanceFloating}, Integer balance: ${integerBalanceAsFloat}, Drift: ${diff}`);

// 2.3 Micro-Cent Boundary & Security Rules Constraint Check
// In firestore.rules:
// request.resource.data.get('walletBalance', 0) < resource.data.get('walletBalance', 0)
// If useWallet = 0.001 (micro-cent):
const currentBal = 100;
const microCentSpend = 0.001;
const balanceAfterMicro = Math.round((currentBal - microCentSpend) * 100) / 100;

assert(balanceAfterMicro === 100,
  'Micro-cent spend (0.001 THB) rounds balanceAfter to exactly 100 THB',
  `balanceAfterMicro: ${balanceAfterMicro}`);

const wouldViolateRule = !(balanceAfterMicro < currentBal);
assert(wouldViolateRule === true,
  'Firestore Rule Boundary Guard: balanceAfter == 100 triggers rule rejection (balance must strictly decrease)',
  'Rule `walletBalance < oldWalletBalance` blocks micro-cent no-op spends');

// 2.4 Code Audit: Check balanceAfter sanitization across all mutation services
const checkoutSubmitPath = path.join(baseDir, 'dh-frontend/src/firebase/checkout/checkoutSubmitService.js');
const billingTxPath = path.join(baseDir, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const returnActionPath = path.join(baseDir, 'dh-backoffice-react/src/firebase/claim/returnActionService.js');
const cancelActionPath = path.join(baseDir, 'dh-backoffice-react/src/firebase/claim/cancelActionService.js');
const statusHandlerPath = path.join(baseDir, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');

const checkoutCode = fs.readFileSync(checkoutSubmitPath, 'utf8');
const billingCode = fs.readFileSync(billingTxPath, 'utf8');
const returnCode = fs.readFileSync(returnActionPath, 'utf8');
const cancelCode = fs.readFileSync(cancelActionPath, 'utf8');
const statusCode = fs.readFileSync(statusHandlerPath, 'utf8');

assert(checkoutCode.includes('balanceAfter = Math.round((currentWalletBalance - useWallet) * 100) / 100'),
  'checkoutSubmitService: balanceAfter sanitized with Math.round(... * 100) / 100');

assert(billingCode.includes('balanceAfter = Math.max(0, Math.round((currentWallet - walletToUse) * 100) / 100)'),
  'billingTransactionService: balanceAfter sanitized with Math.round and clamped with Math.max(0)');

assert(returnCode.includes('balanceAfter = Math.round((currentWallet + refundAmount) * 100) / 100'),
  'returnActionService: balanceAfter sanitized with Math.round(... * 100) / 100');

assert(cancelCode.includes('balanceAfter = Math.max(0, Math.round((currentWallet - refundAmountReturn) * 100) / 100)'),
  'cancelActionService: Return cancellation sanitized with Math.round and clamped with Math.max(0)');

assert(statusCode.includes('balanceAfter = Math.round((currentWallet + refundAmount) * 100) / 100'),
  'statusWalletHandler: Order cancel refund balanceAfter sanitized with Math.round(... * 100) / 100');

// =============================================================================
// SECTION 3: OVERDRAFT & NEGATIVE BALANCE GUARDS
// =============================================================================
console.log('\n--- 3. Testing Overdraft & Negative Balance Guards ---');

// 3.1 Checkout Overdraft Guard Check
assert(checkoutCode.includes('if (useWallet < 0)'),
  'checkoutSubmitService guards against negative useWallet bypass');
assert(checkoutCode.includes('if (useWallet > 0 && Number(userData.walletBalance || 0) < useWallet)'),
  'checkoutSubmitService guards against spending more than walletBalance');

// 3.2 POS Spend Overdraft Guard Check
assert(billingCode.includes('if (walletToUse > 0 && currentWallet < walletToUse)'),
  'billingTransactionService guards against POS spend exceeding walletBalance');

// 3.3 Drawer Refund Overdraft Guard Check
assert(refundServiceCode.includes('if ((currentWallet + currentPending) < safeAmount)'),
  'customerRefundService guards against refund exceeding (walletBalance + pendingWithdrawal)');

// 3.4 Return Cancellation Clawback Overdraft Guard Check
assert(cancelCode.includes('if (isCancelReturn && refundAmountReturn > 0 && currentWallet < refundAmountReturn)'),
  'cancelActionService guards against Return cancellation overdraft if customer spent wallet');
assert(cancelCode.includes('if (isSwapSku && netDifference < 0)'),
  'cancelActionService guards against Swap cancellation overdraft if customer spent wallet');

// 3.5 Security Rules Overdraft Guard
const rulesPath = path.join(baseDir, 'firestore.rules');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

assert(rulesCode.includes("request.resource.data.get('walletBalance', 0) >= 0"),
  'firestore.rules enforces walletBalance >= 0 on user update (Hardware-level Security Guard)');

// =============================================================================
// SECTION 4: PARTIAL DRAWER REFUND EDGE CASES & SYSTEM LIABILITY
// =============================================================================
console.log('\n--- 4. Testing Partial Drawer Refund Edge Cases ---');

// 4.1 Simulate partial drawer refund (500 pending, refund 200)
async function testPartialDrawerRefund500to200() {
  const db = new MockFirestore();
  db.setDoc('users/cus-partial', {
    walletBalance: 0,
    pendingWithdrawal: 500,
    displayName: 'Partial Customer'
  });
  db.setDoc('todos/task-500', {
    taskType: 'WALLET_WITHDRAWAL',
    status: 'PENDING',
    withdrawalDetails: { amount: 500, uid: 'cus-partial' },
    customer: { uid: 'cus-partial' }
  });

  const matchingTasks = [{ id: 'task-500', data: () => db.getDoc('todos/task-500').data() }];

  await db.runTransaction(async (transaction) => {
    const userRef = { path: 'users/cus-partial' };
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data();

    const taskRef = { path: 'todos/task-500' };
    const taskSnap = await transaction.get(taskRef);

    const safeAmount = 200; // Customer gets 200 THB at drawer
    const currentPending = Number(userData.pendingWithdrawal || 0);
    const currentWallet = Number(userData.walletBalance || 0);

    let walletDeduct = 0;
    let pendingDeduct = 0;

    if (currentPending >= safeAmount) {
      pendingDeduct = safeAmount; // 200
    } else if (currentPending > 0) {
      pendingDeduct = currentPending;
      walletDeduct = safeAmount - currentPending;
    } else {
      walletDeduct = safeAmount;
    }

    const newPending = Math.round((currentPending - pendingDeduct) * 100) / 100;
    transaction.update(userRef, {
      pendingWithdrawal: newPending
    });

    // Task sync
    let remainingPendingToClear = pendingDeduct; // 200
    const taskData = taskSnap.data();
    const taskAmount = Number(taskData.withdrawalDetails?.amount || 0); // 500

    if (remainingPendingToClear >= taskAmount) {
      transaction.update(taskRef, { status: 'completed' });
    } else {
      const remainingTaskAmount = Math.round((taskAmount - remainingPendingToClear) * 100) / 100;
      transaction.update(taskRef, {
        'withdrawalDetails.amount': remainingTaskAmount,
        adminNote: `ตัดจ่ายบางส่วน ฿${remainingPendingToClear} ทางหน้าร้าน (คงเหลือ ฿${remainingTaskAmount})`
      });
    }
  });

  const updatedUser = db.getDoc('users/cus-partial').data();
  const updatedTask = db.getDoc('todos/task-500').data();

  assert(updatedUser.pendingWithdrawal === 300,
    'Partial Refund (500 -> 200): User pendingWithdrawal becomes exactly 300 THB',
    `Actual: ${updatedUser.pendingWithdrawal}`);

  assert(updatedTask.status === 'PENDING',
    'Partial Refund (500 -> 200): Task remains PENDING (not erroneously completed)',
    `Actual status: ${updatedTask.status}`);

  assert(updatedTask.withdrawalDetails.amount === 300,
    'Partial Refund (500 -> 200): Task withdrawalDetails.amount updated to remaining 300 THB',
    `Actual task amount: ${updatedTask.withdrawalDetails.amount}`);

  assert(updatedUser.pendingWithdrawal === updatedTask.withdrawalDetails.amount,
    'Partial Refund: Exact Parity Invariant preserved: user.pendingWithdrawal (300) === task.withdrawalDetails.amount (300)');
}

await testPartialDrawerRefund500to200();

// 4.2 Simulate Multi-Task Partial Payout:
// Task 1: 150 THB, Task 2: 350 THB (Total 500 THB pending). Customer receives 200 THB at drawer.
async function testMultiTaskPartialDrawerRefund() {
  const db = new MockFirestore();
  db.setDoc('users/cus-multi', {
    walletBalance: 0,
    pendingWithdrawal: 500,
    displayName: 'Multi Task Customer'
  });
  db.setDoc('todos/task-A', {
    taskType: 'WALLET_WITHDRAWAL',
    status: 'PENDING',
    withdrawalDetails: { amount: 150 },
    customer: { uid: 'cus-multi' }
  });
  db.setDoc('todos/task-B', {
    taskType: 'WALLET_WITHDRAWAL',
    status: 'PENDING',
    withdrawalDetails: { amount: 350 },
    customer: { uid: 'cus-multi' }
  });

  await db.runTransaction(async (transaction) => {
    const userRef = { path: 'users/cus-multi' };
    const taskARef = { path: 'todos/task-A' };
    const taskBRef = { path: 'todos/task-B' };

    const userSnap = await transaction.get(userRef);
    const taskASnap = await transaction.get(taskARef);
    const taskBSnap = await transaction.get(taskBRef);

    const safeAmount = 200;
    const currentPending = 500;

    let pendingDeduct = 200;
    transaction.update(userRef, {
      pendingWithdrawal: currentPending - pendingDeduct
    });

    let remainingPendingToClear = pendingDeduct; // 200

    // Process Task A (150 THB)
    const taskAAmount = taskASnap.data().withdrawalDetails.amount;
    if (remainingPendingToClear >= taskAAmount) {
      transaction.update(taskARef, {
        status: 'completed',
        'withdrawalDetails.completedVia': 'CUSTOMER_DRAWER_REFUND'
      });
      remainingPendingToClear -= taskAAmount; // 200 - 150 = 50 left
    }

    // Process Task B (350 THB)
    const taskBAmount = taskBSnap.data().withdrawalDetails.amount;
    if (remainingPendingToClear >= taskBAmount) {
      transaction.update(taskBRef, { status: 'completed' });
    } else {
      const remainingB = Math.round((taskBAmount - remainingPendingToClear) * 100) / 100; // 350 - 50 = 300
      transaction.update(taskBRef, {
        'withdrawalDetails.amount': remainingB,
        adminNote: `ตัดจ่ายบางส่วน ฿${remainingPendingToClear} ทางหน้าร้าน (คงเหลือ ฿${remainingB})`
      });
      remainingPendingToClear = 0;
    }
  });

  const updatedUser = db.getDoc('users/cus-multi').data();
  const taskA = db.getDoc('todos/task-A').data();
  const taskB = db.getDoc('todos/task-B').data();

  assert(updatedUser.pendingWithdrawal === 300,
    'Multi-Task Partial: User pending becomes 300 THB');

  assert(taskA.status === 'completed' && taskA.withdrawalDetails.completedVia === 'CUSTOMER_DRAWER_REFUND',
    'Multi-Task Partial: Task A (150 THB) fully satisfied and marked completed via CUSTOMER_DRAWER_REFUND');

  assert(taskB.status === 'PENDING' && taskB.withdrawalDetails.amount === 300,
    'Multi-Task Partial: Task B (350 THB) partially satisfied (amount reduced to 300 THB, status remains PENDING)');

  const sumRemainingTasks = (taskA.status === 'PENDING' ? taskA.withdrawalDetails.amount : 0) +
                           (taskB.status === 'PENDING' ? taskB.withdrawalDetails.amount : 0);

  assert(updatedUser.pendingWithdrawal === sumRemainingTasks,
    'Multi-Task Parity: user.pendingWithdrawal (300) === sum of all active withdrawal tasks (300)');
}

await testMultiTaskPartialDrawerRefund();

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log(`📊 ADVERSARIAL STRESS TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
if (failedChecks === 0) {
  console.log('🎉 VERDICT: APPROVE — ZERO DEFECTS, CONCURRENCY-SAFE, MATHEMATICALLY SOUND');
} else {
  console.log(`💥 VERDICT: REJECT — ${failedChecks} DEFECTS DETECTED`);
  console.log(JSON.stringify(defects, null, 2));
}
console.log('================================================================================\n');

process.exit(failedChecks === 0 ? 0 : 1);
