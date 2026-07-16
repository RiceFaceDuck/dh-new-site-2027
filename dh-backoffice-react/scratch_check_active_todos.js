import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('c:/DH Notebook/Management System/dh-backoffice-react/serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  console.log("=== READING ACTIVE TODOS ===");
  const snapshot = await db.collection('todos')
    .where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item'])
    .get();

  console.log(`Total active todos: ${snapshot.size}`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Type: ${data.type}`);
    console.log(`Title: ${data.title}`);
    console.log(`Status: ${data.status}`);
    console.log(`Priority: ${data.priority}`);
    console.log(`CustomerName: ${data.customerName}`);
    console.log(`Payload:`, JSON.stringify(data.payload || null));
    console.log(`CreatedAt: ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
    console.log("----------------------");
  });
  process.exit(0);
}

check().catch(console.error);
