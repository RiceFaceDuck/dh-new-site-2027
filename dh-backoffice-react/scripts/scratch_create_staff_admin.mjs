import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'dh-notebook-69f3b' }); // Uses CLI auth with project ID

const db = getFirestore();

async function run() {
  const uid = 'staff_antigravity';
  const userRef = db.collection('users').doc(uid);
  
  await userRef.set({
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: 'antigravity_agent'
    }
  }, { merge: true });
  
  console.log("Successfully created staff user via Admin SDK: " + uid);
}

run().catch(console.error);
