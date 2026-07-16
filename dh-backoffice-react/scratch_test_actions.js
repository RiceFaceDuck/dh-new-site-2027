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

async function testActions() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log("Signed in successfully!");

    const testTasks = [
      'ClMc4TjIrigjBtAsPVAs', // PACKING_TASK
      'oATvb7hluTqQAFXsv4g6', // promotion_alert
      'sNF1AWvbmlc650zqnQdw', // promotion_alert
      'TODO-AD-BUSINESS_CARD-1779772673445', // BUSINESS_CARD_AD_APPROVAL
      'TODO-AD-BUSINESS_CARD-1779773294176', // AD_APPROVAL
      'TODO-AD-BUSINESS_CARD-1779773501399'  // AD_APPROVAL
    ];

    for (const taskId of testTasks) {
      console.log(`\nTesting status update on task: ${taskId}`);
      try {
        const taskRef = doc(db, 'todos', taskId);
        // Try starting the task (setting status to in_progress)
        await updateDoc(taskRef, {
          status: 'in_progress',
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Successfully set ${taskId} to in_progress`);
      } catch (err) {
        console.error(`❌ Failed to update ${taskId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("🔥 Global Error:", err);
  }
  process.exit(0);
}

testActions();
