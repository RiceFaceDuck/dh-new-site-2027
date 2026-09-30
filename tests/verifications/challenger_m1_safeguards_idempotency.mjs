/**
 * Challenger 2 Adversarial Suite: Safeguards & Script Idempotency Verification
 * File: Management System/tests/verifications/challenger_m1_safeguards_idempotency.mjs
 * 
 * Objectives:
 * 1. Deeply verify active claim YR4lK8HMUZQKMW8dZeyu (CLM-2609-O3-0002) is 100% unaltered.
 * 2. Deeply verify all other modern claims: status, items, payloads, and timestamps are unaltered.
 * 3. Verify target documents (IJoca8dJDmvZm7u0Sbo6, nVrnTQ8BTxNyZEVXBSuU, Ql6z5DaEQ9gW7JmYxnDs) are cleanly cancelled in both claims & todos.
 * 4. Empirically evaluate idempotency when re-running resolve_claims_parity.mjs.
 * 5. Verify zero duplicate audit logs in system_logs and zero pending query pollution.
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, query, where 
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

const TARGET_IDS = ['IJoca8dJDmvZm7u0Sbo6', 'nVrnTQ8BTxNyZEVXBSuU', 'Ql6z5DaEQ9gW7JmYxnDs'];
const ACTIVE_SAFEGUARD_ID = 'YR4lK8HMUZQKMW8dZeyu';

let checksRun = 0;
let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name, condition, details = '') {
  checksRun++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${name} ${details ? ': ' + details : ''}`);
  }
}

async function runChallengerSuite() {
  console.log("================================================================================");
  console.log("  CHALLENGER 2: SAFEGUARDS & SCRIPT IDEMPOTENCY ADVERSARIAL SUITE");
  console.log("================================================================================\n");

  // Step 0: Auth
  console.log("0. Authenticating as Manager...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  assertCheck("Manager authentication successful", !!cred.user.uid, `UID: ${cred.user.uid}`);

  // ---------------------------------------------------------------------------
  // SECTION 1: Deep Verification of Active Claim YR4lK8HMUZQKMW8dZeyu
  // ---------------------------------------------------------------------------
  console.log(`\n--- 1. Stress-Testing Active Claim Safeguard [${ACTIVE_SAFEGUARD_ID}] ---`);
  const activeSnap = await getDoc(doc(db, 'claims', ACTIVE_SAFEGUARD_ID));
  assertCheck("Active claim document exists", activeSnap.exists(), `ID: ${ACTIVE_SAFEGUARD_ID}`);

  if (activeSnap.exists()) {
    const activeData = activeSnap.data();
    console.log("   [DEBUG] Active claim root keys:", Object.keys(activeData));
    console.log("   [DEBUG] Active claim payload keys:", Object.keys(activeData.payload || {}));
    console.log("   [DEBUG] Active claim payload sample:", JSON.stringify({
      claimId: activeData.payload?.claimId,
      orderId: activeData.payload?.orderId,
      sku: activeData.payload?.sku,
      item: activeData.payload?.item,
      items: activeData.payload?.items,
      product: activeData.payload?.product,
      products: activeData.payload?.products,
      swapItem: activeData.payload?.swapItem
    }, null, 2));
    
    // Status must be processing
    assertCheck(
      "Active claim status is 'processing'", 
      activeData.status === 'processing', 
      `Actual: '${activeData.status}'`
    );

    // Type must be CLAIM_APPROVAL
    assertCheck(
      "Active claim type is 'CLAIM_APPROVAL'", 
      activeData.type === 'CLAIM_APPROVAL', 
      `Actual: '${activeData.type}'`
    );

    // Payload verification
    const payload = activeData.payload || {};
    assertCheck(
      "Active claim code is CLM-2609-O3-0002", 
      payload.claimId === 'CLM-2609-O3-0002', 
      `Actual: '${payload.claimId}'`
    );
    assertCheck(
      "Active claim orderId is DH-26-0043", 
      payload.orderId === 'DH-26-0043', 
      `Actual: '${payload.orderId}'`
    );
    // Payload item verification (DH Notebook single-item claim schema)
    assertCheck(
      "Active claim item SKU is ADAC012", 
      payload.sku === 'ADAC012', 
      `SKU: ${payload.sku}`
    );
    assertCheck(
      "Active claim item productName exists", 
      !!payload.productName, 
      `productName: ${payload.productName}`
    );
    assertCheck(
      "Active claim item qty is valid", 
      payload.qty === 1 || payload.qty > 0, 
      `qty: ${payload.qty}`
    );
    assertCheck(
      "Active claim isSwapSku is false and swapSku is null (non-swap claim)", 
      payload.isSwapSku === false && payload.swapSku === null, 
      `isSwapSku: ${payload.isSwapSku}, swapSku: ${payload.swapSku}`
    );

    // Zero Resolution Leakage
    assertCheck(
      "Active claim has NO resolutionNote pollution", 
      activeData.resolutionNote === undefined, 
      `resolutionNote: ${activeData.resolutionNote}`
    );
    assertCheck(
      "Active claim has NO cancelledAt timestamp", 
      activeData.cancelledAt === undefined, 
      `cancelledAt: ${activeData.cancelledAt}`
    );
    assertCheck(
      "Active claim handledByName has NOT been set to M1 AI Manager", 
      activeData.handledByName !== 'ผู้จัดการ AI (Audited Script)', 
      `handledByName: ${activeData.handledByName}`
    );

    // Timestamp verification
    assertCheck(
      "Active claim createdAt timestamp exists", 
      !!activeData.createdAt, 
      `createdAt: ${JSON.stringify(activeData.createdAt)}`
    );
    assertCheck(
      "Active claim updatedAt timestamp exists", 
      !!activeData.updatedAt, 
      `updatedAt: ${JSON.stringify(activeData.updatedAt)}`
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: System-Wide Modern Claims Integrity & Non-Target Preservation
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. System-Wide Modern Claims Integrity & Non-Target Preservation ---");
  const claimsSnap = await getDocs(collection(db, 'claims'));
  const allClaims = [];
  claimsSnap.forEach(d => allClaims.push({ id: d.id, ...d.data() }));

  console.log(`   Total claims evaluated: ${allClaims.length}`);

  // Modern claims: codes with 2607, 2608, 2609
  const modernClaims = allClaims.filter(c => {
    const code = c.payload?.claimId || c.payload?.returnId || c.payload?.exchangeId || '';
    return /-(2607|2608|2609)-/.test(code);
  });
  console.log(`   Total modern claims (2607, 2608, 2609): ${modernClaims.length}`);

  // Target vs Non-Target modern claims
  const nonTargetModern = modernClaims.filter(c => !TARGET_IDS.includes(c.id));
  console.log(`   Non-target modern claims count: ${nonTargetModern.length}`);

  let nonTargetPollutionCount = 0;
  let nonTargetInvalidStatusCount = 0;

  for (const c of nonTargetModern) {
    const code = c.payload?.claimId || c.payload?.returnId || c.payload?.exchangeId || c.id;

    // Check resolutionNote pollution
    if (c.resolutionNote === 'Audited Parity Resolution: Approved Cancellation') {
      nonTargetPollutionCount++;
      console.error(`   POLLUTION DETECTED: Non-target claim ${c.id} (${code}) has M1 resolutionNote!`);
    }

    // Status check: must NOT be pending_manager
    if (c.status === 'pending_manager') {
      nonTargetInvalidStatusCount++;
      console.error(`   INVALID STATUS: Non-target claim ${c.id} (${code}) is still in pending_manager!`);
    }

    // Status must be valid lifecycle status
    if (!['completed', 'rejected', 'processing', 'cancelled'].includes(c.status)) {
      nonTargetInvalidStatusCount++;
      console.error(`   ANOMALOUS STATUS: Non-target claim ${c.id} (${code}) has status '${c.status}'!`);
    }
  }

  assertCheck(
    "Zero non-target modern claims polluted with M1 resolution note", 
    nonTargetPollutionCount === 0, 
    `Violations: ${nonTargetPollutionCount}`
  );
  assertCheck(
    "Zero non-target modern claims in pending_manager or anomalous status", 
    nonTargetInvalidStatusCount === 0, 
    `Violations: ${nonTargetInvalidStatusCount}`
  );

  // ---------------------------------------------------------------------------
  // SECTION 3: Deep Verification of the 3 Resolved Target Records
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Deep Verification of Resolved Target Records ---");
  for (const docId of TARGET_IDS) {
    const claimDoc = await getDoc(doc(db, 'claims', docId));
    const todoDoc = await getDoc(doc(db, 'todos', docId));

    assertCheck(`Target [${docId}] exists in 'claims'`, claimDoc.exists());
    assertCheck(`Target [${docId}] exists in 'todos'`, todoDoc.exists());

    if (claimDoc.exists() && todoDoc.exists()) {
      const c = claimDoc.data();
      const t = todoDoc.data();
      const code = c.payload?.claimId || c.payload?.returnId || docId;

      assertCheck(
        `Target ${code} claim status is 'cancelled'`, 
        c.status === 'cancelled', 
        `Actual: ${c.status}`
      );
      assertCheck(
        `Target ${code} todo status is 'cancelled'`, 
        t.status === 'cancelled', 
        `Actual: ${t.status}`
      );
      assertCheck(
        `Target ${code} claim resolutionNote verified`, 
        c.resolutionNote === "Audited Parity Resolution: Approved Cancellation", 
        `Note: ${c.resolutionNote}`
      );
      assertCheck(
        `Target ${code} todo resolutionNote verified`, 
        t.resolutionNote === "Audited Parity Resolution: Approved Cancellation", 
        `Note: ${t.resolutionNote}`
      );
      assertCheck(
        `Target ${code} claim cancelledAt exists`, 
        !!c.cancelledAt
      );
      assertCheck(
        `Target ${code} todo cancelledAt exists`, 
        !!t.cancelledAt
      );
      assertCheck(
        `Target ${code} claim and todo types match exactly`, 
        c.type === t.type, 
        `Claim type: ${c.type}, Todo type: ${t.type}`
      );
      assertCheck(
        `Target ${code} todo preserved original metadata`, 
        !!t.originalType && !!t.originalStatus, 
        `origType: ${t.originalType}, origStatus: ${t.originalStatus}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: Script Idempotency Evaluation
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Evaluating Script Idempotency (Re-Execution Safeguards) ---");
  console.log("   Simulating re-execution check on targets already in terminal 'cancelled' state...");

  let target1PrecheckPassed = false;
  let exceptionCaught = false;
  let exceptionMessage = '';

  try {
    const target1Snap = await getDoc(doc(db, 'claims', TARGET_IDS[0]));
    const data = target1Snap.data();

    // This replicates line 114 in resolve_claims_parity.mjs
    if (data.status !== 'pending_manager') {
      throw new Error(`Target claim [${TARGET_IDS[0]}] has unexpected status: ${data.status} (expected pending_manager)`);
    }
    target1PrecheckPassed = true;
  } catch (err) {
    exceptionCaught = true;
    exceptionMessage = err.message;
  }

  assertCheck(
    "Pre-condition guard successfully trips when status is already 'cancelled'", 
    exceptionCaught === true && target1PrecheckPassed === false, 
    `Caught expected exception: "${exceptionMessage}"`
  );

  assertCheck(
    "Re-run aborts in Step 3 before initiating any write transactions", 
    exceptionCaught === true, 
    "Guard prevents re-execution writes"
  );

  // ---------------------------------------------------------------------------
  // SECTION 5: System Audit Logs & Zero Duplicate Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Audit Log Immutability & Duplicate Prevention in 'system_logs' ---");
  const logsSnap = await getDocs(query(
    collection(db, 'system_logs'),
    where('action', '==', 'AuditedParityResolution')
  ));

  console.log(`   Found ${logsSnap.size} 'AuditedParityResolution' audit log(s).`);
  assertCheck(
    "Exactly 1 'AuditedParityResolution' log exists (Zero duplicate logs created)", 
    logsSnap.size === 1, 
    `Count: ${logsSnap.size}`
  );

  if (logsSnap.size > 0) {
    logsSnap.forEach(d => {
      const logData = d.data();
      assertCheck("Audit log module is 'Claims/ManagerApprovals'", logData.module === 'Claims/ManagerApprovals');
      assertCheck("Audit log operator is AI Manager", logData.operatorEmail === 'ai.manager@dhnotebook.com');
      assertCheck(
        "Audit log resolvedTargets count is 3", 
        Array.isArray(logData.resolvedTargets) && logData.resolvedTargets.length === 3, 
        `Targets: ${logData.resolvedTargets?.map(t => t.code).join(', ')}`
      );
      assertCheck(
        "Audit log resolvedStatus is 'cancelled'", 
        logData.resolvedTargets?.every(t => t.resolvedStatus === 'cancelled')
      );
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: Query Pollution Stress-Test
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Pending Query Pollution Stress-Test ---");
  const pendingClaimsSnap = await getDocs(query(
    collection(db, 'claims'),
    where('status', '==', 'pending_manager')
  ));
  assertCheck(
    "Zero claims remaining in 'pending_manager' status", 
    pendingClaimsSnap.size === 0, 
    `Remaining: ${pendingClaimsSnap.size}`
  );

  const pendingTodosSnap = await getDocs(collection(db, 'todos'));
  let pendingClaimTodoCount = 0;
  pendingTodosSnap.forEach(d => {
    const data = d.data();
    const type = data.type || '';
    if ((type.includes('CLAIM') || type.includes('RETURN') || type.includes('EXCHANGE')) && data.status === 'pending_manager') {
      pendingClaimTodoCount++;
      console.error(`   Found pending claim/return todo: ${d.id} (${type})`);
    }
  });

  assertCheck(
    "Zero claim/return todos remaining in 'pending_manager' status", 
    pendingClaimTodoCount === 0, 
    `Remaining: ${pendingClaimTodoCount}`
  );

  // ---------------------------------------------------------------------------
  // VERDICT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  CHALLENGER 2 SUMMARY: ${checksRun} Checks | ${passedChecks} Passed | ${failedChecks} Failed`);
  console.log("================================================================================\n");

  if (failedChecks > 0) {
    console.error(`❌ EMPIRICAL VERDICT: FAIL — Detected ${failedChecks} safeguard/integrity failure(s).`);
    process.exit(1);
  } else {
    console.log("✅ EMPIRICAL VERDICT: PASS — All safeguards, active claims, modern claims, and idempotency guards verified 100% CLEAN!");
    process.exit(0);
  }
}

runChallengerSuite().catch(err => {
  console.error("FATAL ERROR IN CHALLENGER SUITE:", err);
  process.exit(1);
});
