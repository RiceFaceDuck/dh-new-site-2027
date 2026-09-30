import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, limit, query, where 
} from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspectTargetDetails() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  const targets = [
    { code: 'CLM-2608-O2-0001', docId: 'IJoca8dJDmvZm7u0Sbo6', orderDocId: 'DH-26-0013', orderId: 'DH-26-0013', customerUid: 'gMCHAeIOuQfGghCNI3PU', sku: 'LED14009', swapSku: 'LED14015' },
    { code: 'CLM-2607-O1-0002', docId: 'nVrnTQ8BTxNyZEVXBSuU', orderDocId: '0aCVZNSu4sRNTqIKw0me', orderId: 'DH-38143-2026', customerUid: 'frrnoxNd4KM5efzFLpQR', sku: 'ADAC001', swapSku: 'ADAC002' },
    { code: 'RTN-2607-O3-0001', docId: 'Ql6z5DaEQ9gW7JmYxnDs', orderDocId: 'DH-26-0008', orderId: 'DH-26-0008', customerUid: 'gMCHAeIOuQfGghCNI3PU', sku: 'FADE001' }
  ];

  for (const t of targets) {
    console.log(`\n======================================================`);
    console.log(`TARGET: ${t.code} (Doc ID: ${t.docId})`);
    console.log(`======================================================`);
    
    // Claim doc
    const cSnap = await getDoc(doc(db, 'claims', t.docId));
    console.log(`CLAIMS DOC [${t.docId}]:`);
    console.log(JSON.stringify(cSnap.data(), null, 2));

    // Todo doc
    const todoSnap = await getDoc(doc(db, 'todos', t.docId));
    console.log(`TODOS DOC [${t.docId}]:`);
    console.log(JSON.stringify(todoSnap.data(), null, 2));

    // Order doc (by orderDocId and by orderId)
    console.log(`\nORDER DOCS:`);
    const oSnap1 = await getDoc(doc(db, 'orders', t.orderDocId));
    if (oSnap1.exists()) {
      console.log(`- Order by docId [${t.orderDocId}]:`, JSON.stringify(oSnap1.data(), null, 2));
    } else {
      console.log(`- Order by docId [${t.orderDocId}]: NOT FOUND`);
    }

    if (t.orderId !== t.orderDocId) {
      const oSnap2 = await getDoc(doc(db, 'orders', t.orderId));
      if (oSnap2.exists()) {
        console.log(`- Order by orderId [${t.orderId}]:`, JSON.stringify(oSnap2.data(), null, 2));
      } else {
        console.log(`- Order by orderId [${t.orderId}]: NOT FOUND`);
      }
    }

    // Customer doc
    console.log(`\nCUSTOMER DOC:`);
    if (t.customerUid && t.customerUid !== 'Walk-in') {
      const uSnap = await getDoc(doc(db, 'users', t.customerUid));
      if (uSnap.exists()) {
        const u = uSnap.data();
        console.log(`- User [${t.customerUid}]: accountName=${u.accountName}, name=${u.name}, walletBalance=${u.walletBalance}, creditPoints=${u.creditPoints}, totalAccumulatedPoints=${u.totalAccumulatedPoints}`);
      } else {
        console.log(`- User [${t.customerUid}]: NOT FOUND`);
      }
    }

    // Product doc
    console.log(`\nPRODUCT DOCS:`);
    const pSnap1 = await getDoc(doc(db, 'products', t.sku));
    if (pSnap1.exists()) {
      const p = pSnap1.data();
      console.log(`- Product [${t.sku}]: stockQuantity=${p.stockQuantity}, defectQuantity=${p.defectQuantity}, Price=${p.Price}, retailPrice=${p.retailPrice}`);
    } else {
      console.log(`- Product [${t.sku}]: NOT FOUND`);
    }

    if (t.swapSku) {
      const pSnap2 = await getDoc(doc(db, 'products', t.swapSku));
      if (pSnap2.exists()) {
        const p = pSnap2.data();
        console.log(`- Swap Product [${t.swapSku}]: stockQuantity=${p.stockQuantity}, defectQuantity=${p.defectQuantity}, Price=${p.Price}, retailPrice=${p.retailPrice}`);
      } else {
        console.log(`- Swap Product [${t.swapSku}]: NOT FOUND`);
      }
    }
  }

  process.exit(0);
}

inspectTargetDetails().catch(err => {
  console.error(err);
  process.exit(1);
});
