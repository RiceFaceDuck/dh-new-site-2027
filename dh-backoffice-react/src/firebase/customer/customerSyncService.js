import { db, auth } from '../config';
import { collection, doc, serverTimestamp, query, where, limit, getDocs, runTransaction } from 'firebase/firestore';
import { gasHistoryService } from '../gasHistoryService';
import { commitBatchChunks } from './customerCascadeService';
import { getCollectionPath, formatCurrency } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

/**
 * Sync and merge a manual/offline customer account into an existing Web user account.
 * Transfers wallet balances, credit points, orders, claims, and todos atomically.
 *
 * @param {string} manualUid - Source manual customer UID
 * @param {string} targetAccountId - Target Web Account ID
 * @returns {Promise<{success: boolean, targetUid: string, message: string}>}
 */
export const syncCustomerAccount = async (manualUid, targetAccountId) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        
        // 1. หาบัญชี Web ปลายทาง (Target)
        const q = query(usersRef, where('accountId', '==', targetAccountId), limit(300));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error(`ไม่พบบัญชีลูกค้าระบบที่มี ID: ${targetAccountId}`);
        }
        
        const targetDoc = querySnapshot.docs[0];
        const targetData = targetDoc.data();
        const targetUid = targetDoc.id;
        const targetDocRef = targetDoc.ref;

        if (!targetData.email) {
            throw new Error(`บัญชีปลายทางยังไม่ได้ยืนยัน Email ไม่สามารถควบรวมได้`);
        }

        if (manualUid === targetUid) {
            throw new Error(`ไม่สามารถซิงค์ข้อมูลเข้าตัวเองได้`);
        }

        const manualRef = getUserDocRef(manualUid);

        // 2. ดึงข้อมูลลูกหลานทั้งหมดไว้ก่อน (เตรียมความพร้อมก่อนเข้า Transaction)
        // --- B. ย้ายรายการ Orders ---
        const ordersRef = collection(db, getCollectionPath('orders'));
        const ordersQ = query(ordersRef, where('customer.uid', '==', manualUid), limit(500));
        const ordersSnap = await getDocs(ordersQ);

        // --- C. ย้ายรายการ Todos ---
        const todosRef = collection(db, getCollectionPath('todos'));
        const todosQ1 = query(todosRef, where('customerUid', '==', manualUid), limit(500));
        const todosSnap1 = await getDocs(todosQ1);

        const todosQ2 = query(todosRef, where('payload.customerUid', '==', manualUid), limit(500));
        const todosSnap2 = await getDocs(todosQ2);

        // --- D. ย้ายรายการ Claims ---
        const claimsRef = collection(db, getCollectionPath('claims'));
        const claimsQ1 = query(claimsRef, where('customerUid', '==', manualUid), limit(500));
        const claimsSnap1 = await getDocs(claimsQ1);

        const claimsQ2 = query(claimsRef, where('payload.customerUid', '==', manualUid), limit(500));
        const claimsSnap2 = await getDocs(claimsQ2);

        // --- E. ย้ายรายการ Partners ---
        const partnersRef = collection(db, getCollectionPath('partners'));
        const partnersQ = query(partnersRef, where('ownerId', '==', manualUid), limit(500));
        const partnersSnap = await getDocs(partnersQ);
        
        // --- F. ย้ายรายการ Credit Transactions ---
        const creditsRef = collection(db, getCollectionPath('credit_transactions'));
        const creditsQ = query(creditsRef, where('uid', '==', manualUid), limit(500));
        const creditsSnap = await getDocs(creditsQ);

        // --- F.2 ย้ายรายการ Wallet Transactions ---
        const oldWalletTxRef = collection(db, getCollectionPath('users'), manualUid, 'wallet_transactions');
        const walletTxQ = query(oldWalletTxRef, limit(500));
        const walletTxSnap = await getDocs(walletTxQ);

        let logManualData = {};

        // 3. เริ่มโอนย้ายข้อมูลหลัก (Strict Financial Transaction) ป้องกันเงินหาย
        await runTransaction(db, async (transaction) => {
            // A. ดึงข้อมูลล่าสุดแบบล็อก (Pessimistic Lock)
            const tTargetSnap = await transaction.get(targetDocRef);
            const tManualSnap = await transaction.get(manualRef);
            
            if (!tTargetSnap.exists() || !tManualSnap.exists()) {
                throw new Error("ข้อมูลบัญชีปลายทางหรือต้นทางสูญหายระหว่างทำรายการ");
            }

            const tTargetData = tTargetSnap.data();
            const tManualData = tManualSnap.data();
            logManualData = tManualData;

            // คำนวณเงินและพ้อยท์แบบสดๆ ณ วินาทีนั้น
            const combinedWallet = Number(tTargetData.walletBalance || 0) + Number(tManualData.walletBalance || 0);
            const combinedPoints = Number(tTargetData.creditPoints || tTargetData.stats?.rewardPoints || 0) + Number(tManualData.creditPoints || tManualData.stats?.rewardPoints || 0);
            const combinedAccumulated = Number(tTargetData.totalAccumulatedPoints || tTargetData.creditPoints || 0) + Number(tManualData.totalAccumulatedPoints || tManualData.creditPoints || 0);
            
            const updatePayload = {
                walletBalance: combinedWallet,
                creditPoints: combinedPoints,
                totalAccumulatedPoints: combinedAccumulated,
                updatedAt: serverTimestamp()
            };

            // โอนย้ายข้อมูลติดต่อ (ถ้าปลายทางยังไม่มี)
            if (!tTargetData.phone && tManualData.phone) updatePayload.phone = tManualData.phone;
            if (!tTargetData.address && tManualData.address) updatePayload.address = tManualData.address;
            if ((!tTargetData.accountName || tTargetData.accountName === tTargetData.displayName) && tManualData.accountName) updatePayload.accountName = tManualData.accountName;
            
            if (tManualData.rank && !tTargetData.rank) updatePayload.rank = tManualData.rank;

            transaction.update(targetDocRef, updatePayload);

            // G. อัปเดตสถานะบัญชีเดิม (Soft Delete & Zero Out Balance Invariant)
            transaction.update(manualRef, {
                creditPoints: 0,
                totalAccumulatedPoints: 0,
                walletBalance: 0,
                status: 'merged',
                isActive: false,
                mergedInto: targetUid,
                updatedAt: serverTimestamp(),
                mergedAt: serverTimestamp(),
                mergedBy: auth.currentUser?.uid
            });
        });

        // 4. Chunked Batch สำหรับข้อมูลลูกหลานทั้งหมด (ป้องกัน Transaction 500 Limit Crash)
        const chunkOperations = [];

        const targetCustomerName = getCustomerDisplayName(targetData, 'ลูกค้าทั่วไป');
        ordersSnap.forEach((docSnap) => {
            const currentCustomer = docSnap.data().customer || {};
            chunkOperations.push({
                type: 'update',
                ref: docSnap.ref,
                data: { 
                    customer: { 
                        ...currentCustomer, 
                        uid: targetUid,
                        accountName: targetCustomerName,
                        storeName: targetData.storeName || targetCustomerName,
                        displayName: targetCustomerName,
                        name: targetCustomerName,
                        phone: targetData.phone || currentCustomer.phone || ''
                    },
                    updatedAt: serverTimestamp()
                }
            });
        });

        todosSnap1.forEach((docSnap) => {
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: { customerUid: targetUid } });
        });

        todosSnap2.forEach((docSnap) => {
            const currentPayload = docSnap.data().payload || {};
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: { payload: { ...currentPayload, customerUid: targetUid } } });
        });

        const seenClaimSyncIds = new Set();
        claimsSnap1.forEach((docSnap) => {
            seenClaimSyncIds.add(docSnap.id);
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: { customerUid: targetUid } });
        });

        claimsSnap2.forEach((docSnap) => {
            const currentPayload = docSnap.data().payload || {};
            const updateData = { payload: { ...currentPayload, customerUid: targetUid } };
            if (!seenClaimSyncIds.has(docSnap.id)) {
                updateData.customerUid = targetUid;
            }
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: updateData });
        });

        partnersSnap.forEach((docSnap) => {
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: { ownerId: targetUid } });
        });
        
        creditsSnap.forEach((docSnap) => {
            chunkOperations.push({ type: 'update', ref: docSnap.ref, data: { uid: targetUid } });
        });

        walletTxSnap.forEach((docSnap) => {
            const newTxRef = doc(collection(db, getCollectionPath('users'), targetUid, 'wallet_transactions'), docSnap.id);
            chunkOperations.push({ type: 'set', ref: newTxRef, data: docSnap.data() });
            chunkOperations.push({ type: 'delete', ref: docSnap.ref });
        });

        if (chunkOperations.length > 0) {
            try {
                await commitBatchChunks(db, chunkOperations);
            } catch (chunkErr) {
                console.error("⚠️ [CustomerSyncService] Subcollection batch transfer encountered partial error:", chunkErr);
            }
        }

        // 5. บันทึก Audit Log อย่างละเอียด
        const sourceName = getCustomerDisplayName(logManualData, manualUid);
        const targetName = getCustomerDisplayName(targetData, targetUid);
        
        gasHistoryService.log({
            level: 'WARNING',
            module: 'Customer',
            action: 'Merge',
            target: { id: manualUid, name: sourceName },
            details: {
                legacy_details: `โอนย้ายข้อมูลทั้งหมดจากบัญชี: ${sourceName} ไปยังบัญชีเว็บ: ${targetName} (${targetAccountId}) สำเร็จ`,
                merge_stats: {
                    walletTransferred: logManualData.walletBalance || 0,
                    pointsTransferred: logManualData.creditPoints || 0,
                    ordersMoved: ordersSnap.size,
                    claimsMoved: claimsSnap.size,
                    todosMoved: todosSnap1.size + todosSnap2.size,
                    partnersMoved: partnersSnap.size
                }
            }
        });

        return { 
            success: true, 
            targetUid, 
            message: `โอนย้ายสำเร็จ (บิล ${ordersSnap.size} รายการ, เงิน ${formatCurrency(logManualData.walletBalance || 0)} บาท)` 
        };
    } catch (error) {
        console.error("❌ [CustomerSyncService] Sync Customer Account Error:", error);
        throw error;
    }
};
