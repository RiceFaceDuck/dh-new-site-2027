import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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
const auth = getAuth(app);
const db = getFirestore(app);

const CUSTOMER_UID = 'y2rGbkQNZugOcSebVUx5xdYNpjs1';

async function verify() {
  console.log("🔑 Logging in as ai.manager@dhnotebook.com...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("✅ Logged in successfully!");

  console.log("\n=== 1. TEST DIRECT PATH CREDIT TRANSACTIONS ===");
  // ระบบอาจจะใช้ appId เป็น "dh-notebook"
  // ลองหาในคอลเลกชัน credit_transactions ( root collection )
  try {
    const rootCreditRef = collection(db, getCollectionPath('credit_transactions'));
    const snap = await getDocs(query(rootCreditRef, orderBy('timestamp', 'desc'), limit(5)));
    console.log(`Root 'credit_transactions' size: ${snap.size}`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`Tx ID: ${d.id} | Uid: ${data.uid} | Amt: ${data.amount} | Type: ${data.type} | Ref: ${data.referenceId}`);
    });
  } catch (e) {
    console.log("Failed reading root credit_transactions:", e.message);
  }

  console.log("\n=== 2. TEST ARTIFACTS PATH CREDIT TRANSACTIONS ===");
  const possiblePaths = [
    'artifacts/dh-notebook/public/data/credit_transactions',
    'artifacts/default-app-id/public/data/credit_transactions'
  ];

  for (const path of possiblePaths) {
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('timestamp', 'desc'), limit(5)));
      console.log(`Path '${path}' size: ${snap.size}`);
      snap.forEach(d => {
        const data = d.data();
        console.log(`Tx ID: ${d.id} | Uid: ${data.uid} | Amt: ${data.amount} | Type: ${data.type} | Ref: ${data.referenceId || data.transactionId}`);
      });
    } catch (e) {
      console.log(`Failed reading path '${path}':`, e.message);
    }
  }

  process.exit(0);
}

verify().catch(console.error);
