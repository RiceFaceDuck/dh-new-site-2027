import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function run() {
  console.log("Logging in as staff...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("Logged in!");

  console.log("\n--- Searching todos for IP2WWPU2 or ซ่อมคอมฮับ ---");
  const todosSnap = await getDocs(collection(db, "todos"));
  let matchedTodo = null;
  todosSnap.forEach(d => {
    const data = d.data();
    if (d.id.toUpperCase().includes("IP2WWPU2") || (data.title && data.title.includes("ซ่อมคอมฮับ")) || (data.customerName && data.customerName.includes("ซ่อมคอมฮับ"))) {
      console.log("Found matched todo doc ID:", d.id);
      console.log("Todo Data:", JSON.stringify(data, null, 2));
      matchedTodo = { id: d.id, ...data };
    }
  });

  if (matchedTodo) {
    const uid = matchedTodo.partnerId || matchedTodo.createdBy || matchedTodo.targetSkuId?.replace('AD-CARD-', '');
    console.log("\n--- Found UID from Todo:", uid);
    if (uid) {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        console.log("Found User Data in 'users':", JSON.stringify(userDoc.data(), null, 2));
      } else {
        console.log("User doc not found in 'users' with id:", uid);
      }
    }
  }

  console.log("\n--- Searching users collection for phone 0952726574 ---");
  const phoneQuery = query(collection(db, "users"), where("phone", "==", "0952726574"));
  const phoneSnap = await getDocs(phoneQuery);
  phoneSnap.forEach(d => {
    console.log("Found user by phone:", d.id, d.data());
  });

  console.log("\n--- Searching users for name/storeName containing ซ่อมคอมฮับ ---");
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(d => {
    const u = d.data();
    const str = JSON.stringify(u);
    if (str.includes("ซ่อมคอมฮับ") || str.includes("0952726574") || d.id.toUpperCase().includes("IP2WWPU2")) {
      console.log("Found user matching string:", d.id, "Name:", u.name || u.displayName, "phone:", u.phone, "code:", u.customerCode, "customerId:", u.customerId);
      console.log("Full data:", JSON.stringify(u, null, 2));
    }
  });
}

run().catch(console.error);
