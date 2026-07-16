import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";
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

async function check() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Signed in successfully!");

    console.log("\n=== ACTIVE TODOS ===");
    const q = query(
        collection(db, getCollectionPath('todos')),
        where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item']),
        limit(50)
    );
    const todosSnap = await getDocs(q);
    console.log(`Total active todos found: ${todosSnap.size}`);
    todosSnap.forEach(d => {
      const data = d.data();
      console.log(`ID: ${d.id}`);
      console.log(`Type: ${data.type}`);
      console.log(`Title: ${data.title}`);
      console.log(`Status: ${data.status}`);
      console.log(`Priority: ${data.priority}`);
      console.log(`CustomerName: ${data.customerName}`);
      console.log(`Payload:`, JSON.stringify(data.payload || null));
      console.log(`CreatedAt: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
      console.log("----------------------");
    });
  } catch (err) {
    console.error("🔥 Error:", err);
  }
  process.exit(0);
}

check();
