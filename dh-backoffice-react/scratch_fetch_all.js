import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const q = query(
      collection(db, 'todos'),
      orderBy('createdAt', 'desc'),
      limit(20)
  );
  const claimSnap = await getDocs(q);
  claimSnap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | SKU: ${data.payload?.sku} | Type: ${data.type} | PDate: ${data.payload?.purchaseDate} | CDate: ${data.createdAt?.toDate?.()}`);
  });
  process.exit(0);
}
check();
