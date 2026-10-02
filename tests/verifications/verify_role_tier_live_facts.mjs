import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs, limit, query } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspectRoleTierFacts() {
  console.log("Authenticating as manager...");
  try {
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Auth success: UID =", auth.currentUser?.uid);
  } catch (err) {
    console.log("Auth warning (proceeding as unauthenticated if allowed):", err.message);
  }

  // 1. Inspect settings/role_tier_config
  try {
    const snap = await getDoc(doc(db, 'settings', 'role_tier_config'));
    if (snap.exists()) {
      console.log("\n=== [FOUND] settings/role_tier_config ===");
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("\n=== [NOT FOUND] settings/role_tier_config ===");
    }
  } catch (e) {
    console.error("Error reading settings/role_tier_config:", e.message);
  }

  // 2. Inspect Sample Users Roles & Ranks
  try {
    console.log("\n=== [INSPECTING USERS] Sample 15 users ===");
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(15)));
    const sample = usersSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName || data.storeName || data.name || data.accountName,
        role: data.role,
        rank: data.rank,
        customerType: data.customerType,
        totalAccumulatedPoints: data.totalAccumulatedPoints,
        creditPoints: data.creditPoints,
        points: data.points,
        walletBalance: data.walletBalance
      };
    });
    console.log(JSON.stringify(sample, null, 2));
  } catch (e) {
    console.error("Error inspecting users:", e.message);
  }

  process.exit(0);
}

inspectRoleTierFacts();
