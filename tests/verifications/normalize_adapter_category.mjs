import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, writeBatch, serverTimestamp } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const isApply = process.argv.includes('--apply');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log(`\n======================================================`);
  console.log(`🔧 Phase 3: Normalize lowercase "adapter" -> "Adapter"`);
  console.log(`- Mode: ${isApply ? '⚡ LIVE APPLY (อัปเดต Firestore + Search Shards จริง)' : '🛡️ DRY-RUN (อ่านตรวจสอบอย่างเดียว ไม่เขียน DB)'}`);
  console.log(`======================================================\n`);

  // 1. Scan 7 catalog shards (7 reads only - Quota Shield)
  const shardTargets = []; // { shardId, shardData, matchedSkus }
  const candidateSkus = new Set();

  for (let i = 1; i <= 7; i++) {
    const shardId = `search_index_p${i}`;
    const snap = await getDoc(doc(db, 'catalogs', shardId));
    if (!snap.exists()) continue;
    const data = snap.data();
    const items = Array.isArray(data.items) ? data.items : [];
    const matched = [];
    for (const item of items) {
      if (item && item.category === 'adapter') {
        const sku = item.sku || item.id;
        if (sku) {
          candidateSkus.add(sku);
          matched.push(sku);
        }
      }
    }
    if (matched.length > 0) {
      shardTargets.push({ shardId, data, matched });
    }
  }

  console.log(`🔍 พบสินค้าหมวดหมู่ "adapter" (ตัวพิมพ์เล็ก) ใน 7 Shards: ${candidateSkus.size} รายการ`);

  // 2. Verify live Firestore documents in `products/{sku}`
  const confirmedProducts = [];
  for (const sku of candidateSkus) {
    const pSnap = await getDoc(doc(db, 'products', sku));
    if (pSnap.exists()) {
      const pData = pSnap.data();
      if (pData.category === 'adapter') {
        confirmedProducts.push({ sku, name: pData.name || '(no name)', currentCategory: pData.category });
      } else {
        console.log(`   [SKIP] ${sku}: Firestore จริงเป็น "${pData.category}" แล้ว (เฉพาะ Shard ที่ค้างเก่า)`);
      }
    } else {
      console.log(`   [WARN] ${sku}: ไม่พบเอกสารใน products/`);
    }
  }

  console.log(`✅ ยืนยันตรงกับ Firestore จริง (products/): ${confirmedProducts.length} รายการ`);
  console.log(`📦 Shards ที่ต้องซิงค์: ${shardTargets.map(s => `${s.shardId} (${s.matched.length})`).join(', ') || 'ไม่มี'}\n`);

  confirmedProducts.forEach((p, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, ' ')}. ${p.sku} | "${p.currentCategory}" -> "Adapter" | ${p.name}`);
  });

  if (!isApply) {
    console.log(`\n🛡️ จบโหมด DRY-RUN (0 Writes) — หากยืนยันให้รันด้วย --apply เพื่ออัปเดตจริง`);
    process.exit(0);
  }

  // 3. Authenticate as Manager for LIVE APPLY
  console.log(`\n🔑 กำลังยืนยันตัวตนเพื่ออัปเดตฐานข้อมูล...`);
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");

  const batch = writeBatch(db);
  for (const p of confirmedProducts) {
    batch.update(doc(db, 'products', p.sku), {
      category: 'Adapter',
      updatedAt: serverTimestamp()
    });
  }

  for (const target of shardTargets) {
    const updatedItems = (target.data.items || []).map(item => {
      if (item && item.category === 'adapter') {
        return { ...item, category: 'Adapter' };
      }
      return item;
    });
    batch.update(doc(db, 'catalogs', target.shardId), {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  }

  await batch.commit();
  console.log(`🎉 LIVE APPLY สำเร็จ! อัปเดต products (${confirmedProducts.length} docs) + catalogs (${shardTargets.length} shards) เรียบร้อยแล้ว`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
