import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, limit, query, where 
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

async function runAudit() {
  console.log("=== DATA FORENSIC AUDIT: CLAIMS & TODOS PARITY ===");
  console.log("Logging in as ai.manager@dhnotebook.com...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("Logged in UID:", cred.user.uid);

  const targetCodes = ['CLM-2608-O2-0001', 'CLM-2607-O1-0002', 'RTN-2607-O3-0001'];
  
  console.log("\n==================================================");
  console.log("1. INSPECTING TARGET ITEMS IN 'claims' & 'todos'");
  console.log("==================================================");

  for (const code of targetCodes) {
    console.log(`\n>>> Target Item: ${code} <<<`);
    
    // Check claims by direct doc ID
    const claimDocRef = doc(db, 'claims', code);
    const claimDocSnap = await getDoc(claimDocRef);
    if (claimDocSnap.exists()) {
      console.log(`[FOUND in claims (by doc.id)]: id=${claimDocSnap.id}`, JSON.stringify(claimDocSnap.data(), null, 2));
    } else {
      console.log(`[NOT FOUND in claims by direct doc id: ${code}]`);
    }

    // Query claims by payload.claimId / returnId / exchangeId
    const qClaim = query(
      collection(db, 'claims'),
      where('payload.claimId', '==', code)
    );
    const claimSnap = await getDocs(qClaim);
    if (!claimSnap.empty) {
      claimSnap.forEach(d => console.log(`[FOUND in claims (where payload.claimId==${code})]: id=${d.id}`, JSON.stringify(d.data(), null, 2)));
    }

    const qRtn = query(
      collection(db, 'claims'),
      where('payload.returnId', '==', code)
    );
    const rtnSnap = await getDocs(qRtn);
    if (!rtnSnap.empty) {
      rtnSnap.forEach(d => console.log(`[FOUND in claims (where payload.returnId==${code})]: id=${d.id}`, JSON.stringify(d.data(), null, 2)));
    }

    // Check todos by direct doc ID
    const todoDocRef = doc(db, 'todos', code);
    const todoDocSnap = await getDoc(todoDocRef);
    if (todoDocSnap.exists()) {
      console.log(`[FOUND in todos (by doc.id)]: id=${todoDocSnap.id}`, JSON.stringify(todoDocSnap.data(), null, 2));
    } else {
      console.log(`[NOT FOUND in todos by direct doc id: ${code}]`);
    }

    // Query todos by payload.claimId / returnId
    const qTodoClaim = query(
      collection(db, 'todos'),
      where('payload.claimId', '==', code)
    );
    const todoClaimSnap = await getDocs(qTodoClaim);
    if (!todoClaimSnap.empty) {
      todoClaimSnap.forEach(d => console.log(`[FOUND in todos (where payload.claimId==${code})]: id=${d.id}`, JSON.stringify(d.data(), null, 2)));
    }

    const qTodoRtn = query(
      collection(db, 'todos'),
      where('payload.returnId', '==', code)
    );
    const todoRtnSnap = await getDocs(qTodoRtn);
    if (!todoRtnSnap.empty) {
      todoRtnSnap.forEach(d => console.log(`[FOUND in todos (where payload.returnId==${code})]: id=${d.id}`, JSON.stringify(d.data(), null, 2)));
    }
  }

  console.log("\n==================================================");
  console.log("2. ACTIVE / PENDING TASKS IN 'todos' COLLECTION");
  console.log("==================================================");
  
  const qTodosPending = query(
    collection(db, 'todos'),
    where('status', 'in', ['pending', 'pending_manager', 'waiting_item', 'processing', 'todo']),
    limit(100)
  );
  const todosPendingSnap = await getDocs(qTodosPending);
  console.log(`Total pending/active tasks in 'todos': ${todosPendingSnap.size}`);
  todosPendingSnap.forEach(d => {
    const data = d.data();
    console.log(`- Todo ID: ${d.id} | Type: ${data.type || data.taskType} | Status: ${data.status} | Title: ${data.title} | RefId: ${data.referenceId || data.orderId || '-'}`);
    console.log(`  Payload summary:`, JSON.stringify({
      claimId: data.payload?.claimId,
      returnId: data.payload?.returnId,
      orderId: data.payload?.orderId || data.orderId,
      customerUid: data.payload?.customerUid || data.customerUid,
      sku: data.payload?.sku
    }));
  });

  console.log("\n==================================================");
  console.log("3. ALL CLAIM / RETURN TASKS IN 'todos' (ANY STATUS)");
  console.log("==================================================");
  const claimTypes = [
    'CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 
    'CANCEL_RETURN_APPROVAL', 'EXCHANGE_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL'
  ];
  for (const t of claimTypes) {
    const qt = query(collection(db, 'todos'), where('type', '==', t), limit(20));
    const snap = await getDocs(qt);
    console.log(`Todos with type == '${t}': ${snap.size}`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`  * Doc: ${d.id} | Status: ${data.status} | Title: ${data.title} | Ref: ${data.referenceId || '-'}`);
    });
  }

  console.log("\n==================================================");
  console.log("4. ACTIVE / PENDING RECORDS IN 'claims' COLLECTION");
  console.log("==================================================");
  const qClaimsPending = query(
    collection(db, 'claims'),
    where('status', 'in', ['pending', 'pending_manager', 'waiting_item', 'processing']),
    limit(100)
  );
  const claimsPendingSnap = await getDocs(qClaimsPending);
  console.log(`Total pending/active records in 'claims': ${claimsPendingSnap.size}`);
  claimsPendingSnap.forEach(d => {
    const data = d.data();
    console.log(`- Claim Doc ID: ${d.id} | Type: ${data.type} | Status: ${data.status} | Title: ${data.title}`);
    console.log(`  Payload:`, JSON.stringify(data.payload, null, 2));
  });

  console.log("\n==================================================");
  console.log("5. CANCEL RECORDS IN 'claims' COLLECTION");
  console.log("==================================================");
  const cancelTypes = ['CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL'];
  for (const ct of cancelTypes) {
    const qct = query(collection(db, 'claims'), where('type', '==', ct), limit(20));
    const snap = await getDocs(qct);
    console.log(`Claims with type == '${ct}': ${snap.size}`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`  * Claim Doc: ${d.id} | Status: ${data.status} | Title: ${data.title} | OriginalStatus: ${data.originalStatus} | CancelReason: ${data.cancelReason}`);
      console.log(`    Payload:`, JSON.stringify(data.payload));
    });
  }

  console.log("\n==================================================");
  console.log("6. AUDIT AUDITED ORDERS & USERS FOR TARGETS");
  console.log("==================================================");
  // Check orders for targets
  const orderIds = ['DH-2608-O2-0001', 'DH-2607-O1-0002', 'DH-2607-O3-0001'];
  // Also check if any order has matching orderId or id
  for (const oid of orderIds) {
    const oSnap = await getDoc(doc(db, 'orders', oid));
    if (oSnap.exists()) {
      console.log(`[ORDER FOUND] /orders/${oid}:`, JSON.stringify(oSnap.data(), null, 2));
    } else {
      console.log(`[ORDER NOT FOUND by doc id: /orders/${oid}]`);
    }
  }

  console.log("\n=== AUDIT COMPLETE ===");
  process.exit(0);
}

runAudit().catch(err => {
  console.error("FATAL ERROR IN AUDIT SCRIPT:", err);
  process.exit(1);
});
