import { initializeApp, refreshToken } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// 1. Initialize Firebase Admin
let app;
try {
    const adcPath = 'c:/DH Notebook/Management System/scratch/temp_adc.json';
    
    app = initializeApp({
        credential: refreshToken(adcPath),
        projectId: 'dh-notebook-69f3b'
    });
    console.log(`✅ Initialized Firebase Admin successfully`);
} catch (e) {
    console.error("❌ Failed to initialize:", e.message);
    process.exit(1);
}

const db = getFirestore(app);

async function healCreditPoints() {
    console.log("🔍 Scanning all users for credit anomalies...");
    const usersSnap = await db.collection('dh_notebook_users').get();
    
    let healedCount = 0;
    
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        
        const historySnap = await db.collection('dh_notebook_users').doc(uid).collection('credit_history').get();
        if (historySnap.empty) continue;
        
        let calculatedCurrent = 0;
        let calculatedAccumulated = 0;
        
        historySnap.docs.forEach(doc => {
            const data = doc.data();
            const amount = data.amount || 0;
            const type = data.type; // 'earn', 'spend', 'clawback', 'refund'
            
            if (type === 'earn' || type === 'refund') {
                calculatedCurrent += amount;
                if (type === 'earn') calculatedAccumulated += amount;
            } else if (type === 'spend' || type === 'clawback') {
                calculatedCurrent -= amount;
            }
        });
        
        const currentPoints = userData.creditPoints || 0;
        const currentAccumulated = userData.totalAccumulatedPoints || 0;
        
        if (currentPoints !== calculatedCurrent || currentAccumulated !== calculatedAccumulated) {
            console.log(`⚠️ User: ${userData.displayName || uid} (${uid})`);
            console.log(`   - Current System Points: ${currentPoints} | Actual History: ${calculatedCurrent}`);
            console.log(`   - Current Accumulated: ${currentAccumulated} | Actual History: ${calculatedAccumulated}`);
            
            // Fix it!
            await db.collection('dh_notebook_users').doc(uid).update({
                creditPoints: calculatedCurrent,
                totalAccumulatedPoints: calculatedAccumulated,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`   ✅ HEALED: Updated to ${calculatedCurrent} points.`);
            healedCount++;
        }
    }
    
    console.log(`🎉 Healing complete. Fixed ${healedCount} accounts.`);
    process.exit(0);
}

healCreditPoints().catch(console.error);
