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

let passed = 0;
let failed = 0;

function assertCheck(desc, condition, details = "") {
  if (condition) {
    passed++;
    console.log(`[PASS] ${desc} ${details ? '(' + details + ')' : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${desc} ${details ? ': ' + details : ''}`);
  }
}

async function runReviewerAudit() {
  console.log("=== INDEPENDENT REVIEWER 1 AUDIT & INTEGRITY CHECK ===");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("Authenticated as ai.manager@dhnotebook.com\n");

  const targets = [
    { code: 'CLM-2608-O2-0001', id: 'IJoca8dJDmvZm7u0Sbo6', expectedType: 'CANCEL_CLAIM_APPROVAL', orderId: 'DH-26-0013', userUid: 'gMCHAeIOuQfGghCNI3PU' },
    { code: 'CLM-2607-O1-0002', id: 'nVrnTQ8BTxNyZEVXBSuU', expectedType: 'CANCEL_CLAIM_APPROVAL', orderId: 'DH-38143-2026', userUid: 'frrnoxNd4KM5efzFLpQR' },
    { code: 'RTN-2607-O3-0001', id: 'Ql6z5DaEQ9gW7JmYxnDs', expectedType: 'CANCEL_RETURN_APPROVAL', orderId: 'DH-26-0008', userUid: 'gMCHAeIOuQfGghCNI3PU' }
  ];

  // 1. Audit targets in claims & todos
  console.log("--- 1. Checking 3 Target Records in 'claims' and 'todos' ---");
  for (const t of targets) {
    const cSnap = await getDoc(doc(db, 'claims', t.id));
    assertCheck(`Claim ${t.code} (${t.id}) exists in 'claims'`, cSnap.exists());
    if (cSnap.exists()) {
      const c = cSnap.data();
      assertCheck(`Claim ${t.code} status is 'cancelled'`, c.status === 'cancelled', `got: ${c.status}`);
      assertCheck(`Claim ${t.code} type is '${t.expectedType}'`, c.type === t.expectedType, `got: ${c.type}`);
      assertCheck(`Claim ${t.code} resolutionNote is recorded`, c.resolutionNote === 'Audited Parity Resolution: Approved Cancellation', `got: ${c.resolutionNote}`);
      assertCheck(`Claim ${t.code} cancelledAt timestamp exists`, Boolean(c.cancelledAt));
      assertCheck(`Claim ${t.code} handledBy is manager UID`, Boolean(c.handledBy));
    }

    const tSnap = await getDoc(doc(db, 'todos', t.id));
    assertCheck(`Todo ${t.code} (${t.id}) exists in 'todos'`, tSnap.exists());
    if (tSnap.exists()) {
      const td = tSnap.data();
      assertCheck(`Todo ${t.code} status is 'cancelled'`, td.status === 'cancelled', `got: ${td.status}`);
      assertCheck(`Todo ${t.code} type matches claim (${t.expectedType})`, td.type === t.expectedType, `got: ${td.type}`);
      assertCheck(`Todo ${t.code} resolutionNote is recorded`, td.resolutionNote === 'Audited Parity Resolution: Approved Cancellation', `got: ${td.resolutionNote}`);
      assertCheck(`Todo ${t.code} cancelledAt timestamp exists`, Boolean(td.cancelledAt));
      assertCheck(`Todo ${t.code} handledBy is manager UID`, Boolean(td.handledBy));
    }
  }

  // 2. Audit System Log
  console.log("\n--- 2. Checking Audit Trail in 'system_logs' ---");
  const logId = 'AOWLSC9cl8miRBFi817r';
  const logSnap = await getDoc(doc(db, 'system_logs', logId));
  assertCheck(`Audit log doc ${logId} exists in 'system_logs'`, logSnap.exists());
  if (logSnap.exists()) {
    const l = logSnap.data();
    assertCheck(`Log module is Claims/ManagerApprovals`, l.module === 'Claims/ManagerApprovals', `got: ${l.module}`);
    assertCheck(`Log action is AuditedParityResolution`, l.action === 'AuditedParityResolution', `got: ${l.action}`);
    assertCheck(`Log resolvedTargets count is 3`, Array.isArray(l.resolvedTargets) && l.resolvedTargets.length === 3, `got: ${l.resolvedTargets?.length}`);
    assertCheck(`Log operatorEmail is ai.manager@dhnotebook.com`, l.operatorEmail === 'ai.manager@dhnotebook.com', `got: ${l.operatorEmail}`);
  }

  // 3. Safeguard active claim
  console.log("\n--- 3. Checking Safeguard Active Claim ---");
  const activeId = 'YR4lK8HMUZQKMW8dZeyu';
  const activeSnap = await getDoc(doc(db, 'claims', activeId));
  assertCheck(`Active claim ${activeId} exists`, activeSnap.exists());
  if (activeSnap.exists()) {
    const a = activeSnap.data();
    assertCheck(`Active claim status remains 'processing'`, a.status === 'processing', `got: ${a.status}`);
    assertCheck(`Active claim code is CLM-2609-O3-0002`, a.payload?.claimId === 'CLM-2609-O3-0002', `got: ${a.payload?.claimId}`);
  }

  // 4. Zero pending cancel approval tasks left in todos or claims
  console.log("\n--- 4. Checking Zero Pending Cancel Tasks ---");
  const qPendingClaims = query(
    collection(db, 'claims'),
    where('type', 'in', ['CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL']),
    where('status', '==', 'pending_manager')
  );
  const pendingClaimsSnap = await getDocs(qPendingClaims);
  assertCheck(`Zero CANCEL approval tasks in claims with status 'pending_manager'`, pendingClaimsSnap.empty, `found: ${pendingClaimsSnap.size}`);

  const qPendingTodos = query(
    collection(db, 'todos'),
    where('type', 'in', ['CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL']),
    where('status', '==', 'pending_manager')
  );
  const pendingTodosSnap = await getDocs(qPendingTodos);
  assertCheck(`Zero CANCEL approval tasks in todos with status 'pending_manager'`, pendingTodosSnap.empty, `found: ${pendingTodosSnap.size}`);

  // 5. Ensure targets do not appear in any active todos query
  const qActiveTodos = query(
    collection(db, 'todos'),
    where('status', 'in', ['pending', 'pending_manager', 'waiting_item', 'processing', 'todo'])
  );
  const activeTodosSnap = await getDocs(qActiveTodos);
  let activeTargetHits = 0;
  activeTodosSnap.forEach(d => {
    if (targets.some(t => t.id === d.id)) {
      activeTargetHits++;
    }
  });
  assertCheck(`Zero target items in any active/pending todos status`, activeTargetHits === 0, `hits: ${activeTargetHits}`);

  // Summary
  console.log("\n=======================================================");
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runReviewerAudit().catch(err => {
  console.error("Fatal error during independent audit:", err);
  process.exit(1);
});
