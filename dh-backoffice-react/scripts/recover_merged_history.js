import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (Modify path to service account key as needed)
// const serviceAccount = require('./serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });
// const db = getFirestore();

/**
 * Script to recover orphaned credit_transactions and wallet_transactions 
 * from merged accounts. It looks for users with status == 'merged' and 
 * moves any leftover transactions to their mergedInto account.
 */
async function recoverMergedHistory(db) {
    console.log("🛠️ Starting Data Recovery for Merged Accounts...");
    const usersRef = db.collection('users');
    const mergedUsersSnap = await usersRef.where('status', '==', 'merged').get();
    
    let recoveredCredits = 0;
    let recoveredWallets = 0;
    
    for (const userDoc of mergedUsersSnap.docs) {
        const manualUid = userDoc.id;
        const targetUid = userDoc.data().mergedInto;
        
        if (!targetUid) continue;

        try {
            const batch = db.batch();
            let batchCount = 0;

            // 1. Recover Credit Transactions
            const creditsRef = db.collection('credit_transactions');
            const creditsQ = creditsRef.where('uid', '==', manualUid);
            const creditsSnap = await creditsQ.get();
            
            creditsSnap.forEach((docSnap) => {
                batch.update(docSnap.ref, { uid: targetUid });
                recoveredCredits++;
                batchCount++;
            });

            // 2. Recover Wallet Transactions
            const oldWalletTxRef = usersRef.doc(manualUid).collection('wallet_transactions');
            const walletTxSnap = await oldWalletTxRef.get();
            
            walletTxSnap.forEach((docSnap) => {
                const newTxRef = usersRef.doc(targetUid).collection('wallet_transactions').doc(docSnap.id);
                batch.set(newTxRef, docSnap.data());
                batch.delete(docSnap.ref);
                recoveredWallets++;
                batchCount++;
            });

            if (batchCount > 0) {
                await batch.commit();
                console.log(`   - Recovered ${creditsSnap.size} Credit TXs and ${walletTxSnap.size} Wallet TXs for merged user: ${manualUid}`);
            }

        } catch (error) {
            console.error(`❌ Error recovering UID ${manualUid}:`, error.message);
        }
    }
    
    console.log(`✅ Recovery Complete. Recovered ${recoveredCredits} Credit TXs and ${recoveredWallets} Wallet TXs.`);
}

// recoverMergedHistory(db).catch(console.error);
export { recoverMergedHistory };
