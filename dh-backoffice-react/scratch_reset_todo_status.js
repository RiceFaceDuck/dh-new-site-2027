import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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

async function resetStatus() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Signed in successfully!");

    const tasksToReset = [
      'ClMc4TjIrigjBtAsPVAs',
      'oATvb7hluTqQAFXsv4g6',
      'sNF1AWvbmlc650zqnQdw'
    ];

    for (const taskId of tasksToReset) {
      console.log(`Resetting status for task: ${taskId}`);
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, {
        status: 'todo',
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Reset ${taskId} to todo`);
    }
  } catch (err) {
    console.error("🔥 Error:", err);
  }
  process.exit(0);
}

resetStatus();
