/**
 * Adversarial Deep Stress & Forensic Invariant Inspection
 * File: Management System/tests/verifications/verify_m1_deep_stress.mjs
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

async function runDeepStress() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");

  console.log("=== 1. ALL PENDING/PENDING_MANAGER TODOS IN DATABASE ===");
  const pendingTodosSnap = await getDocs(
    query(collection(db, 'todos'), where('status', 'in', ['pending', 'pending_manager']))
  );
  console.log(`Total todos with status in ['pending', 'pending_manager']: ${pendingTodosSnap.size}`);
  const pendingByType = {};
  pendingTodosSnap.forEach(d => {
    const data = d.data();
    const t = data.type || 'UNKNOWN';
    pendingByType[t] = (pendingByType[t] || 0) + 1;
  });
  console.log("Breakdown by type:", JSON.stringify(pendingByType, null, 2));

  console.log("\n=== 2. SAFEGUARD ACTIVE CLAIM (YR4lK8HMUZQKMW8dZeyu) DETAILS ===");
  const safeDoc = await getDoc(doc(db, 'claims', 'YR4lK8HMUZQKMW8dZeyu'));
  if (safeDoc.exists()) {
    const data = safeDoc.data();
    console.log({
      id: safeDoc.id,
      status: data.status,
      type: data.type,
      claimId: data.payload?.claimId,
      customerName: data.payload?.customerName,
      customerUid: data.payload?.customerUid,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  } else {
    console.log("SAFEGUARD DOC NOT FOUND!");
  }

  console.log("\n=== 3. PRODUCT INVENTORY STATUS FOR CANCELLED TARGETS ===");
  const skus = ['LED14009', 'LED14015', 'ADAC001', 'ADAC002', 'FADE001'];
  for (const sku of skus) {
    const pSnap = await getDoc(doc(db, 'products', sku));
    if (pSnap.exists()) {
      const p = pSnap.data();
      console.log(`SKU ${sku}: stockQuantity=${p.stockQuantity}, defectQuantity=${p.defectQuantity}, Price=${p.Price}`);
    } else {
      console.log(`SKU ${sku}: NOT FOUND`);
    }
  }

  process.exit(0);
}

runDeepStress().catch(err => {
  console.error(err);
  process.exit(1);
});
