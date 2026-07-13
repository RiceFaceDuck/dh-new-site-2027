import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin
let app;
try {
    if (fs.existsSync('firebase-adminsdk.json')) {
        const serviceAccount = JSON.parse(fs.readFileSync('firebase-adminsdk.json', 'utf8'));
        app = initializeApp({ credential: cert(serviceAccount) });
        console.log("✅ [Admin] Initialized via firebase-adminsdk.json");
    } else {
        app = initializeApp({ projectId: "dh-new-site-2027" });
        console.log("✅ [Admin] Initialized via default credentials");
    }
} catch (err) {
    console.error("🔥 Error initializing app:", err);
    process.exit(1);
}

const db = getFirestore();

async function runMigration() {
    console.log("🔍 Scanning for orphaned pending orders without 'orderStatus'...");
    
    // We cannot query for missing fields directly, so we query by 'status'
    // and filter in memory.
    const statusesToFix = ['pending_payment', 'pending_payment_verification', 'pending'];
    
    let totalFixed = 0;

    for (const statusVal of statusesToFix) {
        console.log(`\n▶️ Checking status: ${statusVal}`);
        const snapshot = await db.collection('orders').where('status', '==', statusVal).get();
        
        let batch = db.batch();
        let count = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            // If orderStatus is missing, we patch it
            if (!data.orderStatus) {
                batch.update(doc.ref, { orderStatus: statusVal });
                count++;
                totalFixed++;
                console.log(`   - Marked order ${doc.id} with orderStatus: ${statusVal}`);
                
                if (count >= 500) {
                    await batch.commit();
                    console.log(`   ✅ Committed batch of ${count}`);
                    batch = db.batch();
                    count = 0;
                }
            }
        }
        
        if (count > 0) {
            await batch.commit();
            console.log(`   ✅ Committed final batch of ${count}`);
        }
    }
    
    console.log(`\n🎉 Migration Complete! Fixed ${totalFixed} orphaned orders.`);
    console.log(`💡 The frontend Auto-Cleanup hook will now be able to detect and safely cancel them.`);
}

runMigration().catch(console.error);
