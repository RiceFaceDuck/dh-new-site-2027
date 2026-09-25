import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs, limit, query, where } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspect() {
  console.log("=== 1. Checking catalogs/home_showcase ===");
  try {
    const snap = await getDoc(doc(db, "catalogs", "home_showcase"));
    console.log("catalogs/home_showcase exists:", snap.exists());
    if (snap.exists()) {
      const data = snap.data();
      console.log("Total items:", data.items?.length);
      console.log("All SKUs in home_showcase:", data.items?.map(i => i.sku).join(', '));
      const inStock = data.items?.filter(i => i.inStock || i.stockQuantity > 0);
      console.log("In-stock items:", inStock?.length);
      console.log("First 3 items:", JSON.stringify(data.items?.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error("Error checking home_showcase:", err.message);
  }

  console.log("\n=== 2. Checking SKUs from screenshot in products collection ===");
  const testSkus = ['KBAS047', 'ADAC006', 'ADAC015', 'KBAC024', 'CAAS003', 'LED15610', 'ADAC012', 'ADAC013', 'LED15648'];
  for (const sku of testSkus) {
    const pSnap = await getDoc(doc(db, "products", sku));
    if (pSnap.exists()) {
      const d = pSnap.data();
      console.log(`SKU ${sku}: stockQuantity=${d.stockQuantity}, qty=${d.qty}, stock=${d.stock}, isActive=${d.isActive}`);
    } else {
      console.log(`SKU ${sku}: NOT FOUND in products`);
    }
  }

  console.log("\n=== 3. Checking general products stock distribution ===");
  const qActive = query(collection(db, "products"), limit(50));
  const snapActive = await getDocs(qActive);
  let withPositiveStock = 0;
  let zeroOrNegativeStock = 0;
  snapActive.forEach(docSnap => {
    const d = docSnap.data();
    const stock = Number(d.stockQuantity ?? d.qty ?? d.stock ?? 0);
    if (stock > 0) withPositiveStock++;
    else zeroOrNegativeStock++;
  });
  console.log(`Sample 50 products: ${withPositiveStock} have stock > 0, ${zeroOrNegativeStock} have stock <= 0`);

  process.exit(0);
}

inspect().catch(e => { console.error(e); process.exit(1); });
