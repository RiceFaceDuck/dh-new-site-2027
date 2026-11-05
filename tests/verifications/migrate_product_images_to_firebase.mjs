import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, getDocs, doc, writeBatch } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";
import { getStorage, ref, uploadBytes, getDownloadURL } from "../../dh-backoffice-react/node_modules/firebase/storage/dist/index.mjs";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// CLI Arguments
const isDryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const processLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const mappingFilePath = path.join(__dirname, 'product_image_migration_mapping.json');

function loadExistingMapping() {
  if (fs.existsSync(mappingFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(mappingFilePath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveMapping(mapping) {
  fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2), 'utf-8');
}

export function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || 
                url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function isDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com') || 
         url.includes('googleusercontent.com') ||
         url.includes('docs.google.com');
}

export async function downloadDriveImage(driveUrl) {
  const fileId = extractFileId(driveUrl);
  if (!fileId) return null;

  // w1200-rw directly asks Google CDN for WebP transcode <= 1200px (lightweight & fast)
  const candidateUrls = [
    `https://lh3.googleusercontent.com/d/${fileId}=w1200-rw`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
    `https://drive.google.com/uc?export=download&id=${fileId}`
  ];

  for (const dlUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(dlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 500) {
          const contentType = res.headers.get('content-type') || 'image/webp';
          return { buffer, fileId, contentType };
        }
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`🚀 DH Notebook: Products Google Drive -> Firebase Storage`);
  console.log(`- Mode: ${isDryRun ? '🛡️ DRY-RUN (จำลองการทำงาน ไม่เขียน DB/Storage)' : '⚡ LIVE RUN (ย้ายข้อมูลจริง)'}`);
  if (processLimit < Infinity) console.log(`- Limit: ${processLimit} products`);
  console.log(`======================================================\n`);

  console.log("🔑 Authenticating with Firebase...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log(`✅ Logged in as: ${cred.user.email} (UID: ${cred.user.uid})\n`);

  console.log("🔍 Scanning 'products' collection in Firestore...");
  const snap = await getDocs(collection(db, "products"));
  console.log(`📊 Total products scanned: ${snap.size}`);

  const productsToMigrate = [];
  const urlToProductMap = new Map(); // driveUrl -> [{ docId, sku, field, index }]

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;
    const sku = data.sku || docId;
    let hasDriveImage = false;

    // Check images array
    if (Array.isArray(data.images)) {
      data.images.forEach((imgUrl, idx) => {
        if (isDriveUrl(imgUrl)) {
          hasDriveImage = true;
          if (!urlToProductMap.has(imgUrl)) urlToProductMap.set(imgUrl, []);
          urlToProductMap.get(imgUrl).push({ docId, sku, field: 'images', index: idx });
        }
      });
    }

    // Check single image / imageUrl
    if (isDriveUrl(data.image)) {
      hasDriveImage = true;
      if (!urlToProductMap.has(data.image)) urlToProductMap.set(data.image, []);
      urlToProductMap.get(data.image).push({ docId, sku, field: 'image', index: -1 });
    }
    if (isDriveUrl(data.imageUrl)) {
      hasDriveImage = true;
      if (!urlToProductMap.has(data.imageUrl)) urlToProductMap.set(data.imageUrl, []);
      urlToProductMap.get(data.imageUrl).push({ docId, sku, field: 'imageUrl', index: -1 });
    }

    if (hasDriveImage) {
      productsToMigrate.push({ docId, sku, data });
    }
  });

  console.log(`📦 Found ${productsToMigrate.length} products with Google Drive images`);
  console.log(`🖼️ Total unique Drive image URLs: ${urlToProductMap.size}\n`);

  const mapping = loadExistingMapping();
  const alreadyMappedCount = Object.keys(mapping).length;
  if (alreadyMappedCount > 0) {
    console.log(`💾 Found existing mapping cache with ${alreadyMappedCount} URLs already migrated.`);
  }

  const selectedProducts = productsToMigrate.slice(0, processLimit);
  console.log(`🎯 Targets to process in this run: ${selectedProducts.length} products\n`);

  let successUploads = 0;
  let reusedMapping = 0;
  let failedUploads = 0;

  // Step 1: Collect unique Drive URLs needed for the selected products
  const selectedUrls = new Set();
  selectedProducts.forEach(p => {
    if (Array.isArray(p.data.images)) {
      p.data.images.forEach(u => { if (isDriveUrl(u)) selectedUrls.add(u); });
    }
    if (isDriveUrl(p.data.image)) selectedUrls.add(p.data.image);
    if (isDriveUrl(p.data.imageUrl)) selectedUrls.add(p.data.imageUrl);
  });

  console.log(`🔄 Transferring ${selectedUrls.size} unique image files...`);
  let urlIndex = 0;
  for (const driveUrl of selectedUrls) {
    urlIndex++;
    const fileId = extractFileId(driveUrl);
    const related = urlToProductMap.get(driveUrl) || [];
    const sampleSku = related[0]?.sku || 'general';
    const cleanSku = String(sampleSku).trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';

    if (mapping[driveUrl]) {
      reusedMapping++;
      if (urlIndex <= 5 || urlIndex % 50 === 0) {
        console.log(`  [${urlIndex}/${selectedUrls.size}] ⚡ Cached: ID ${fileId} -> ${mapping[driveUrl].slice(0, 60)}...`);
      }
      continue;
    }

    process.stdout.write(`  [${urlIndex}/${selectedUrls.size}] Fetching ID: ${fileId} (SKU: ${cleanSku})... `);

    if (isDryRun) {
      // In dry-run, test download a small sample (first 3 items) to verify network & Google CDN responsiveness
      if (urlIndex <= 3) {
        const downloaded = await downloadDriveImage(driveUrl);
        if (downloaded) {
          console.log(`✅ [Dry-Run verified] ${(downloaded.buffer.length / 1024).toFixed(1)} KB (${downloaded.contentType})`);
        } else {
          console.log(`⚠️ [Dry-Run download check] Fetch failed`);
        }
      } else {
        console.log(`🛡️ [Dry-Run simulation: ready to transfer]`);
      }
      mapping[driveUrl] = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/products%2F${cleanSku}%2Fmigrated_${fileId}.webp?alt=media`;
      successUploads++;
      continue;
    }

    // Live Run
    try {
      const downloaded = await downloadDriveImage(driveUrl);
      if (!downloaded) {
        console.log(`❌ Failed to download from Google CDN/Drive`);
        failedUploads++;
        continue;
      }

      const storagePath = `products/${cleanSku}/migrated_${fileId}.webp`;
      const fileRef = ref(storage, storagePath);
      const snapUpload = await uploadBytes(fileRef, downloaded.buffer, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          sku: cleanSku,
          originalDriveId: fileId,
          migratedAt: new Date().toISOString()
        }
      });

      const firebaseUrl = await getDownloadURL(snapUpload.ref);
      mapping[driveUrl] = firebaseUrl;
      saveMapping(mapping);
      successUploads++;
      console.log(`✅ Uploaded ${(downloaded.buffer.length / 1024).toFixed(1)} KB -> Storage`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failedUploads++;
    }
  }

  if (!isDryRun) {
    saveMapping(mapping);
    console.log(`\n💾 Saved updated mapping file to: ${mappingFilePath}`);
  }

  // Step 2: Batch Update Firestore Products
  console.log(`\n======================================================`);
  console.log(`📝 Firestore Document Update Summary`);
  console.log(`======================================================`);

  let updatedProductDocs = 0;
  const batchSize = 25;
  let currentBatch = writeBatch(db);
  let batchOps = 0;

  for (let i = 0; i < selectedProducts.length; i++) {
    const { docId, data } = selectedProducts[i];
    let changed = false;
    const updatePayload = {};

    if (Array.isArray(data.images)) {
      const newImages = data.images.map(img => (isDriveUrl(img) && mapping[img]) ? mapping[img] : img);
      if (JSON.stringify(newImages) !== JSON.stringify(data.images)) {
        updatePayload.images = newImages;
        changed = true;
      }
    }

    if (isDriveUrl(data.image) && mapping[data.image]) {
      updatePayload.image = mapping[data.image];
      changed = true;
    }

    if (isDriveUrl(data.imageUrl) && mapping[data.imageUrl]) {
      updatePayload.imageUrl = mapping[data.imageUrl];
      changed = true;
    }

    if (changed) {
      updatedProductDocs++;
      if (!isDryRun) {
        const docRef = doc(db, "products", docId);
        currentBatch.update(docRef, updatePayload);
        batchOps++;

        if (batchOps >= batchSize) {
          await currentBatch.commit();
          console.log(`  ✓ Committed batch of ${batchOps} products to Firestore (total updated: ${updatedProductDocs})`);
          currentBatch = writeBatch(db);
          batchOps = 0;
          await new Promise(r => setTimeout(r, 400)); // Quota safety throttle
        }
      } else {
        if (updatedProductDocs <= 3 || updatedProductDocs % 200 === 0) {
          console.log(`  [Dry-Run] Would update product: ${docId} (SKU: ${data.sku})`);
        }
      }
    }
  }

  if (!isDryRun && batchOps > 0) {
    await currentBatch.commit();
    console.log(`  ✓ Committed final batch of ${batchOps} products to Firestore`);
  }

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 4 Migration Summary (${isDryRun ? 'DRY-RUN' : 'LIVE'})`);
  console.log(`- Products scanned: ${snap.size}`);
  console.log(`- Products needing migration: ${productsToMigrate.length}`);
  console.log(`- Processed in this run: ${selectedProducts.length}`);
  console.log(`- Products updated: ${updatedProductDocs}`);
  console.log(`- Image URLs converted: ${successUploads}`);
  console.log(`- Image URLs reused from cache: ${reusedMapping}`);
  console.log(`- Image URLs failed: ${failedUploads}`);
  console.log(`======================================================\n`);
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Fatal error in migration script:", err);
    process.exit(1);
  });
