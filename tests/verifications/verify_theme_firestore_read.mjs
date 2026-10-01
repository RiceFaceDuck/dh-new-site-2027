import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspectThemeAndHeroDocs() {
  console.log("Authenticating as manager...");
  try {
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Auth success: UID =", auth.currentUser?.uid);
  } catch (err) {
    console.log("Auth warning (proceeding as unauthenticated if allowed):", err.message);
  }

  const targets = [
    'storefront_config',
    'storefrontTheme',
    'hero_config'
  ];

  for (const docId of targets) {
    try {
      const snap = await getDoc(doc(db, 'settings', docId));
      if (snap.exists()) {
        console.log(`\n=== [FOUND] settings/${docId} ===`);
        console.log(JSON.stringify(snap.data(), null, 2));
      } else {
        console.log(`\n=== [NOT FOUND] settings/${docId} ===`);
      }
    } catch (e) {
      console.error(`\n=== [ERROR] settings/${docId}:`, e.message);
    }
  }

  // Also check if there are other docs in settings collection that relate to theme
  try {
    console.log("\n=== Checking all doc IDs in 'settings' collection ===");
    const settingsSnap = await getDocs(collection(db, 'settings'));
    const ids = settingsSnap.docs.map(d => d.id);
    console.log("All settings doc IDs:", ids);
  } catch (e) {
    console.error("Error listing settings collection:", e.message);
  }

  process.exit(0);
}

inspectThemeAndHeroDocs();
