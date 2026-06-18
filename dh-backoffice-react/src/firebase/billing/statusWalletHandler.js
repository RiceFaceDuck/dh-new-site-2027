import { doc, collection, serverTimestamp } from 'firebase/firestore';

export const handleWalletRefundAndClawback = (
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

    if (refundAmount > 0 || clawbackPoints > 0 || cancelledPending > 0) {
        const currentWallet = userSnap.data().creditPoints || 0;
        const currentPoints = userSnap.data().stats?.rewardPoints || 0;
        
        const newWalletBalance = currentWallet + refundAmount;
        const newPointsBalance = Math.max(0, currentPoints - clawbackPoints);

        transaction.update(userRef, { 
            'creditPoints': newWalletBalance, 
            'stats.rewardPoints': newPointsBalance, 
            updatedAt: serverTimestamp() 
        });

        if (refundAmount > 0 && settingsSnap && settingsSnap.exists()) {
            const ledger = settingsSnap.data().ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };
            const newTotalAllocated = ledger.totalAllocated + refundAmount;
            let newLedgerStatus = 'SECURE';
            if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 0.9) newLedgerStatus = 'WARNING';
            if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 1) newLedgerStatus = 'BREACHED';

            transaction.set(settingsRef, { 
                ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() }, 
                updatedAt: serverTimestamp() 
            }, { merge: true });

            transaction.set(doc(db, 'credit_transactions', `REF_${orderId}`), {
                transactionId: `TXR-${Date.now()}`, 
                uid: userSnap.id, 
                type: 'refund', 
                amount: refundAmount, 
                balanceAfter: newWalletBalance, 
                referenceId: orderId, 
                note: 'คืนเงินเข้ากระเป๋าอัตโนมัติ (ยกเลิกบิล)', 
                recordedBy: actualActorUid, 
                timestamp: serverTimestamp()
            });
        }

        if (clawbackPoints > 0) {
            transaction.set(doc(db, 'point_transactions', `CB_${orderId}`), {
                transactionId: `CB-${Date.now()}`, 
                uid: userSnap.id, 
                type: 'deduct', 
                points: clawbackPoints, 
                balanceAfter: newPointsBalance, 
                referenceId: orderId, 
                note: 'ดึงแต้มสะสมคืนอัตโนมัติ (ยกเลิกบิล)', 
                recordedBy: actualActorUid, 
                timestamp: serverTimestamp()
            });
        }
    }
};

export const handlePointsEarned = (
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
    const POINTS_RATE = 100;
    
    if (amountForPoints > 0) {
        const earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
        if (earnedPoints > 0) {
            const currentPoints = userSnap.data().stats?.rewardPoints || 0;
            const newPointsBalance = currentPoints + earnedPoints;

            transaction.update(userRef, { 
                'stats.rewardPoints': newPointsBalance, 
                updatedAt: serverTimestamp() 
            });
            
            transaction.set(doc(collection(db, 'point_transactions')), {
                transactionId: `TXP-${Date.now()}`, 
                uid: userSnap.id, 
                type: 'earn', 
                points: earnedPoints, 
                balanceAfter: newPointsBalance, 
                referenceId: orderId, 
                note: 'ได้รับจากการซื้อสินค้า (ยืนยันยอดโอน)', 
                recordedBy: actualActorUid, 
                timestamp: serverTimestamp()
            });
            
            updates.earnedPoints = earnedPoints; 
        }
    }
};
