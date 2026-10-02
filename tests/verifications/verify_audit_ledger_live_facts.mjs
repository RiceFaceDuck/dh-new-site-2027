import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, collectionGroup, getDocs, limit, query, orderBy } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function checkLiveAuditLedger() {
  console.log("=== Fact-Check: Real Firebase Firestore Audit Ledger Data ===");
  try {
    console.log("1. Authenticating as staff...");
    const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("   Authenticated UID:", cred.user.uid);

    console.log("\n2. Checking root 'credit_transactions'...");
    const creditQ = query(collection(db, "credit_transactions"), orderBy("timestamp", "desc"), limit(10));
    const creditSnap = await getDocs(creditQ);
    console.log(`   Found ${creditSnap.size} credit transactions (limited to 10 sample)`);
    if (creditSnap.size > 0) {
      console.log("   Sample Credit TX Doc ID:", creditSnap.docs[0].id);
      console.log("   Sample Credit TX Data:", JSON.stringify(creditSnap.docs[0].data(), null, 2));
    }

    console.log("\n3. Checking collectionGroup('wallet_transactions')...");
    try {
      const walletQ = query(collectionGroup(db, "wallet_transactions"), orderBy("timestamp", "desc"), limit(10));
      const walletSnap = await getDocs(walletQ);
      console.log(`   Found ${walletSnap.size} wallet transactions across all users`);
      if (walletSnap.size > 0) {
        console.log("   Sample Wallet TX Doc Path:", walletSnap.docs[0].ref.path);
        console.log("   Sample Wallet TX Data:", JSON.stringify(walletSnap.docs[0].data(), null, 2));
      }
    } catch (wErr) {
      console.error("   ❌ Error querying collectionGroup('wallet_transactions'):", wErr.message);
    }

  } catch (err) {
    console.error("❌ Fatal Error:", err);
  }
}

checkLiveAuditLedger();
