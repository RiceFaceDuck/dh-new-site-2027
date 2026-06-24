import { db, auth } from './config';
import { collection, doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { historyService } from './historyService';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const adminAdjustFinancials = async (adminId, uid, adjustments) => {
    try {
        const userRef = getUserDocRef(uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) throw new Error("User not found");

        const creditAmount = Number(adjustments.creditAmount || 0);
        const walletAmount = Number(adjustments.walletAmount || 0);
        const reason = adjustments.reason || 'Manual Adjustment';
        const batch = writeBatch(db);

        const data = userSnap.data();
        let newCredit = Math.max(0, Number(data.creditPoints || 0) + creditAmount);
        let newWallet = Math.max(0, Number(data.walletBalance || 0) + walletAmount);
        
        batch.update(userRef, {
            creditPoints: newCredit,
            walletBalance: newWallet,
            'metadata.lastFinancialUpdate': serverTimestamp()
        });

        const auditRef = doc(collection(db, getCollectionPath('admin_audits')));
        batch.set(auditRef, {
            action: 'FINANCIAL_ADJUSTMENT',
            targetUid: uid,
            performedBy: adminId,
            reason: reason,
            changes: {
                credit: { from: Number(data.creditPoints || 0), to: newCredit, diff: creditAmount },
                wallet: { from: Number(data.walletBalance || 0), to: newWallet, diff: walletAmount }
            },
            timestamp: serverTimestamp()
        });

        await batch.commit();
        
        await historyService.addLog('UserManagement', 'AdjustFinancials', uid, `ปรับยอดเงิน/แต้มให้ผู้ใช้ UID: ${uid} (Credit: ${creditAmount}, Wallet: ${walletAmount}) เหตุผล: ${reason}`, adminId || auth.currentUser?.uid);
        console.log(`✅ [UserFinancialAdminService] Financials adjusted securely using batch for user ${uid}`);
        return { success: true, newCredit, newWallet };

    } catch (error) {
        console.error("❌ [UserFinancialAdminService] Financial adjustment failed:", error);
        throw error;
    }
};
