import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('c:/DH Notebook/Management System/dh-backoffice-react/serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  console.log("=== CHECKING USER PROFILES ===");
  
  const emails = ['dh1notebook@gmail.com', 'ai.manager@dhnotebook.com'];
  for (const email of emails) {
    console.log(`\nEmail: ${email}`);
    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) {
      console.log("Not found in users collection");
    } else {
      snap.forEach(doc => {
        console.log(`UID: ${doc.id}`);
        console.dir(doc.data(), { depth: null });
      });
    }
  }
}

check().catch(console.error);
