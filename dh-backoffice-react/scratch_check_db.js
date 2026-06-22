import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61",
  measurementId: "G-WN1STHEG7N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const docRef = doc(db, 'settings', 'warranty');
  const snap = await getDoc(docRef);
  console.log("=== WARRANTY SETTINGS ===");
  if (snap.exists()) {
    console.dir(snap.data(), { depth: null });
  } else {
    console.log("No warranty settings found");
  }

  console.log("\n=== RECENT CLAIMS ===");
  const q = query(
      collection(db, 'todos'),
      where('type', 'in', ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']),
      limit(5)
  );
  const claimSnap = await getDocs(q);
  claimSnap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id}`);
    console.log(`Type: ${data.type}`);
    console.log(`Payload SKU: ${data.payload?.sku}`);
    console.log(`Payload Action: ${data.payload?.actionType}`);
    console.log(`Purchase Date: ${data.payload?.purchaseDate}`);
    console.log(`Created At: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
    console.log("----------------------");
  });
  
  process.exit(0);
}

check();
