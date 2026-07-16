import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { adjustUserCreditWithTransaction } from '../credit/creditActionService';
import { calculateEarnedPoints } from '../credit/creditFormatService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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
    updates,
    creditPreloadSnaps = null
) => {
    try {
        // ✅ [SECURITY FIX] คืนเงินเข้า Wallet เฉพาะยอดที่จ่ายด้วย Wallet จริงๆ เท่านั้น (ไม่เอาส่วนที่โอนเงินสดมาทบเข้า Wallet)
        // หากมีการจ่ายผ่านธนาคารด้วย แอดมินต้องโอนเงินสดคืนลูกค้าเอง
        let refundAmount = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
        
        // ✅ [SECURITY FIX] Ensure refundAmount is valid and non-negative
        refundAmount = isNaN(refundAmount) ? 0 : Math.max(0, refundAmount);
        
        // ✅ [SECURITY FIX] Clawback points properly based on pointsAwarded flag
        let clawbackPoints = 0;
        if (orderData.pointsAwarded) {
            // Points were actually awarded, so we claw them back
            clawbackPoints = Number(orderData.pendingCredits || orderData.earnedPoints || 0);
            updates.pendingCredits = 0; // Clear it for consistency
            updates.pointsAwarded = false;
        } else if (orderData.pendingCredits && orderData.pendingCredits > 0) {
            // Points were never awarded (still pending), just zero them out
            updates.pendingCredits = 0;
        }

        if (refundAmount > 0) {
            // ✅ [SECURITY FIX] Refund to walletBalance (Cash) instead of creditPoints (Points)
            transaction.update(userRef, {
                walletBalance: increment(refundAmount),
                updatedAt: serverTimestamp()
            });

            const walletTxRef = doc(collection(db, getCollectionPath('users'), userSnap.id, 'wallet_transactions'));
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
                `CB_${orderId}`,
                creditPreloadSnaps
            );
        }
    } catch (error) {
        console.error("🔥 Error in handleWalletRefundAndClawback:", error);
        throw error;
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
    updates,
    creditPreloadSnaps = null
) => {
    try {
        // 1. ดึงแต้มจากระบบตะกร้าออนไลน์ก่อน ถ้ามีการคำนวณไว้
        let earnedPoints = Number(orderData.pendingCredits || 0);

        // 2. ถ้าไม่มี ค่อยคำนวณเอง (กรณีมาจาก POS / Backoffice สร้างบิลเอง)
        if (earnedPoints <= 0) {
            const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
            const amountForPoints = totalSaleAmount - walletUsed;
            
            if (amountForPoints > 0) {
                const settingsSnap = creditPreloadSnaps?.settingsSnap;
                if (settingsSnap && settingsSnap.exists()) {
                    const settingsData = settingsSnap.data() || {};
                    const creditConfig = settingsData.creditConfig || {};
                    const userData = userSnap.data() || {};
                    const userTotalAccumulatedPoints = userData.totalAccumulatedPoints || 0;
                    
                    // คำนวณแต้มด้วย Tier Multiplier อย่างถูกต้อง
                    earnedPoints = calculateEarnedPoints(amountForPoints, creditConfig, orderData.items || [], userTotalAccumulatedPoints);
                } else {
                    // Fallback แบบเดิม
                    const POINTS_RATE = 100;
                    earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
                }
            }
        }
        
        if (earnedPoints > 0) {
            await adjustUserCreditWithTransaction(
                transaction,
                userSnap.id,
                earnedPoints,
                'earn',
                'ได้รับจากการซื้อสินค้า (ยืนยันชำระเงิน)',
                actualActorUid,
                `TXP_${orderId}`,
                creditPreloadSnaps
            );
            updates.earnedPoints = earnedPoints; 
            
            // ✅ [SECURITY FIX] ตั้งค่า pointsAwarded ให้เป็น true เพื่อเป็นสัญลักษณ์ว่าได้แจกแต้มไปแล้วจริงๆ
            updates.pointsAwarded = true;
            // ✅ เคลียร์ pendingCredits เพื่อไม่ให้ซ้ำซ้อน
            updates.pendingCredits = 0;
        }
    } catch (error) {
        console.error("🔥 Error in handlePointsEarned:", error);
        throw error;
    }
};
