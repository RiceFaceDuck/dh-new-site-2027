import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// read the service account key
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve('c:/DH Notebook/Management System/dh-backoffice-react/serviceAccountKey.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  console.log(`Total users: ${snapshot.size}`);
  snapshot.forEach(doc => {
    const data = doc.data();
    const isKwan = doc.id.includes('0AU') || (data.accountName && data.accountName.includes('Kwan')) || (data.firstName && data.firstName.includes('Kwan')) || data.phone === '0634879919';
    if (isKwan) {
      console.log(`\n--- Document ID: ${doc.id} ---`);
      console.log(JSON.stringify(data, null, 2));
    }
  });
}

checkUsers().catch(console.error);
