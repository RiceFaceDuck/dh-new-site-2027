import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function check() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  const cSnap = await getDoc(doc(db, "claims", "IJoca8dJDmvZm7u0Sbo6"));
  console.log("=== CLAIM IJoca8dJDmvZm7u0Sbo6 ===");
  console.log(JSON.stringify(cSnap.data(), null, 2));

  const tSnap = await getDoc(doc(db, "todos", "IJoca8dJDmvZm7u0Sbo6"));
  console.log("\n=== TODO IJoca8dJDmvZm7u0Sbo6 ===");
  console.log(JSON.stringify(tSnap.data(), null, 2));

  const oSnap = await getDoc(doc(db, "orders", "DH-26-0013"));
  console.log("\n=== ORDER DH-26-0013 ===");
  console.log(JSON.stringify(oSnap.data(), null, 2));

  const p1Snap = await getDoc(doc(db, "products", "LED14009"));
  console.log("\n=== PRODUCT LED14009 ===");
  console.log(JSON.stringify(p1Snap.data(), null, 2));

  const p2Snap = await getDoc(doc(db, "products", "LED14015"));
  console.log("\n=== PRODUCT LED14015 ===");
  console.log(JSON.stringify(p2Snap.data(), null, 2));
  
  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
