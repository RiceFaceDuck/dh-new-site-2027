import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getCollectionPath } from '../dh-shared/src/firebase/pathUtils.js';

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61",
  measurementId: "G-WN1STHEG7N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function cleanCorruptTodos() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Signed in successfully!");

    console.log("Fetching all todos...");
    const snap = await getDocs(collection(db, getCollectionPath('todos')));
    
    let deletedCount = 0;
    
    for (const d of snap.docs) {
      const data = d.data();
      const isCorrupt = 
        !data.title || 
        data.title === "undefined" || 
        !data.type || 
        data.type === "BUSINESS_CARD_AD_APPROVAL" || 
        d.id.startsWith("TODO-AD-BUSINESS_CARD-"); // All TODO-AD-BUSINESS_CARD- docs here are corrupt/empty
        
      if (isCorrupt) {
        console.log(`Deleting corrupt todo: ID=${d.id} | Type=${data.type} | Title=${data.title} | Status=${data.status}`);
        const docRef = doc(db, getCollectionPath('todos'), d.id);
        await deleteDoc(docRef);
        deletedCount++;
      }
    }
    
    console.log(`\nCleanup completed. Total corrupt documents deleted: ${deletedCount}`);
  } catch (err) {
    console.error("🔥 Error during cleanup:", err);
  }
  process.exit(0);
}

cleanCorruptTodos();
