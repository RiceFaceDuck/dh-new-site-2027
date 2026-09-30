import { db, auth } from './config';
import { doc, collection, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { getCollectionPath, getUsersPath, getUserSubcollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { gasHistoryService } from './gasHistoryService';

/**
 * 🚀 ดำเนินการโอนเงินคืน / จ่ายเงินสดคืนให้ลูกค้า (Customer Drawer Refund)
 * @param {Object} params
 * @param {string} params.customerId - UID ของลูกค้า
 * @param {number} params.amount - จำนวนเงินที่โอนคืน
 * @param {string} params.refundMethod - 'BANK_TRANSFER' | 'CASH'
 * @param {string} [params.slipUrl] - URL รูปสลิปโอนเงิน (ถ้ามี)
 * @param {string} [params.note] - หมายเหตุเพิ่มเติม
 * @param {Object} [params.adminInfo] - ข้อมูลผู้ทำรายการ { uid, name }
 */
export const executeCustomerRefund = async ({
    customerId,
    amount,
    refundMethod = 'BANK_TRANSFER',
    slipUrl = null,
    note = '',
    adminInfo = null
}) => {
    const safeAmount = Math.round(Number(amount) * 100) / 100;
    if (!customerId || isNaN(safeAmount) || safeAmount <= 0) {
        throw new Error("ข้อมูลระบุตัวตนลูกค้าหรือจำนวนเงินไม่ถูกต้อง");
    }

    const currentAdminUid = adminInfo?.uid || auth.currentUser?.uid || 'Manager';
    const currentAdminName = adminInfo?.displayName || adminInfo?.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Manager';

    // 🛡️ ป้องกัน Base64 Data URL ขนาดใหญ่หลุดเข้ามาใน Firestore transaction
    let sanitizedSlipUrl = slipUrl || null;
    if (sanitizedSlipUrl && typeof sanitizedSlipUrl === 'string') {
        if (sanitizedSlipUrl.startsWith('data:image/') || sanitizedSlipUrl.length > 2000) {
            console.warn("⚠️ [CustomerRefundService] Rejected raw Base64 data URL in Firestore transaction to prevent document size overflow.");
            sanitizedSlipUrl = null;
        }
    }

    try {
        const result = await runTransaction(db, async (transaction) => {
            const userRef = doc(db, getUsersPath(), customerId);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) {
                throw new Error("ไม่พบบัญชีลูกค้ารายนี้ในระบบ");
            }

            const userData = userSnap.data();
            const currentWallet = Number(userData.walletBalance || 0);
            const currentPending = Number(userData.pendingWithdrawal || 0);

            // หากมี pendingWithdrawal ให้หัก pending ก่อน หากไม่มีให้หัก walletBalance
            let walletDeduct = 0;
            let pendingDeduct = 0;

            if (currentPending >= safeAmount) {
                pendingDeduct = safeAmount;
            } else if (currentPending > 0) {
                pendingDeduct = currentPending;
                walletDeduct = safeAmount - currentPending;
            } else {
                walletDeduct = safeAmount;
            }

            // ป้องกันการหักเงินเกินยอดคงเหลือรวม
            if ((currentWallet + currentPending) < safeAmount) {
                throw new Error(`ยอดเงินค้างในระบบของลูกค้า (฿${(currentWallet + currentPending).toLocaleString('th-TH')}) มีไม่เพียงพอต่อการคืนเงิน ฿${safeAmount.toLocaleString('th-TH')}`);
            }

            let newWalletBalance = currentWallet;
            const updateData = {
                updatedAt: serverTimestamp()
            };
            if (pendingDeduct > 0) {
                updateData.pendingWithdrawal = Math.round((currentPending - pendingDeduct) * 100) / 100;
            }
            if (walletDeduct > 0) {
                newWalletBalance = Math.round((currentWallet - walletDeduct) * 100) / 100;
                updateData.walletBalance = newWalletBalance;
            }

            // 1. อัปเดตยอดเงินคงเหลือของลูกค้า
            transaction.update(userRef, updateData);

            const txId = `REFUND-${Date.now()}`;

            // 2. บันทึกลง Statement ของลูกค้า (users/{uid}/wallet_transactions)
            const userTxRef = doc(collection(db, getUserSubcollectionPath(customerId, 'wallet_transactions')));
            transaction.set(userTxRef, {
                transactionId: txId,
                type: 'WITHDRAWAL_COMPLETED',
                refundMethod: refundMethod,
                amount: safeAmount,
                balanceAfter: newWalletBalance,
                status: 'SUCCESS',
                slipUrl: sanitizedSlipUrl,
                note: note || (refundMethod === 'CASH' ? 'คืนเงินสดเรียบร้อยแล้ว' : 'โอนเงินคืนสำเร็จเรียบร้อย'),
                operatorUid: currentAdminUid,
                operatorName: currentAdminName,
                timestamp: serverTimestamp()
            });

            // 3. บันทึก Audit Log ฝั่ง Admin (admin_audits)
            const auditRef = doc(collection(db, getCollectionPath('admin_audits')));
            transaction.set(auditRef, {
                action: 'CUSTOMER_REFUND',
                targetUid: customerId,
                targetName: userData.displayName || userData.accountName || 'Customer',
                amount: safeAmount,
                refundMethod: refundMethod,
                slipUrl: sanitizedSlipUrl,
                note: note,
                performedBy: currentAdminUid,
                performedByName: currentAdminName,
                timestamp: serverTimestamp()
            });

            // 4. บันทึก System Log
            const systemLogRef = doc(collection(db, getCollectionPath('system_logs')));
            transaction.set(systemLogRef, {
                actionType: 'CUSTOMER_REFUND_EXECUTED',
                customerId: customerId,
                amount: safeAmount,
                refundMethod: refundMethod,
                slipUrl: sanitizedSlipUrl,
                createdBy: currentAdminUid,
                createdAt: serverTimestamp()
            });

            return {
                txId,
                refundMethod,
                safeAmount,
                customerName: userData.displayName || userData.accountName || 'Customer'
            };
        });

        // 5. 🔥 GAS History Sync -> ยิงเข้า Google Sheets ฝ่ายบัญชี
        gasHistoryService.log({
            level: 'INFO',
            module: 'FINANCIAL_REFUND',
            action: 'CUSTOMER_REFUND_EXECUTED',
            target: { id: customerId, name: result.customerName, type: 'CUSTOMER' },
            result: { status: 'SUCCESS' },
            details: {
                amount: safeAmount,
                refundMethod: refundMethod,
                slipUrl: sanitizedSlipUrl || 'N/A',
                note: note || 'N/A',
                txId: result.txId
            },
            actorOverride: {
                uid: currentAdminUid,
                name: currentAdminName,
                email: auth.currentUser?.email || 'N/A',
                userAgent: navigator.userAgent
            }
        });

        console.log(`✅ [CustomerRefundService] Refund ฿${safeAmount} (${refundMethod}) for user ${customerId} completed successfully.`);
        return { success: true, ...result };

    } catch (error) {
        console.error("❌ [CustomerRefundService] Customer refund failed:", error);
        throw error;
    }
};
