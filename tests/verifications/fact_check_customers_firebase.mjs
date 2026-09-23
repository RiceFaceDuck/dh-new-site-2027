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

async function inspect() {
  console.log("=== Fact-Check: Real Firebase Firestore Customers Data ===");
  console.log("Logging in as staff (ai.manager@dhnotebook.com)...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("Logged in UID:", cred.user.uid);

  console.log("\n--- 1. Checking catalogs/customers_directory ---");
  const dirSnap = await getDoc(doc(db, "catalogs", "customers_directory"));
  if (dirSnap.exists()) {
    const data = dirSnap.data();
    console.log("[FOUND] catalogs/customers_directory exists!");
    console.log("Fields:", Object.keys(data));
    console.log("chunkId:", data.chunkId);
    console.log("type:", data.type);
    console.log("chunkCount:", data.chunkCount);
    console.log("totalCustomers:", data.totalCustomers);
    console.log("generatedAt:", data.generatedAt);
    const custArr = Array.isArray(data.customers) ? data.customers : (Array.isArray(data.items) ? data.items : []);
    console.log("Inline customer array count:", custArr.length);
    if (custArr.length > 0) {
      console.log("Sample customer from directory:", JSON.stringify(custArr[0], null, 2));
    }
  } else {
    console.log("[MISSING] catalogs/customers_directory does NOT exist!");
  }

  console.log("\n--- 2. Checking catalogs/customers_directory_p1 ---");
  const p1Snap = await getDoc(doc(db, "catalogs", "customers_directory_p1"));
  if (p1Snap.exists()) {
    const data = p1Snap.data();
    console.log("[FOUND] catalogs/customers_directory_p1 exists!");
    console.log("Fields:", Object.keys(data));
    console.log("chunkId:", data.chunkId, "type:", data.type, "page:", data.page, "totalChunks:", data.totalChunks, "totalCustomers:", data.totalCustomers);
    const items = data.customers || data.items || [];
    console.log("Items in p1:", items.length);
    if (items.length > 0) {
      console.log("Sample customer from p1:", JSON.stringify(items[0], null, 2));
    }
  } else {
    console.log("[INFO] catalogs/customers_directory_p1 does NOT exist.");
  }

  console.log("\n--- 3. Checking catalogs/customers_active_30d ---");
  const activeSnap = await getDoc(doc(db, "catalogs", "customers_active_30d"));
  if (activeSnap.exists()) {
    const data = activeSnap.data();
    console.log("[FOUND] catalogs/customers_active_30d exists!");
    console.log("Fields:", Object.keys(data));
    console.log("version:", data.version, "updatedAt:", data.updatedAt);
    const customersMap = data.customers || data.items || {};
    const mapKeys = Object.keys(customersMap);
    console.log("Active customers map count:", mapKeys.length);
    if (mapKeys.length > 0) {
      console.log("Sample active customer entry:", JSON.stringify(customersMap[mapKeys[0]], null, 2));
    }
  } else {
    console.log("[INFO] catalogs/customers_active_30d does NOT exist.");
  }

  console.log("\n--- 4. Checking users collection sample ---");
  const usersQ = query(collection(db, "users"), limit(5));
  const usersSnap = await getDocs(usersQ);
  console.log("Fetched sample users docs count:", usersSnap.size);
  usersSnap.forEach(d => {
    const u = d.data();
    console.log(`Doc ID: ${d.id} | Name: ${u.displayName || u.accountName || u.name} | AccountId: ${u.accountId} | CustomerCode: ${u.customerCode} | Phone: ${u.phone || u.phoneNumber} | Role: ${u.role}`);
  });
}

inspect().catch(err => console.error("Inspection error:", err));
