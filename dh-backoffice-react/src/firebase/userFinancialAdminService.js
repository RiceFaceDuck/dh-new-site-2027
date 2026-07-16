import { db, auth } from './config';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { historyService } from './historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const adminAdjustFinancials = async (adminId, uid, adjustments) => {
    try {
        const userRef = getUserDocRef(uid);
        const creditAmount = Number(adjustments.creditAmount || 0);
        const walletAmount = Number(adjustments.walletAmount || 0);
        const reason = adjustments.reason || 'Manual Adjustment';
        const txBaseId = `ADJ-${Date.now()}`;
        
        let newCredit = 0;
        let newWallet = 0;

        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error("User not found");

            const data = userSnap.data();
            newCredit = Math.max(0, Number(data.creditPoints || 0) + creditAmount);
            newWallet = Math.max(0, Number(data.walletBalance || 0) + walletAmount);
            
            transaction.update(userRef, {
                creditPoints: newCredit,
                walletBalance: newWallet,
                'metadata.lastFinancialUpdate': serverTimestamp()
            });

            // 1. Audit Log สำหรับ Admin
            const auditRef = doc(collection(db, getCollectionPath('admin_audits')));
            transaction.set(auditRef, {
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

            // 2. Data Flow Fix: บันทึกลงกระเป๋าเงิน (Wallet) ของลูกค้าเพื่อให้ฝั่ง Frontend มองเห็น
            if (walletAmount !== 0) {
                const walletTxRef = doc(collection(db, getCollectionPath('users'), uid, 'wallet_transactions'));
                transaction.set(walletTxRef, {
                    transactionId: `${txBaseId}-W`,
                    type: walletAmount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
                    amount: Math.abs(walletAmount),
                    status: 'SUCCESS',
                    note: `[Admin] ${reason}`,
                    operatorUid: adminId || 'System',
                    timestamp: serverTimestamp()
                });
            }

            // 3. Data Flow Fix: บันทึกลงแต้มสะสม (Credit Points) ของลูกค้าเพื่อให้ฝั่ง Frontend มองเห็น
            if (creditAmount !== 0) {
                const creditTxRef = doc(collection(db, getCollectionPath('credit_transactions')));
                transaction.set(creditTxRef, {
                    transactionId: `${txBaseId}-C`,
                    uid: uid,
                    type: creditAmount > 0 ? 'deposit' : 'spend',
                    amount: Math.abs(creditAmount),
                    balanceAfter: newCredit,
                    referenceId: 'Admin_Adjustment',
                    recordedBy: adminId || 'System',
                    note: `[Admin] ${reason}`,
                    timestamp: serverTimestamp()
                });
            }
        });
        
        await historyService.addLog('UserManagement', 'AdjustFinancials', uid, `ปรับยอดเงิน/แต้มให้ผู้ใช้ UID: ${uid} (Credit: ${creditAmount}, Wallet: ${walletAmount}) เหตุผล: ${reason}`, adminId || auth.currentUser?.uid);
        console.log(`✅ [UserFinancialAdminService] Financials adjusted securely using transaction for user ${uid}`);
        return { success: true, newCredit, newWallet };

    } catch (error) {
        console.error("❌ [UserFinancialAdminService] Financial adjustment failed:", error);
        throw error;
    }
};
