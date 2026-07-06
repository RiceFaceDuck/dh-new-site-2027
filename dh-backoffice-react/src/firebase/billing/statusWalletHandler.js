import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { adjustUserCreditWithTransaction } from '../credit/creditActionService';

export const handleWalletRefundAndClawback = async (
    transaction, 
    db, 
    orderId, 
    orderData, 
    userSnap, 
    userRef, 
    settingsSnap, 
    settingsRef, 
    actualActorUid, 
    normalizedCurrentStatus, 
    updates
) => {
    let refundAmount = 0;
    if (normalizedCurrentStatus === 'paid') {
        refundAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
    } else {
        refundAmount = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
    }
    
    let clawbackPoints = Number(orderData.earnedPoints || 0); 
    let cancelledPending = 0;
    if (orderData.pendingCredits && orderData.pendingCredits > 0 && orderData.status !== 'received') {
        cancelledPending = orderData.pendingCredits;
        clawbackPoints = 0; 
        updates.pendingCredits = 0; 
    }

    if (refundAmount > 0) {
        // ✅ [SECURITY FIX] Refund to walletBalance (Cash) instead of creditPoints (Points)
        transaction.update(userRef, {
            walletBalance: increment(refundAmount),
            updatedAt: serverTimestamp()
        });

        const walletTxRef = doc(collection(db, `users/${userSnap.id}/wallet_transactions`));
        transaction.set(walletTxRef, {
            transactionId: `TXW_REF_${orderId}`,
            type: 'REFUND',
            amount: refundAmount,
            status: 'SUCCESS',
            note: 'คืนเงินเข้ากระเป๋าอัตโนมัติ (ยกเลิกบิล)',
            operatorUid: actualActorUid || 'System',
            timestamp: serverTimestamp()
        });
    }

    if (clawbackPoints > 0) {
        await adjustUserCreditWithTransaction(
            transaction,
            userSnap.id,
            clawbackPoints,
            'clawback',
            'ดึงแต้มสะสมคืนอัตโนมัติ (ยกเลิกบิล)',
            actualActorUid,
            `CB_${orderId}`
        );
    }
};

export const handlePointsEarned = async (
    transaction,
    db,
    orderId,
    totalSaleAmount,
    orderData,
    userSnap,
    userRef,
    actualActorUid,
    updates
) => {
    const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
    const amountForPoints = totalSaleAmount - walletUsed;
    const POINTS_RATE = 100; // ควรดึงจาก settings ถ้าระบบรองรับ
    
    if (amountForPoints > 0) {
        const earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
        if (earnedPoints > 0) {
            await adjustUserCreditWithTransaction(
                transaction,
                userSnap.id,
                earnedPoints,
                'earn',
                'ได้รับจากการซื้อสินค้า (ยืนยันยอดโอน)',
                actualActorUid,
                `TXP_${orderId}`
            );
            updates.earnedPoints = earnedPoints; 
        }
    }
};
