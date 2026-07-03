import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const uid = 'staff_antigravity';
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid: uid,
    email: 'antigravity.staff@gmail.com',
    firstName: 'แอนตี้กราวิตี้',
    lastName: 'สตาฟ',
    nickname: 'แอนตี้',
    displayName: 'พนักงาน แอนตี้กราวิตี้ (ระบบทดสอบ)',
    role: 'staff',
    status: 'active',
    isActive: true,
    isStaff: true,
    workStatus: 'offline',
    metadata: {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'antigravity_agent'
    }
  }, { merge: true });
  console.log("Successfully created/updated staff user: " + uid);
}

run().catch(console.error);
