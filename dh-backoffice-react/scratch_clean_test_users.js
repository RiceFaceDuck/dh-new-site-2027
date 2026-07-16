import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('c:/DH Notebook/Management System/dh-backoffice-react/serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function clean() {
  console.log("=== SCANNING FOR TEST/BUGGY ACCOUNTS ===");
  
  const snap = await db.collection('users').get();
  const toDelete = [];
  
  snap.forEach(doc => {
    const data = doc.data();
    const name = data.accountName || data.displayName || data.name || data.firstName || '';
    const email = data.email || '';
    
    // เงื่อนไขในการลบ
    const isFantasy = name.includes('Fantasy');
    const isTest = name.includes('TEST') || name.includes('test');
    const isUnknown = name.includes('Unknown');
    const isEmpty = name.trim() === '';
    const isPMS = name === 'PMS';
    const isDH1Admin2 = name.includes('Admin2'); // from screenshot
    // Also from screenshot: 0994578458
    const isNumberName = name === '0994578458';

    if (isFantasy || isTest || isUnknown || isEmpty || isPMS || isDH1Admin2 || isNumberName) {
      toDelete.push({
        id: doc.id,
        name: name,
        email: email,
        customerCode: data.customerCode || data.accountId || 'N/A'
      });
    }
  });

  console.log(`Found ${toDelete.length} accounts to delete:`);
  toDelete.forEach(u => {
    console.log(`- ${u.name} (ID: ${u.id}, Code: ${u.customerCode}, Email: ${u.email})`);
  });

  console.log("\n=== DELETING ACCOUNTS ===");
  for (const u of toDelete) {
    await db.collection('users').doc(u.id).delete();
    console.log(`Deleted: ${u.id}`);
  }
  
  console.log("=== DONE ===");
}

clean().catch(console.error);
