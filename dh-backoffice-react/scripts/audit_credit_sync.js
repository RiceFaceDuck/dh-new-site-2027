const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (Modify path to service account key as needed)
// const serviceAccount = require('./serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });
// const db = getFirestore();

/**
 * Script to audit and verify that user credit points match the sum of their transactions.
 */
async function auditCreditSync(db) {
    console.log("🔍 Starting Credit Synchronization Audit...");
    const usersRef = db.collection('users'); // Adjust path based on environment
    const usersSnap = await usersRef.get();
    
    let discrepancies = 0;
    
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const currentCredit = userData.creditPoints || 0;
        
        // Sum up all successful transactions for this user
        const txRef = db.collection('credit_transactions');
        const txSnap = await txRef.where('uid', '==', uid).where('status', '==', 'completed').get();
        
        let calculatedSum = 0;
        txSnap.forEach(txDoc => {
            const txData = txDoc.data();
            if (['earn', 'refund', 'topup', 'cashback'].includes(txData.type)) {
                calculatedSum += (txData.amount || 0);
            } else if (['deduct', 'pay', 'clawback', 'withdraw'].includes(txData.type)) {
                calculatedSum -= (txData.amount || 0);
            }
        });
        
        // Float precision fix
        calculatedSum = Math.round(calculatedSum * 100) / 100;
        const storedCredit = Math.round(currentCredit * 100) / 100;
        
        if (calculatedSum !== storedCredit) {
            console.log(`⚠️ Discrepancy found for UID: ${uid}`);
            console.log(`   - Stored Credit: ${storedCredit}`);
            console.log(`   - Calculated Sum: ${calculatedSum}`);
            console.log(`   - Difference: ${Math.abs(storedCredit - calculatedSum)}`);
            discrepancies++;
        }
    }
    
    if (discrepancies === 0) {
        console.log("✅ All user credits are perfectly synced with transaction histories.");
    } else {
        console.log(`🚨 Found ${discrepancies} user(s) with credit discrepancies.`);
    }
}

// auditCreditSync(db).catch(console.error);
module.exports = { auditCreditSync };
