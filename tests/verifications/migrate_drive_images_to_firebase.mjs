import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, getDocs, doc, writeBatch, getDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";
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

const isDryRun = process.argv.includes('--dry-run');

async function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function downloadDriveImage(driveUrl) {
  const fileId = await extractFileId(driveUrl);
  if (!fileId) return null;

  const downloadUrls = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1600`
  ];

  for (const dlUrl of downloadUrls) {
    try {
      const res = await fetch(dlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 500) { // Valid image
          return { buffer, fileId };
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`🚀 GAS to Firebase Storage Migration (DryRun: ${isDryRun})`);
  console.log(`======================================================\n`);

  console.log("🔑 Authenticating as ai.manager@dhnotebook.com...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log(`✅ Logged in as: ${cred.user.email} (UID: ${cred.user.uid})\n`);

  // 1. Scan ActivePartners
  console.log("🔍 Scanning ActivePartners collection...");
  const apSnap = await getDocs(collection(db, "ActivePartners"));
  const urlMap = new Map(); // driveUrl -> { fileId, partners: [], fields: [] }

  apSnap.forEach(d => {
    const data = d.data();
    if (data.storeImage && data.storeImage.includes("drive.google.com")) {
      if (!urlMap.has(data.storeImage)) urlMap.set(data.storeImage, []);
      urlMap.get(data.storeImage).push({ id: d.id, col: 'ActivePartners', field: 'storeImage' });
    }
    if (Array.isArray(data.galleryImages)) {
      data.galleryImages.forEach((img, idx) => {
        if (img && img.includes("drive.google.com")) {
          if (!urlMap.has(img)) urlMap.set(img, []);
          urlMap.get(img).push({ id: d.id, col: 'ActivePartners', field: `galleryImages[${idx}]` });
        }
      });
    }
  });

  // 2. Scan partner_ads
  console.log("🔍 Scanning partner_ads collection...");
  const adsSnap = await getDocs(collection(db, "partner_ads"));
  adsSnap.forEach(d => {
    const data = d.data();
    if (data.imageUrl && data.imageUrl.includes("drive.google.com")) {
      if (!urlMap.has(data.imageUrl)) urlMap.set(data.imageUrl, []);
      urlMap.get(data.imageUrl).push({ id: d.id, col: 'partner_ads', field: 'imageUrl' });
    }
    if (Array.isArray(data.galleryImages)) {
      data.galleryImages.forEach((img, idx) => {
        if (img && img.includes("drive.google.com")) {
          if (!urlMap.has(img)) urlMap.set(img, []);
          urlMap.get(img).push({ id: d.id, col: 'partner_ads', field: `galleryImages[${idx}]` });
        }
      });
    }
  });

  console.log(`\n📊 Total Unique Drive Images Found: ${urlMap.size}`);

  const mappingResult = {};
  let successCount = 0;
  let failCount = 0;

  // 3. Process Downloads & Uploads to Firebase Storage
  console.log("\n📦 Processing image transfer to Firebase Storage...");
  let idx = 0;
  for (const [driveUrl, refs] of urlMap.entries()) {
    idx++;
    const fileId = await extractFileId(driveUrl);
    process.stdout.write(`[${idx}/${urlMap.size}] Processing ID: ${fileId}... `);

    try {
      const downloaded = await downloadDriveImage(driveUrl);
      if (!downloaded) {
        console.log(`❌ Failed to fetch from Drive`);
        failCount++;
        continue;
      }

      const storagePath = `stores/migrated/${fileId}.webp`;
      let firebaseUrl = '';

      if (!isDryRun) {
        const fileRef = ref(storage, storagePath);
        const snap = await uploadBytes(fileRef, downloaded.buffer, {
          contentType: 'image/webp',
          customMetadata: {
            originalDriveId: fileId,
            migratedAt: new Date().toISOString()
          }
        });
        firebaseUrl = await getDownloadURL(snap.ref);
      } else {
        firebaseUrl = `https://firebasestorage.googleapis.com/.../stores%2Fmigrated%2F${fileId}.webp`;
      }

      mappingResult[driveUrl] = firebaseUrl;
      successCount++;
      console.log(`✅ ${(downloaded.buffer.length / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failCount++;
    }
  }

  // 4. Save mapping backup JSON file
  const backupFile = path.join(__dirname, 'drive_to_firebase_mapping.json');
  fs.writeFileSync(backupFile, JSON.stringify(mappingResult, null, 2), 'utf-8');
  console.log(`\n💾 Saved URL mapping backup to: ${backupFile}`);

  // 5. Update Firestore Documents
  if (!isDryRun && successCount > 0) {
    console.log("\n🔄 Updating Firestore Documents with new Firebase Storage URLs...");

    // Update ActivePartners
    console.log("- Updating ActivePartners...");
    for (const d of apSnap.docs) {
      const data = d.data();
      let updated = false;
      const updatePayload = {};

      if (data.storeImage && mappingResult[data.storeImage]) {
        updatePayload.storeImage = mappingResult[data.storeImage];
        updated = true;
      }
      if (Array.isArray(data.galleryImages)) {
        const newGallery = data.galleryImages.map(img => mappingResult[img] || img);
        if (JSON.stringify(newGallery) !== JSON.stringify(data.galleryImages)) {
          updatePayload.galleryImages = newGallery;
          updated = true;
        }
      }

      if (updated) {
        const docRef = doc(db, "ActivePartners", d.id);
        const batch = writeBatch(db);
        batch.update(docRef, updatePayload);
        // Also update users/{id}/storeProfile/main
        try {
          const userStoreRef = doc(db, "users", d.id, "storeProfile", "main");
          batch.set(userStoreRef, updatePayload, { merge: true });
        } catch {}
        await batch.commit();
        console.log(`  ✓ Updated partner: ${d.id} (${data.storeName || ''})`);
      }
    }

    // Update partner_ads
    console.log("- Updating partner_ads...");
    for (const d of adsSnap.docs) {
      const data = d.data();
      let updated = false;
      const updatePayload = {};

      if (data.imageUrl && mappingResult[data.imageUrl]) {
        updatePayload.imageUrl = mappingResult[data.imageUrl];
        updated = true;
      }
      if (Array.isArray(data.galleryImages)) {
        const newGallery = data.galleryImages.map(img => mappingResult[img] || img);
        if (JSON.stringify(newGallery) !== JSON.stringify(data.galleryImages)) {
          updatePayload.galleryImages = newGallery;
          updated = true;
        }
      }

      if (updated) {
        const docRef = doc(db, "partner_ads", d.id);
        const batch = writeBatch(db);
        batch.update(docRef, updatePayload);
        await batch.commit();
      }
    }

    // Update active_partners_bundle
    console.log("- Updating catalogs/active_partners_bundle snapshot...");
    try {
      const bundleRef = doc(db, "catalogs", "active_partners_bundle");
      const bundleSnap = await getDoc(bundleRef);
      if (bundleSnap.exists()) {
        const bData = bundleSnap.data();
        let items = Array.isArray(bData.items) ? [...bData.items] : [];
        let bundleUpdated = false;
        items = items.map(item => {
          let itemCopy = { ...item };
          if (itemCopy.storeImage && mappingResult[itemCopy.storeImage]) {
            itemCopy.storeImage = mappingResult[itemCopy.storeImage];
            itemCopy.imageUrl = mappingResult[itemCopy.storeImage];
            bundleUpdated = true;
          }
          return itemCopy;
        });
        if (bundleUpdated) {
          const bBatch = writeBatch(db);
          bBatch.update(bundleRef, { items: items });
          await bBatch.commit();
          console.log("  ✓ Updated active_partners_bundle snapshot");
        }
      }
    } catch (bErr) {
      console.warn("  ⚠️ bundle update note:", bErr.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Migration Completed!`);
  console.log(`- Total Found: ${urlMap.size}`);
  console.log(`- Transferred: ${successCount}`);
  console.log(`- Failed: ${failCount}`);
  console.log(`======================================================\n`);
}

runMigration().then(() => process.exit(0)).catch(e => {
  console.error("Migration Fatal Error:", e);
  process.exit(1);
});
