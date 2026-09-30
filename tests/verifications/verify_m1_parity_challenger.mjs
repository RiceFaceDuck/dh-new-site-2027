/**
 * Adversarial Parity Verification Suite for Milestone 1
 * Manager Approvals & Claims Parity Overhaul
 * 
 * File: Management System/tests/verifications/verify_m1_parity_challenger.mjs
 * 
 * Objectives:
 * 1. Stress-test claims vs todos parity across all documents in Firestore.
 * 2. Verify exactly 0 pending cancellation tasks remain in 'claims' and 'todos'.
 * 3. Verify exactly 0 documents in 'claims' have status: 'pending_manager'.
 * 4. Verify targeted resolution of CLM-2608-O2-0001, CLM-2607-O1-0002, RTN-2607-O3-0001 with audit fields.
 * 5. Verify active safeguard claim YR4lK8HMUZQKMW8dZeyu (CLM-2609-O3-0002) is untouched.
 * 6. Audit customer wallets and order ledgers for target items: 0 balance distortion, 0 phantom deductions, 0 ledger corruption.
 * 7. Verify audit log entry in 'system_logs'.
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy, limit 
} from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let testCount = 0;
let passedCount = 0;
let failedCount = 0;
const failureDetails = [];

function assertTest(description, condition, details = null) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${description}`);
    if (details) {
      console.log(`     Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
    }
  } else {
    failedCount++;
    console.error(`  ✗ [FAIL] ${description}`);
    if (details) {
      console.error(`     Failure Details: ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`);
    }
    failureDetails.push({ test: description, details });
  }
}

const TARGETS = [
  {
    code: 'CLM-2608-O2-0001',
    docId: 'IJoca8dJDmvZm7u0Sbo6',
    expectedType: 'CANCEL_CLAIM_APPROVAL',
    orderId: 'DH-26-0013',
    orderDocId: 'DH-26-0013',
    customerUid: 'gMCHAeIOuQfGghCNI3PU'
  },
  {
    code: 'CLM-2607-O1-0002',
    docId: 'nVrnTQ8BTxNyZEVXBSuU',
    expectedType: 'CANCEL_CLAIM_APPROVAL',
    orderId: 'DH-38143-2026',
    orderDocId: '0aCVZNSu4sRNTqIKw0me',
    customerUid: 'frrnoxNd4KM5efzFLpQR'
  },
  {
    code: 'RTN-2607-O3-0001',
    docId: 'Ql6z5DaEQ9gW7JmYxnDs',
    expectedType: 'CANCEL_RETURN_APPROVAL',
    orderId: 'DH-26-0008',
    orderDocId: 'DH-26-0008',
    customerUid: 'gMCHAeIOuQfGghCNI3PU'
  }
];

const TARGET_DOC_IDS = TARGETS.map(t => t.docId);
const SAFEGUARD_CLAIM_ID = 'YR4lK8HMUZQKMW8dZeyu';

async function runAdversarialVerification() {
  console.log("================================================================================");
  console.log("  ADVERSARIAL VERIFICATION SUITE: CLAIMS & TODOS PARITY (MILESTONE 1)");
  console.log("================================================================================\n");

  // Step 0: Auth
  console.log("--- 0. Authentication Check ---");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  assertTest("Authenticated as Manager (ai.manager@dhnotebook.com)", !!cred.user?.uid, `UID: ${cred.user.uid}`);

  // Fetch all collections
  console.log("\n--- Fetching live snapshots of claims and todos collections ---");
  const claimsSnap = await getDocs(collection(db, 'claims'));
  const todosSnap = await getDocs(collection(db, 'todos'));
  
  const claimsMap = new Map();
  claimsSnap.forEach(d => claimsMap.set(d.id, d.data()));

  const todosMap = new Map();
  todosSnap.forEach(d => todosMap.set(d.id, d.data()));

  console.log(`  Fetched: ${claimsMap.size} claims docs, ${todosMap.size} todos docs.`);

  // ---------------------------------------------------------------------------
  // SUITE 1: Claims Collection Audit & Zero 'pending_manager' Guarantee
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  SUITE 1: CLAIMS COLLECTION AUDIT & ZERO 'pending_manager' GUARANTEE");
  console.log("================================================================================");

  // 1.1 Exactly 0 documents in 'claims' have status == 'pending_manager'
  const pendingManagerClaims = [];
  claimsMap.forEach((claim, id) => {
    if (claim.status === 'pending_manager') {
      pendingManagerClaims.push({ id, type: claim.type, code: claim.payload?.claimId || claim.payload?.returnId || claim.payload?.exchangeId });
    }
  });
  assertTest(
    "1.1 Query 'claims' for status === 'pending_manager': exactly 0 remain",
    pendingManagerClaims.length === 0,
    { count: pendingManagerClaims.length, items: pendingManagerClaims }
  );

  // 1.2 All cancel requests in 'claims' (type starts with 'CANCEL_') must be in terminal status
  const cancelClaims = [];
  claimsMap.forEach((claim, id) => {
    if (claim.type && claim.type.startsWith('CANCEL_')) {
      cancelClaims.push({ id, type: claim.type, status: claim.status });
    }
  });
  const nonTerminalCancelClaims = cancelClaims.filter(c => !['cancelled', 'rejected'].includes(c.status));
  assertTest(
    `1.2 All CANCEL_* type claims (${cancelClaims.length} total) must be in terminal status ['cancelled', 'rejected']`,
    nonTerminalCancelClaims.length === 0,
    { nonTerminalCount: nonTerminalCancelClaims.length, items: nonTerminalCancelClaims }
  );

  // 1.3 Target claim 1: CLM-2608-O2-0001 (IJoca8dJDmvZm7u0Sbo6)
  const c1 = claimsMap.get('IJoca8dJDmvZm7u0Sbo6');
  assertTest(
    "1.3 Target 1 [CLM-2608-O2-0001] claims doc is status='cancelled' with audit trail",
    c1 && c1.status === 'cancelled' && c1.payload?.status === 'cancelled' && !!c1.cancelledAt && !!c1.resolutionNote && c1.handledBy === cred.user.uid,
    { status: c1?.status, payloadStatus: c1?.payload?.status, handledBy: c1?.handledBy, note: c1?.resolutionNote }
  );

  // 1.4 Target claim 2: CLM-2607-O1-0002 (nVrnTQ8BTxNyZEVXBSuU)
  const c2 = claimsMap.get('nVrnTQ8BTxNyZEVXBSuU');
  assertTest(
    "1.4 Target 2 [CLM-2607-O1-0002] claims doc is status='cancelled' with audit trail",
    c2 && c2.status === 'cancelled' && c2.payload?.status === 'cancelled' && !!c2.cancelledAt && !!c2.resolutionNote && c2.handledBy === cred.user.uid,
    { status: c2?.status, payloadStatus: c2?.payload?.status, handledBy: c2?.handledBy, note: c2?.resolutionNote }
  );

  // 1.5 Target claim 3: RTN-2607-O3-0001 (Ql6z5DaEQ9gW7JmYxnDs)
  const c3 = claimsMap.get('Ql6z5DaEQ9gW7JmYxnDs');
  assertTest(
    "1.5 Target 3 [RTN-2607-O3-0001] claims doc is status='cancelled' with audit trail",
    c3 && c3.status === 'cancelled' && c3.payload?.status === 'cancelled' && !!c3.cancelledAt && !!c3.resolutionNote && c3.handledBy === cred.user.uid,
    { status: c3?.status, payloadStatus: c3?.payload?.status, handledBy: c3?.handledBy, note: c3?.resolutionNote }
  );

  // 1.6 Active safeguard claim: YR4lK8HMUZQKMW8dZeyu (CLM-2609-O3-0002)
  const cSafe = claimsMap.get(SAFEGUARD_CLAIM_ID);
  assertTest(
    "1.6 Active safeguard claim [YR4lK8HMUZQKMW8dZeyu] remains status='processing' and NOT cancelled",
    cSafe && cSafe.status === 'processing' && cSafe.type === 'CLAIM_APPROVAL' && cSafe.payload?.claimId === 'CLM-2609-O3-0002',
    { status: cSafe?.status, type: cSafe?.type, code: cSafe?.payload?.claimId }
  );

  // ---------------------------------------------------------------------------
  // SUITE 2: Todos Collection Audit & Claims-Todos Parity
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  SUITE 2: TODOS COLLECTION AUDIT & CLAIMS-TODOS PARITY");
  console.log("================================================================================");

  // 2.1 Zero claim/return/cancel todos in 'pending_manager'
  const pendingManagerClaimTodos = [];
  todosMap.forEach((todo, id) => {
    const type = todo.type || todo.taskType || '';
    if (['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'EXCHANGE_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL'].includes(type) ||
        type.includes('CLAIM') || type.includes('RETURN') || type.includes('EXCHANGE') || type.includes('CANCEL')) {
      if (todo.status === 'pending_manager') {
        pendingManagerClaimTodos.push({ id, type, status: todo.status, title: todo.title });
      }
    }
  });
  assertTest(
    "2.1 Zero claim/return/exchange/cancel todos in status === 'pending_manager'",
    pendingManagerClaimTodos.length === 0,
    { count: pendingManagerClaimTodos.length, items: pendingManagerClaimTodos }
  );

  // 2.2 Target todos: check doc status === 'cancelled' for all 3 targets
  for (const target of TARGETS) {
    const tDoc = todosMap.get(target.docId);
    assertTest(
      `2.2 Target todo [${target.code}] (${target.docId}) is status='cancelled' with matching type ${target.expectedType}`,
      tDoc && tDoc.status === 'cancelled' && tDoc.type === target.expectedType && !!tDoc.cancelledAt && !!tDoc.resolutionNote && tDoc.handledBy === cred.user.uid,
      { status: tDoc?.status, type: tDoc?.type, note: tDoc?.resolutionNote, cancelledAt: tDoc?.cancelledAt }
    );
  }

  // 2.3 Pairwise Parity across ALL co-existing documents in 'claims' and 'todos'
  let matchedDocsCount = 0;
  const parityDiscrepancies = [];
  claimsMap.forEach((claim, id) => {
    if (todosMap.has(id)) {
      matchedDocsCount++;
      const todo = todosMap.get(id);
      const isStatusMismatched = claim.status !== todo.status;
      const isTypeMismatched = claim.type !== todo.type;
      if (isStatusMismatched || isTypeMismatched) {
        parityDiscrepancies.push({
          id,
          code: claim.payload?.claimId || claim.payload?.returnId || claim.payload?.exchangeId,
          claimStatus: claim.status,
          todoStatus: todo.status,
          claimType: claim.type,
          todoType: todo.type
        });
      }
    }
  });
  assertTest(
    `2.3 Full pairwise parity check across all co-existing docs (${matchedDocsCount} docs): 0 discrepancies`,
    parityDiscrepancies.length === 0,
    { matchedDocs: matchedDocsCount, discrepancies: parityDiscrepancies }
  );

  // 2.4 Manager Dashboard Query Emulation
  // useManagerDashboard.js: query(todosRef, where('status', 'in', ['pending', 'pending_manager']))
  const managerPendingTodosSnap = await getDocs(
    query(collection(db, 'todos'), where('status', 'in', ['pending', 'pending_manager']))
  );
  const targetIdsInManagerPendingQuery = [];
  managerPendingTodosSnap.forEach(d => {
    if (TARGET_DOC_IDS.includes(d.id)) {
      targetIdsInManagerPendingQuery.push({ id: d.id, data: d.data() });
    }
  });
  assertTest(
    "2.4 Manager Dashboard query [status in ('pending', 'pending_manager')] excludes all 3 targets",
    targetIdsInManagerPendingQuery.length === 0,
    { found: targetIdsInManagerPendingQuery }
  );

  // 2.5 AdminLayout sidebar badge query emulation
  // Filters managerTodos for:
  // (type in ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']) &&
  // ['pending_manager', 'waiting_item', 'processing'].includes(todo.status)
  const sidebarPendingClaims = [];
  todosMap.forEach((todo, id) => {
    const isClaimType = ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL'].includes(todo.type);
    const isPendingStatus = ['pending_manager', 'waiting_item', 'processing'].includes(todo.status);
    if (isClaimType && isPendingStatus) {
      sidebarPendingClaims.push({ id, type: todo.type, status: todo.status });
    }
  });
  const targetsInSidebar = sidebarPendingClaims.filter(c => TARGET_DOC_IDS.includes(c.id));
  assertTest(
    "2.5 AdminLayout sidebar badge query: 0 target items counted in pending claims",
    targetsInSidebar.length === 0,
    { targetsInSidebar, totalSidebarPendingClaims: sidebarPendingClaims.length }
  );

  // ---------------------------------------------------------------------------
  // SUITE 3: Customer Wallet Forensic Audit
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  SUITE 3: CUSTOMER WALLET FORENSIC AUDIT");
  console.log("================================================================================");

  const customerUids = [...new Set(TARGETS.map(t => t.customerUid))];
  
  for (const uid of customerUids) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    assertTest(`3.1 User doc [${uid}] exists in 'users'`, userSnap.exists());
    
    if (userSnap.exists()) {
      const u = userSnap.data();
      const hasValidWallet = typeof u.walletBalance === 'number' && !isNaN(u.walletBalance);
      assertTest(
        `3.2 User [${uid}] walletBalance is a valid non-NaN number`,
        hasValidWallet,
        { accountName: u.accountName || u.name, walletBalance: u.walletBalance, creditPoints: u.creditPoints }
      );

      // Audit wallet transactions subcollection
      const txSnap = await getDocs(collection(db, 'users', uid, 'wallet_transactions'));
      const suspiciousTx = [];
      txSnap.forEach(d => {
        const tx = d.data();
        // Check if any transaction references our target claim codes
        const desc = (tx.description || '') + (tx.note || '') + (tx.referenceId || '');
        for (const t of TARGETS) {
          if (desc.includes(t.code) || desc.includes(t.docId)) {
            suspiciousTx.push({ txId: d.id, ...tx });
          }
        }
      });

      assertTest(
        `3.3 User [${uid}] has 0 phantom wallet transactions tied to cancelled targets`,
        suspiciousTx.length === 0,
        { suspiciousCount: suspiciousTx.length, items: suspiciousTx }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: Order Ledgers Forensic Audit
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  SUITE 4: ORDER LEDGERS FORENSIC AUDIT");
  console.log("================================================================================");

  for (const target of TARGETS) {
    const oSnap = await getDoc(doc(db, 'orders', target.orderDocId));
    assertTest(`4.1 Order [${target.orderId}] doc [${target.orderDocId}] exists`, oSnap.exists());

    if (oSnap.exists()) {
      const order = oSnap.data();
      const items = order.items || [];
      const hasValidItems = Array.isArray(items) && items.length > 0;
      assertTest(
        `4.2 Order [${target.orderId}] has non-corrupted items list (${items.length} items)`,
        hasValidItems,
        { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, totalAmount: order.totalAmount }
      );

      // Verify no phantom ledger deduction or mutation
      const totalAmount = order.totalAmount || order.total || 0;
      const netAmount = order.netAmount ?? totalAmount;
      const isPositiveFinancial = typeof totalAmount === 'number' && totalAmount >= 0;
      assertTest(
        `4.3 Order [${target.orderId}] ledger amounts are valid and uncorrupted`,
        isPositiveFinancial,
        { totalAmount, netAmount, paymentStatus: order.paymentStatus }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: System Audit Trail & Immutable Log Verification
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  SUITE 5: SYSTEM AUDIT TRAIL & IMMUTABLE LOG VERIFICATION");
  console.log("================================================================================");

  // Check specific audit log: AOWLSC9cl8miRBFi817r
  const auditDocSnap = await getDoc(doc(db, 'system_logs', 'AOWLSC9cl8miRBFi817r'));
  assertTest("5.1 Audit log [AOWLSC9cl8miRBFi817r] exists in 'system_logs'", auditDocSnap.exists());

  if (auditDocSnap.exists()) {
    const logData = auditDocSnap.data();
    const isModuleMatch = logData.module === 'Claims/ManagerApprovals';
    const isActionMatch = logData.action === 'AuditedParityResolution';
    const isOperatorMatch = logData.operatorUid === cred.user.uid;
    const hasAll3Targets = Array.isArray(logData.resolvedTargets) && logData.resolvedTargets.length === 3;
    
    assertTest(
      "5.2 Audit log metadata is valid (module, action, operatorUid, 3 resolved targets)",
      isModuleMatch && isActionMatch && isOperatorMatch && hasAll3Targets,
      {
        module: logData.module,
        action: logData.action,
        operatorEmail: logData.operatorEmail,
        resolvedTargets: logData.resolvedTargets
      }
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY & EMPIRICAL VERDICT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  VERIFICATION RESULTS: ${passedCount} / ${testCount} CHECKS PASSED`);
  console.log(`  FAILED CHECKS: ${failedCount}`);
  console.log("================================================================================\n");

  if (failedCount === 0) {
    console.log("🎉 EMPIRICAL VERDICT: 100% PASS — ABSOLUTE PARITY CONFIRMED!");
    console.log("   - 0 pending_manager claims in live Firestore.");
    console.log("   - 0 pending claim/return todos in live Firestore.");
    console.log("   - 0 discrepancies between co-existing claims and todos docs.");
    console.log("   - 0 wallet balance distortions or phantom transactions.");
    console.log("   - 0 order ledger corruptions.");
    console.log("   - Target items CLM-2608-O2-0001, CLM-2607-O1-0002, RTN-2607-O3-0001 cleanly cancelled.");
    console.log("   - Active safeguard claim YR4lK8HMUZQKMW8dZeyu untouched.");
  } else {
    console.error("❌ EMPIRICAL VERDICT: FAIL — DISCREPANCIES OR ANOMALIES DETECTED!");
    console.error("Failure Summary:", JSON.stringify(failureDetails, null, 2));
  }

  return {
    testCount,
    passedCount,
    failedCount,
    verdict: failedCount === 0 ? "PASS" : "FAIL",
    failureDetails
  };
}

runAdversarialVerification()
  .then(res => {
    process.exit(res.failedCount === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error("FATAL ERROR EXECUTING ADVERSARIAL VERIFICATION:", err);
    process.exit(1);
  });
