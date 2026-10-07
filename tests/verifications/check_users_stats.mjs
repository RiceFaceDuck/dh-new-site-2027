import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  const sampleUids = [
    "0AUxlnHivLdwa4gxTAGO9yWmhS82", // Kwan oneself IT SHOP
    "2vcWUIonjYPLgSVLX7Gy",         // คุณกำพล แก้วคำ
    "uaJw3nutwPGxLVlCEsMk"          // ร้านต่อคอมพิวเตอร์ (in active 30d)
  ];

  for (const uid of sampleUids) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const d = snap.data();
      console.log(`\nUID: ${uid} | Name: ${d.displayName || d.accountName}`);
      console.log(`  lastOrderDate:`, d.lastOrderDate);
      console.log(`  lastPurchaseDate:`, d.lastPurchaseDate);
      console.log(`  stats:`, d.stats);
      console.log(`  orderCount:`, d.orderCount);
      console.log(`  sales30Days:`, d.sales30Days);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
