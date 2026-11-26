import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, writeBatch, serverTimestamp } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";
import { getStorage, ref, uploadBytes, getDownloadURL } from "../../dh-backoffice-react/node_modules/firebase/storage/dist/index.mjs";
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const limitArg = process.argv.find(a => a.startsWith('--limit='));
const processLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const auditPath = path.join(__dirname, 'phase4_image_size_audit.json');
const mappingPath = path.join(__dirname, 'phase4_optimization_mapping.json');

const PY_COMPRESS_SCRIPT = `
import sys, io
from PIL import Image

raw = sys.stdin.buffer.read()
img = Image.open(io.BytesIO(raw))
if img.mode in ("RGBA", "P"):
    img = img.convert("RGBA")
else:
    img = img.convert("RGB")

img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

out = b""
for q in (75, 65, 55, 45):
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=q, method=6)
    out = buf.getvalue()
    if len(out) <= 280 * 1024:
        break

sys.stdout.buffer.write(out)
`;

function compressWithPillow(inputBuffer) {
  const res = spawnSync('python', ['-c', PY_COMPRESS_SCRIPT], {
    input: inputBuffer,
    maxBuffer: 25 * 1024 * 1024
  });
  if (res.status !== 0 || !res.stdout || res.stdout.length < 1000) {
    throw new Error(`Pillow compression failed: ${res.stderr?.toString() || 'empty output'}`);
  }
  return res.stdout;
}

function loadMapping() {
  if (fs.existsSync(mappingPath)) {
    try {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveMapping(map) {
  fs.writeFileSync(mappingPath, JSON.stringify(map, null, 2), 'utf8');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function run() {
  if (!fs.existsSync(auditPath)) {
    throw new Error('Missing phase4_image_size_audit.json. Run audit_oversized_product_images.mjs first.');
  }

  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const list = audit.oversizedList || [];
  const mapping = loadMapping();

  const pending = list.filter(item => !mapping[item.url]).slice(0, processLimit);
  console.log(`\n🚀 Phase 4 Image Optimization`);
  console.log(`- Total oversized (>300KB): ${list.length}`);
  console.log(`- Already optimized (checkpoint): ${Object.keys(mapping).length}`);
  console.log(`- Processing this run: ${pending.length}\n`);

  console.log('🔑 Authenticating with Firebase...');
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");

  let totalOrigBytes = 0;
  let totalNewBytes = 0;
  let uploadedCount = 0;
  let skippedCount = 0;

  // Step 1: Download -> Compress -> Upload -> Verify 200 OK
  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    try {
      const resp = await fetch(item.url);
      if (!resp.ok) {
        console.log(`  [SKIP] ${item.sku}: download failed (${resp.status})`);
        skippedCount++;
        continue;
      }
      const origBuf = Buffer.from(await resp.arrayBuffer());
      const newBuf = compressWithPillow(origBuf);

      if (newBuf.length >= origBuf.length * 0.9) {
        console.log(`  [SKIP] ${item.sku}: already optimal (${(origBuf.length/1024).toFixed(0)}KB -> ${(newBuf.length/1024).toFixed(0)}KB)`);
        mapping[item.url] = { sku: item.sku, skipped: true, origBytes: origBuf.length, newBytes: newBuf.length };
        saveMapping(mapping);
        skippedCount++;
        continue;
      }

      const cleanSku = String(item.sku || 'general').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';
      const storagePath = `products/${cleanSku}/opt_${Date.now()}_${i}.webp`;
      const storageRef = ref(storage, storagePath);

      const snap = await uploadBytes(storageRef, newBuf, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          sku: cleanSku,
          optimizedFromBytes: String(origBuf.length),
          optimizedAt: new Date().toISOString()
        }
      });

      const newUrl = await getDownloadURL(snap.ref);

      // Verify 200 OK before recording
      const checkRes = await fetch(newUrl, { method: 'HEAD' });
      if (!checkRes.ok) {
        throw new Error(`Verify HEAD failed with status ${checkRes.status}`);
      }

      mapping[item.url] = {
        sku: item.sku,
        newUrl,
        origBytes: origBuf.length,
        newBytes: newBuf.length,
        dbSynced: false
      };
      saveMapping(mapping);

      totalOrigBytes += origBuf.length;
      totalNewBytes += newBuf.length;
      uploadedCount++;

      if ((i + 1) % 10 === 0 || i + 1 === pending.length) {
        const pct = Math.round(((i + 1) / pending.length) * 100);
        console.log(`  [${pct}%] ${i + 1}/${pending.length} | ${item.sku}: ${(origBuf.length/1024).toFixed(0)}KB -> ${(newBuf.length/1024).toFixed(0)}KB (200 OK)`);
      }
    } catch (err) {
      console.error(`  [ERR] ${item.sku}:`, err.message);
    }
  }

  // Step 2: Sync unsynced URLs to Firestore `products/{sku}`
  const toSyncEntries = Object.entries(mapping).filter(([, v]) => v && v.newUrl && !v.dbSynced);
  console.log(`\n📝 Syncing ${toSyncEntries.length} optimized URLs to Firestore products/...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < toSyncEntries.length; i += BATCH_SIZE) {
    const slice = toSyncEntries.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let batchOps = 0;

    for (const [oldUrl, info] of slice) {
      const pRef = doc(db, 'products', info.sku);
      const pSnap = await getDoc(pRef);
      if (!pSnap.exists()) continue;
      const pData = pSnap.data();
      const updates = {};

      if (pData.image === oldUrl) updates.image = info.newUrl;
      if (pData.imageUrl === oldUrl) updates.imageUrl = info.newUrl;
      if (Array.isArray(pData.images) && pData.images.includes(oldUrl)) {
        updates.images = pData.images.map(u => (u === oldUrl ? info.newUrl : u));
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        batch.update(pRef, updates);
        batchOps++;
      }
      mapping[oldUrl].dbSynced = true;
    }

    if (batchOps > 0) {
      await batch.commit();
    }
    saveMapping(mapping);
    console.log(`  ✅ Committed products batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchOps} docs)`);
  }

  // Step 3: Sync URLs to `catalogs/search_index_p1..p7`
  console.log(`\n📦 Syncing optimized URLs to catalogs/search_index_p1..p7...`);
  const urlLookup = new Map();
  for (const [oldUrl, info] of Object.entries(mapping)) {
    if (info && info.newUrl) urlLookup.set(oldUrl, info.newUrl);
  }

  const shardBatch = writeBatch(db);
  let updatedShards = 0;
  let updatedShardItems = 0;

  for (let p = 1; p <= 7; p++) {
    const shardId = `search_index_p${p}`;
    const sRef = doc(db, 'catalogs', shardId);
    const sSnap = await getDoc(sRef);
    if (!sSnap.exists()) continue;
    const sData = sSnap.data();
    const items = Array.isArray(sData.items) ? sData.items : [];
    let shardDirty = false;

    const nextItems = items.map(item => {
      if (!item) return item;
      let changed = false;
      const copy = { ...item };
      if (copy.image && urlLookup.has(copy.image)) {
        copy.image = urlLookup.get(copy.image);
        changed = true;
      }
      if (copy.img && urlLookup.has(copy.img)) {
        copy.img = urlLookup.get(copy.img);
        changed = true;
      }
      if (Array.isArray(copy.images)) {
        let arrChanged = false;
        const nextArr = copy.images.map(u => {
          if (urlLookup.has(u)) {
            arrChanged = true;
            return urlLookup.get(u);
          }
          return u;
        });
        if (arrChanged) {
          copy.images = nextArr;
          changed = true;
        }
      }
      if (changed) {
        shardDirty = true;
        updatedShardItems++;
      }
      return copy;
    });

    if (shardDirty) {
      shardBatch.update(sRef, { items: nextItems, updatedAt: serverTimestamp() });
      updatedShards++;
    }
  }

  if (updatedShards > 0) {
    await shardBatch.commit();
  }

  console.log(`\n🎉 Phase 4 Run Complete!`);
  console.log(`- Uploaded & Verified (200 OK): ${uploadedCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log(`- Shards Updated: ${updatedShards} (${updatedShardItems} items)`);
  if (totalOrigBytes > 0) {
    console.log(`- Size Reduced (this run): ${(totalOrigBytes/1024/1024).toFixed(2)} MB -> ${(totalNewBytes/1024/1024).toFixed(2)} MB (Saved ${((totalOrigBytes - totalNewBytes)/1024/1024).toFixed(2)} MB)`);
  }
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
