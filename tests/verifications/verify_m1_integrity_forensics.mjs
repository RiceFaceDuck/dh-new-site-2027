/**
 * Independent Forensic Integrity Verification Script
 * File: Management System/tests/verifications/verify_m1_integrity_forensics.mjs
 * 
 * Verifies live Firestore state post-Milestone 1 resolution:
 * 1. system_logs/AOWLSC9cl8miRBFi817r exists and contains valid audit payload.
 * 2. 3 target documents in 'claims' and 'todos' are genuinely cancelled with timestamps.
 * 3. Safeguard active claim YR4lK8HMUZQKMW8dZeyu is intact in 'processing' status.
 * 4. Zero discrepancies between 'claims' and 'todos'.
 * 5. Zero pending tasks in 'todos' for target IDs.
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs 
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

const TARGETS = [
  { code: 'CLM-2608-O2-0001', docId: 'IJoca8dJDmvZm7u0Sbo6', type: 'CANCEL_CLAIM_APPROVAL' },
  { code: 'CLM-2607-O1-0002', docId: 'nVrnTQ8BTxNyZEVXBSuU', type: 'CANCEL_CLAIM_APPROVAL' },
  { code: 'RTN-2607-O3-0001', docId: 'Ql6z5DaEQ9gW7JmYxnDs', type: 'CANCEL_RETURN_APPROVAL' }
];

const TARGET_ID_SET = new Set(TARGETS.map(t => t.docId));
const SAFEGUARD_ID = 'YR4lK8HMUZQKMW8dZeyu';
const AUDIT_LOG_ID = 'AOWLSC9cl8miRBFi817r';

async function runForensicAudit() {
  console.log("================================================================================");
  console.log("  INDEPENDENT FORENSIC AUDIT: MILESTONE 1 INTEGRITY VERIFICATION");
  console.log("================================================================================\n");

  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("✓ Authenticated as ai.manager@dhnotebook.com\n");

  let checksPassed = 0;
  let checksFailed = 0;

  function assertCheck(name, condition, details = "") {
    if (condition) {
      checksPassed++;
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      checksFailed++;
      console.error(`[FAIL] ${name} ${details ? ': ' + details : ''}`);
    }
  }

  // 1. Audit Log Document Verification
  console.log("--- 1. Verifying Audit Log Document in 'system_logs' ---");
  const logSnap = await getDoc(doc(db, 'system_logs', AUDIT_LOG_ID));
  assertCheck("Audit log document exists in system_logs", logSnap.exists(), `ID: ${AUDIT_LOG_ID}`);
  if (logSnap.exists()) {
    const logData = logSnap.data();
    console.log("Audit log raw data:", JSON.stringify(logData, null, 2));
    assertCheck("Audit log module is Claims/ManagerApprovals", logData.module === 'Claims/ManagerApprovals');
    assertCheck("Audit log action is AuditedParityResolution", logData.action === 'AuditedParityResolution');
    assertCheck("Audit log operator is manager UID", logData.operatorUid === 'NJplV50wBOX02lKTQclEJ5pgVws2');
    assertCheck("Audit log operator email is ai.manager", logData.operatorEmail === 'ai.manager@dhnotebook.com');
    assertCheck("Audit log resolvedTargets count is 3", Array.isArray(logData.resolvedTargets) && logData.resolvedTargets.length === 3);
    assertCheck("Audit log timestamp exists", !!logData.timestamp);
  }

  // 2. Target Documents State Verification
  console.log("\n--- 2. Verifying Target Documents in 'claims' and 'todos' ---");
  for (const t of TARGETS) {
    console.log(`\nChecking Target ${t.code} (${t.docId}):`);
    const cSnap = await getDoc(doc(db, 'claims', t.docId));
    const tSnap = await getDoc(doc(db, 'todos', t.docId));

    assertCheck(`claims/${t.docId} exists`, cSnap.exists());
    assertCheck(`todos/${t.docId} exists`, tSnap.exists());

    if (cSnap.exists() && tSnap.exists()) {
      const c = cSnap.data();
      const td = tSnap.data();

      // Claims doc checks
      assertCheck(`claims/${t.docId} status === 'cancelled'`, c.status === 'cancelled', `got ${c.status}`);
      assertCheck(`claims/${t.docId} type === '${t.type}'`, c.type === t.type, `got ${c.type}`);
      assertCheck(`claims/${t.docId} cancelledAt timestamp exists`, !!c.cancelledAt);
      assertCheck(`claims/${t.docId} resolutionNote matches`, c.resolutionNote === 'Audited Parity Resolution: Approved Cancellation');
      assertCheck(`claims/${t.docId} handledBy is manager`, c.handledBy === 'NJplV50wBOX02lKTQclEJ5pgVws2');
      assertCheck(`claims/${t.docId} payload.status === 'cancelled'`, c.payload?.status === 'cancelled');

      // Todos doc checks
      assertCheck(`todos/${t.docId} status === 'cancelled'`, td.status === 'cancelled', `got ${td.status}`);
      assertCheck(`todos/${t.docId} type matches claim type '${t.type}'`, td.type === t.type, `got ${td.type}`);
      assertCheck(`todos/${t.docId} cancelledAt timestamp exists`, !!td.cancelledAt);
      assertCheck(`todos/${t.docId} resolutionNote matches`, td.resolutionNote === 'Audited Parity Resolution: Approved Cancellation');
      assertCheck(`todos/${t.docId} handledBy is manager`, td.handledBy === 'NJplV50wBOX02lKTQclEJ5pgVws2');
      assertCheck(`todos/${t.docId} payload.status === 'cancelled'`, td.payload?.status === 'cancelled');
      assertCheck(`todos/${t.docId} title matches claims title`, td.title === c.title);
    }
  }

  // 3. Safeguard Active Claim Verification
  console.log("\n--- 3. Verifying Safeguard Active Claim ---");
  const sSnap = await getDoc(doc(db, 'claims', SAFEGUARD_ID));
  assertCheck(`Safeguard claim ${SAFEGUARD_ID} exists`, sSnap.exists());
  if (sSnap.exists()) {
    const s = sSnap.data();
    assertCheck(`Safeguard claim status is still 'processing'`, s.status === 'processing', `status is ${s.status}`);
    assertCheck(`Safeguard claim code is CLM-2609-O3-0002`, s.payload?.claimId === 'CLM-2609-O3-0002');
  }

  // 4. Global Parity and Orphan Check
  console.log("\n--- 4. Global Collection Cross-Examination ---");
  const claimsSnap = await getDocs(collection(db, 'claims'));
  const todosSnap = await getDocs(collection(db, 'todos'));

  const claimsMap = new Map();
  claimsSnap.forEach(d => claimsMap.set(d.id, d.data()));

  const todosMap = new Map();
  todosSnap.forEach(d => todosMap.set(d.id, d.data()));

  let discrepancies = 0;
  for (const [id, c] of claimsMap.entries()) {
    if (todosMap.has(id)) {
      const td = todosMap.get(id);
      if (c.status !== td.status || c.type !== td.type) {
        discrepancies++;
        console.error(`Discrepancy at doc ${id}: claim[${c.type}, ${c.status}] vs todo[${td.type}, ${td.status}]`);
      }
    }
  }
  assertCheck("Zero discrepancies between co-existing claims and todos", discrepancies === 0, `discrepancies: ${discrepancies}`);

  // Check no pending tasks for target IDs
  let pendingViolations = 0;
  for (const [id, td] of todosMap.entries()) {
    if (TARGET_ID_SET.has(id)) {
      if (['pending_manager', 'pending', 'processing', 'waiting_item', 'todo'].includes(td.status)) {
        pendingViolations++;
        console.error(`Pending violation at todo ${id}: status=${td.status}`);
      }
    }
  }
  assertCheck("Zero pending tasks in 'todos' for target IDs", pendingViolations === 0, `violations: ${pendingViolations}`);

  console.log("\n================================================================================");
  console.log(`TOTAL CHECKS: ${checksPassed + checksFailed} | PASSED: ${checksPassed} | FAILED: ${checksFailed}`);
  console.log("================================================================================");

  if (checksFailed > 0) {
    console.error("FORENSIC VERDICT: INTEGRITY VIOLATION");
    process.exit(1);
  } else {
    console.log("FORENSIC VERDICT: CLEAN");
    process.exit(0);
  }
}

runForensicAudit().catch(err => {
  console.error("FATAL FORENSIC AUDIT ERROR:", err);
  process.exit(1);
});
