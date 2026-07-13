
// Initialize Firebase Admin (Modify path to service account key as needed)
// const serviceAccount = require('./serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });
// const db = getFirestore();

/**
 * Script to clean up deprecated legacy collections for Credit Points:
 * - users/{uid}/wallet
 * - users/{uid}/credit_history
 */
async function cleanupLegacyCredit(db) {
    console.log("🧹 Starting Cleanup of Legacy Credit Collections...");
    const usersRef = db.collection('users');
    const usersSnap = await usersRef.get();
    
    let deletedCount = 0;
    
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        
        try {
            // Delete legacy wallet/default
            const walletRef = usersRef.doc(uid).collection('wallet').doc('default');
            const walletDoc = await walletRef.get();
            if (walletDoc.exists) {
                await walletRef.delete();
                console.log(`   - Deleted wallet/default for UID: ${uid}`);
                deletedCount++;
            }

            // Delete legacy credit_history subcollection (if empty/small we can delete documents one by one)
            const historyRef = usersRef.doc(uid).collection('credit_history');
            const historySnap = await historyRef.get();
            if (!historySnap.empty) {
                const batch = db.batch();
                historySnap.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`   - Deleted ${historySnap.size} documents in credit_history for UID: ${uid}`);
                deletedCount += historySnap.size;
            }
        } catch (error) {
            console.error(`❌ Error cleaning up UID ${uid}:`, error.message);
        }
    }
    
    console.log(`✅ Cleanup Complete. Total documents deleted: ${deletedCount}`);
}

// cleanupLegacyCredit(db).catch(console.error);
export { cleanupLegacyCredit };
