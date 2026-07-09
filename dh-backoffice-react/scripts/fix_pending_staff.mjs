import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'dh-notebook-69f3b' });

const db = getFirestore();

async function run() {
  const usersSnapshot = await db.collection('users').get();
  let count = 0;
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    if (data.email === 'dh2notebook@gmail.com' || data.email === 'kik.love.tan2021@gmail.com') {
      console.log(`Fixing user: ${data.email}`);
      await doc.ref.update({
        role: 'pending_approval',
        requestedRole: data.role !== 'pending_approval' ? data.role : 'Admin ฝ่ายขาย',
        isActive: false,
        isStaff: false,
        'metadata.updatedAt': FieldValue.serverTimestamp()
      });
      count++;
    }
  }
  console.log(`Successfully fixed ${count} users.`);
}

run().catch(console.error);
