import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";
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
const db = getFirestore(app);

async function check() {
  console.log("=== PANEL PRODUCTS ===");
  const productsSnap = await getDocs(query(collection(db, getCollectionPath('products')), where('category', '==', 'Panel'), limit(5)));
  productsSnap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Name: ${data.name} | SKU: ${data.sku} | Price: ${data.Price} | RetailPrice: ${data.retailPrice} | Stock: ${data.stockQuantity} | Category: ${data.category}`);
  });

  console.log("\n=== FREEBIE TO0158 ===");
  const freebieItemSnap = await getDocs(query(collection(db, getCollectionPath('products')), where('sku', '==', 'TO0158')));
  freebieItemSnap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Name: ${data.name} | SKU: ${data.sku} | Price: ${data.Price} | RetailPrice: ${data.retailPrice} | Stock: ${data.stockQuantity} | Category: ${data.category}`);
  });

  process.exit(0);
}

check().catch(console.error);
