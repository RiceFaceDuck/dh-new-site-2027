import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boPackagePath = path.resolve(__dirname, '../../dh-backoffice-react/package.json');
const req = createRequire(boPackagePath);

const { initializeApp } = await import(pathToFileURL(req.resolve('firebase/app')).href);
const { getAuth, signInWithEmailAndPassword } = await import(pathToFileURL(req.resolve('firebase/auth')).href);
const { getFirestore, doc, getDoc, collection, getDocs, limit, query } = await import(pathToFileURL(req.resolve('firebase/firestore')).href);

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('=== Inspecting Live Firestore Manifest, Shards and Products ===');

try {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log('✅ Staff Authenticated');

  // 1. Read Manifest
  const manifestSnap = await getDoc(doc(db, 'catalogs', 'search_index'));
  if (manifestSnap.exists()) {
    console.log('Manifest data:', manifestSnap.data());
  } else {
    console.log('Manifest does not exist!');
  }

  // 2. Read Shards
  const shardItems = [];
  for (let i = 1; i <= 7; i++) {
    const snap = await getDoc(doc(db, 'catalogs', `search_index_p${i}`));
    if (snap.exists()) {
      const items = snap.data()?.items || [];
      console.log(`Shard p${i}: ${items.length} items`);
      shardItems.push(...items);
    } else {
      console.log(`Shard p${i}: NOT FOUND`);
    }
  }
  console.log(`Total Shard items: ${shardItems.length}`);

  // 3. Sample check 5 products between shard and products collection
  const shardMap = new Map();
  shardItems.forEach(it => {
    if (it.sku) shardMap.set(String(it.sku).trim().toUpperCase(), it);
  });

  const sampleSkus = ['ADAC001', 'CAAS019', 'FAAS064', 'KBAS156', 'LED15630-1'];
  for (const sku of sampleSkus) {
    const pSnap = await getDoc(doc(db, 'products', sku));
    if (pSnap.exists()) {
      const pData = pSnap.data();
      const sData = shardMap.get(sku);
      console.log(`SKU ${sku}: Products stock=${pData.stockQuantity}, Shard stock=${sData?.stockQuantity}, Price=${pData.Price}/${sData?.Price}`);
    } else {
      console.log(`SKU ${sku}: not in products collection!`);
    }
  }

  console.log('✅ Stock Parity Inspection completed cleanly');
  process.exit(0);
} catch (err) {
  console.error('Error inspecting Firestore:', err);
  process.exit(1);
}
