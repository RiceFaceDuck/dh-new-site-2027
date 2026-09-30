/**
 * Deterministic Resolution Script: Manager Approvals & Claims Parity Overhaul
 * File: Management System/tests/verifications/resolve_claims_parity.mjs
 * 
 * Objective:
 * 1. Resolve 3 target cancel approval tasks to terminal 'cancelled' status in 'claims' collection:
 *    - IJoca8dJDmvZm7u0Sbo6 (CLM-2608-O2-0001)
 *    - nVrnTQ8BTxNyZEVXBSuU (CLM-2607-O1-0002)
 *    - Ql6z5DaEQ9gW7JmYxnDs (RTN-2607-O3-0001)
 * 2. Record full audit fields: cancelledAt, resolutionNote, handledBy, updatedAt.
 * 3. Synchronize matching shadow records in 'todos' collection to status 'cancelled',
 *    aligning type, title, and metadata to eliminate all discrepancies and purge pending queries.
 * 4. Safeguard: Assert strict doc ID whitelist and verify that active claims (e.g. YR4lK8HMUZQKMW8dZeyu)
 *    remain strictly untouched.
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, updateDoc, serverTimestamp, runTransaction, collection, addDoc, getDocs 
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

// Strict Whitelist of Target Documents
const TARGETS = [
  {
    code: 'CLM-2608-O2-0001',
    docId: 'IJoca8dJDmvZm7u0Sbo6',
    expectedClaimType: 'CANCEL_CLAIM_APPROVAL',
    orderId: 'DH-26-0013',
    customerUid: 'gMCHAeIOuQfGghCNI3PU'
  },
  {
    code: 'CLM-2607-O1-0002',
    docId: 'nVrnTQ8BTxNyZEVXBSuU',
    expectedClaimType: 'CANCEL_CLAIM_APPROVAL',
    orderId: 'DH-38143-2026',
    customerUid: 'frrnoxNd4KM5efzFLpQR'
  },
  {
    code: 'RTN-2607-O3-0001',
    docId: 'Ql6z5DaEQ9gW7JmYxnDs',
    expectedClaimType: 'CANCEL_RETURN_APPROVAL',
    orderId: 'DH-26-0008',
    customerUid: 'gMCHAeIOuQfGghCNI3PU'
  }
];

const TARGET_ID_SET = new Set(TARGETS.map(t => t.docId));
const ACTIVE_SAFEGUARD_ID = 'YR4lK8HMUZQKMW8dZeyu'; // CLM-2609-O3-0002 (active processing claim)

async function runResolution() {
  console.log("================================================================================");
  console.log("  DETERMINISTIC DATA RESOLUTION & CLAIMS PARITY CLEANUP");
  console.log("================================================================================\n");

  // Step 1: Manager Authentication
  console.log("1. Authenticating as Manager (ai.manager@dhnotebook.com)...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  const managerUid = cred.user.uid;
  const managerEmail = cred.user.email;
  console.log(`   Authenticated successfully. UID: ${managerUid}, Email: ${managerEmail}\n`);

  // Step 2: Read baseline state of active safeguard claim
  console.log(`2. Capturing baseline state of active safeguard claim [${ACTIVE_SAFEGUARD_ID}]...`);
  const activeSnapBefore = await getDoc(doc(db, 'claims', ACTIVE_SAFEGUARD_ID));
  if (!activeSnapBefore.exists()) {
    throw new Error(`Safeguard active claim [${ACTIVE_SAFEGUARD_ID}] not found in Firestore!`);
  }
  const activeDataBefore = activeSnapBefore.data();
  console.log(`   Active claim status: ${activeDataBefore.status}, code: ${activeDataBefore.payload?.claimId}`);
  if (activeDataBefore.status !== 'processing') {
    throw new Error(`Unexpected status for active claim: ${activeDataBefore.status}`);
  }
  console.log("   Safeguard baseline verified.\n");

  // Step 3: Forensic Pre-checks on Target Documents
  console.log("3. Conducting pre-checks on the 3 target records...");
  const beforeStates = [];

  for (const target of TARGETS) {
    console.log(`\n   --- Inspecting Target: ${target.code} (${target.docId}) ---`);
    if (!TARGET_ID_SET.has(target.docId)) {
      throw new Error(`Integrity Violation: docId ${target.docId} is not in whitelist!`);
    }

    const claimRef = doc(db, 'claims', target.docId);
    const claimSnap = await getDoc(claimRef);
    if (!claimSnap.exists()) {
      throw new Error(`Target claim doc [${target.docId}] does not exist in 'claims'!`);
    }
    const claimData = claimSnap.data();

    const todoRef = doc(db, 'todos', target.docId);
    const todoSnap = await getDoc(todoRef);
    if (!todoSnap.exists()) {
      throw new Error(`Target todo doc [${target.docId}] does not exist in 'todos'!`);
    }
    const todoData = todoSnap.data();

    // Verify claim preconditions
    if (claimData.status !== 'pending_manager') {
      throw new Error(`Target claim [${target.docId}] has unexpected status: ${claimData.status} (expected pending_manager)`);
    }
    if (claimData.type !== target.expectedClaimType) {
      throw new Error(`Target claim [${target.docId}] has unexpected type: ${claimData.type} (expected ${target.expectedClaimType})`);
    }
    if (claimData.originalStatus === 'completed') {
      throw new Error(`Target claim [${target.docId}] was completed! Financial mutation guard triggered.`);
    }

    console.log(`   Pre-check passed: Claim is ${claimData.type}, status=${claimData.status}, originalStatus=${claimData.originalStatus}`);
    console.log(`   Todo current status=${todoData.status}, type=${todoData.type}`);

    beforeStates.push({
      target,
      claimBefore: claimData,
      todoBefore: todoData
    });
  }

  console.log("\n4. Executing deterministic resolution across 'claims' and 'todos'...");

  const resolutionNote = "Audited Parity Resolution: Approved Cancellation";
  const handledByName = "ผู้จัดการ AI (Audited Script)";

  for (const { target, claimBefore, todoBefore } of beforeStates) {
    console.log(`\n   >>> Resolving ${target.code} (Doc ID: ${target.docId})...`);

    await runTransaction(db, async (tx) => {
      const claimRef = doc(db, 'claims', target.docId);
      const todoRef = doc(db, 'todos', target.docId);

      // Verify again inside transaction
      const cSnap = await tx.get(claimRef);
      const tSnap = await tx.get(todoRef);

      if (!cSnap.exists() || !tSnap.exists()) {
        throw new Error(`Document missing inside transaction for ${target.docId}`);
      }

      // 1. Mutate Claim to cancelled
      const claimPayload = { ...(cSnap.data().payload || {}) };
      claimPayload.status = 'cancelled';

      tx.update(claimRef, {
        status: 'cancelled',
        handledBy: managerUid,
        handledByName: handledByName,
        cancelledAt: serverTimestamp(),
        resolutionNote: resolutionNote,
        payload: claimPayload,
        updatedAt: serverTimestamp()
      });

      // 2. Synchronize matching shadow Todo to cancelled
      const todoPayload = { ...(tSnap.data().payload || {}) };
      todoPayload.status = 'cancelled';

      tx.update(todoRef, {
        status: 'cancelled',
        type: claimBefore.type,
        title: claimBefore.title,
        originalType: claimBefore.originalType || todoBefore.type,
        originalStatus: claimBefore.originalStatus || todoBefore.status,
        originalTitle: claimBefore.originalTitle || todoBefore.title,
        cancelReason: claimBefore.cancelReason || 'reset',
        cancelRequestedBy: claimBefore.cancelRequestedBy || null,
        cancelRequestedByName: claimBefore.cancelRequestedByName || null,
        handledBy: managerUid,
        handledByName: handledByName,
        cancelledAt: serverTimestamp(),
        resolutionNote: resolutionNote,
        payload: todoPayload,
        updatedAt: serverTimestamp()
      });
    });

    console.log(`       ✓ Successfully committed transaction for ${target.code}`);
  }

  // Step 5: Write System Audit Trail Log
  console.log("\n5. Writing immutable audit log to 'system_logs'...");
  const logRef = await addDoc(collection(db, 'system_logs'), {
    module: 'Claims/ManagerApprovals',
    action: 'AuditedParityResolution',
    resolvedTargets: TARGETS.map(t => ({
      code: t.code,
      docId: t.docId,
      resolvedStatus: 'cancelled'
    })),
    operatorUid: managerUid,
    operatorEmail: managerEmail,
    note: resolutionNote,
    timestamp: serverTimestamp()
  });
  console.log(`   Audit log created with ID: ${logRef.id}\n`);

  // Step 6: Post-Verification of Target Records
  console.log("6. Verifying post-resolution state in Firestore...");
  const afterStates = [];

  for (const target of TARGETS) {
    const claimSnap = await getDoc(doc(db, 'claims', target.docId));
    const todoSnap = await getDoc(doc(db, 'todos', target.docId));

    const claimData = claimSnap.data();
    const todoData = todoSnap.data();

    // Assertions for Claim
    if (claimData.status !== 'cancelled') {
      throw new Error(`Verification FAILED: Claim ${target.docId} status is ${claimData.status}`);
    }
    if (claimData.resolutionNote !== resolutionNote) {
      throw new Error(`Verification FAILED: Claim ${target.docId} resolutionNote mismatch`);
    }
    if (!claimData.cancelledAt) {
      throw new Error(`Verification FAILED: Claim ${target.docId} cancelledAt missing`);
    }

    // Assertions for Todo
    if (todoData.status !== 'cancelled') {
      throw new Error(`Verification FAILED: Todo ${target.docId} status is ${todoData.status}`);
    }
    if (todoData.type !== claimData.type) {
      throw new Error(`Verification FAILED: Todo type (${todoData.type}) != Claim type (${claimData.type})`);
    }
    if (todoData.resolutionNote !== resolutionNote) {
      throw new Error(`Verification FAILED: Todo ${target.docId} resolutionNote mismatch`);
    }

    console.log(`   [PASS] Target ${target.code} (${target.docId}):`);
    console.log(`          claims.status='${claimData.status}', todos.status='${todoData.status}', type='${todoData.type}'`);

    afterStates.push({
      target,
      claimAfter: claimData,
      todoAfter: todoData
    });
  }

  // Step 7: Strict Safeguard Check on Active Claim
  console.log(`\n7. Checking active safeguard claim [${ACTIVE_SAFEGUARD_ID}]...`);
  const activeSnapAfter = await getDoc(doc(db, 'claims', ACTIVE_SAFEGUARD_ID));
  const activeDataAfter = activeSnapAfter.data();

  if (activeDataAfter.status !== activeDataBefore.status) {
    throw new Error(`SAFEGUARD BREACH: Active claim status was mutated from ${activeDataBefore.status} to ${activeDataAfter.status}!`);
  }
  if (activeDataAfter.type !== activeDataBefore.type) {
    throw new Error(`SAFEGUARD BREACH: Active claim type was mutated!`);
  }
  if (JSON.stringify(activeDataAfter.payload) !== JSON.stringify(activeDataBefore.payload)) {
    throw new Error(`SAFEGUARD BREACH: Active claim payload was modified!`);
  }
  console.log(`   [PASS] Active claim ${ACTIVE_SAFEGUARD_ID} (${activeDataAfter.payload?.claimId}) is 100% UNTOUCHED!`);

  // Step 8: Verify no pending tasks remain for these 3 IDs in 'todos'
  console.log("\n8. Verifying zero pending tasks remain for these items...");
  const todosSnap = await getDocs(collection(db, 'todos'));
  let pendingViolations = 0;
  todosSnap.forEach(d => {
    if (TARGET_ID_SET.has(d.id)) {
      const data = d.data();
      if (['pending_manager', 'pending', 'processing', 'waiting_item', 'todo'].includes(data.status)) {
        pendingViolations++;
        console.error(`   VIOLATION: Todo ${d.id} still in pending status: ${data.status}`);
      }
    }
  });

  if (pendingViolations > 0) {
    throw new Error(`Found ${pendingViolations} pending task violations in 'todos'!`);
  }
  console.log("   [PASS] Zero pending tasks remain in 'todos' for target items.");

  console.log("\n================================================================================");
  console.log("  ALL RESOLUTION AND PARITY VERIFICATIONS PASSED CLEANLY!");
  console.log("================================================================================\n");

  return {
    success: true,
    resolvedCount: TARGETS.length,
    auditLogId: logRef.id,
    afterStates
  };
}

runResolution()
  .then((res) => {
    console.log("Resolution Result Summary:", JSON.stringify({
      success: res.success,
      resolvedCount: res.resolvedCount,
      auditLogId: res.auditLogId
    }, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("FATAL RESOLUTION ERROR:", err);
    process.exit(1);
  });
