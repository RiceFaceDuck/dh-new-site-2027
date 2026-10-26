import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, updateDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function syncBundle() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  const mapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'drive_to_firebase_mapping.json'), 'utf8'));

  const bundleRef = doc(db, "catalogs", "active_partners_bundle");
  const snap = await getDoc(bundleRef);
  if (!snap.exists()) {
    console.log("active_partners_bundle does not exist");
    return;
  }

  const data = snap.data();
  let updatedCount = 0;
  const items = (data.items || []).map(item => {
    // deep clone to avoid undefined fields
    const copy = JSON.parse(JSON.stringify(item));
    if (copy.storeImage && mapping[copy.storeImage]) {
      copy.storeImage = mapping[copy.storeImage];
      updatedCount++;
    }
    if (copy.imageUrl && mapping[copy.imageUrl]) {
      copy.imageUrl = mapping[copy.imageUrl];
    }
    return copy;
  });

  console.log(`Updated ${updatedCount} items in bundle.`);
  if (updatedCount > 0) {
    await updateDoc(bundleRef, { items });
    console.log("✅ Successfully updated catalogs/active_partners_bundle!");
  } else {
    console.log("ℹ️ No items needed update in bundle.");
  }
}

syncBundle().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
