import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// read the service account key
const serviceAccountPath = path.resolve('c:/DH Notebook/Management System/dh-backoffice-react/service-account.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.log('No service account found for admin SDK. Make sure to generate one from Firebase Console if needed.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fix() {
    console.log("Fixing Kwan...");
    const ref = db.collection('users').doc('0AUxlnHivLdwa4gxTAGO9yWmhS82');
    const doc = await ref.get();
    if(doc.exists) {
        await ref.update({
            walletBalance: 0,
            partnerCredit: 0,
            'stats.creditBalance': 0
        });
        console.log("Fixed Kwan's corrupted walletBalance to 0.");
    }
}
fix().catch(console.error);
