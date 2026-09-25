import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs, limit, query } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspect() {
  console.log("=== Fact-Check: ActivePartners and Partners Collections (Read-Only) ===");
  try {
    console.log("Logging in as staff (ai.manager@dhnotebook.com)...");
    const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Logged in UID:", cred.user.uid);

    console.log("\n--- 1. Querying ActivePartners collection ---");
    const activePartnersSnap = await getDocs(query(collection(db, "ActivePartners"), limit(10)));
    console.log(`ActivePartners count: ${activePartnersSnap.size}`);
    activePartnersSnap.forEach(doc => {
      console.log(`[ActivePartner ID: ${doc.id}]`, JSON.stringify(doc.data(), null, 2));
    });

    console.log("\n--- 2. Querying partners collection ---");
    const partnersSnap = await getDocs(query(collection(db, "partners"), limit(5)));
    console.log(`partners count: ${partnersSnap.size}`);
    partnersSnap.forEach(doc => {
      console.log(`[Partner ID: ${doc.id}]`, JSON.stringify(doc.data(), null, 2));
    });

  } catch (err) {
    console.error("Fact-check error:", err);
  }
}

inspect();
