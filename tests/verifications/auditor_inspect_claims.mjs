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

async function inspectClaims() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  console.log("=== INSPECTING ALL DOCS IN 'claims' ===");
  const allClaimsSnap = await getDocs(collection(db, 'claims'));
  console.log(`Total docs in 'claims': ${allClaimsSnap.size}`);
  
  const statusCounts = {};
  const typeCounts = {};
  const claimsList = [];

  allClaimsSnap.forEach(d => {
    const data = d.data();
    statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
    typeCounts[data.type] = (typeCounts[data.type] || 0) + 1;
    claimsList.push({
      id: d.id,
      type: data.type,
      status: data.status,
      title: data.title,
      code: data.payload?.claimId || data.payload?.returnId || data.payload?.exchangeId,
      orderId: data.payload?.orderId,
      customerUid: data.customerUid || data.payload?.customerUid,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    });
  });

  console.log("Status Counts in 'claims':", JSON.stringify(statusCounts, null, 2));
  console.log("Type Counts in 'claims':", JSON.stringify(typeCounts, null, 2));
  console.log("\nAll Claims Summary:");
  claimsList.forEach(c => {
    console.log(`[${c.id}] | Type: ${c.type} | Status: ${c.status} | Code: ${c.code} | Order: ${c.orderId} | Title: ${c.title.slice(0, 50)}...`);
  });

  process.exit(0);
}

inspectClaims().catch(err => {
  console.error(err);
  process.exit(1);
});
