import { db, auth } from './config';
import { limit, collection, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { historyService } from './historyService';
import { generateAccountId } from './customer/accountIdService';
import { gasHistoryService } from './gasHistoryService';
import { computeCustomerChanges } from '../utils/customerDiffUtils';
import { cascadeDisableCustomer, cleanupOrphanedTodos, cascadeDeleteCustomer } from './customer/customerCascadeService';
import { getCollectionPath, formatCurrency } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { syncCustomerToDirectoryChunk } from '../pages/Customers/services/customerCacheService';

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const createManualCustomer = async (data) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        
        // 1. สร้าง Document ใหม่เพื่อให้ Firestore สุ่ม ID ให้ก่อน
        const docRef = doc(usersRef);

        const accountId = data.accountId || data.customerCode || docRef.id.substring(0, 8).toUpperCase();
        const resolvedName = data.accountName || data.displayName || data.name || 'ลูกค้าใหม่';
        const resolvedContact = data.contactName || data.firstName || resolvedName;

        // Ensure address object has dual-key postalCode and zipCode
        let normalizedAddress = data.address;
        if (normalizedAddress && typeof normalizedAddress === 'object') {
            const zip = normalizedAddress.zipCode || normalizedAddress.postalCode || '';
            normalizedAddress = {
                ...normalizedAddress,
                zipCode: zip,
                postalCode: zip
            };
        }

        await setDoc(docRef, {
            ...data,
            uid: docRef.id,
            id: docRef.id,
            accountId: accountId,
            customerCode: accountId,
            name: resolvedName,
            accountName: resolvedName,
            displayName: resolvedName,
            storeName: resolvedName,
            contactName: resolvedContact,
            firstName: resolvedContact,
            ...(normalizedAddress ? { address: normalizedAddress } : {}),
            logisticProvider: data.logisticProvider || data.preferredCourier || '',
            preferredCourier: data.preferredCourier || data.logisticProvider || '',
            logisticNote: data.logisticNote || data.shippingNotes || '',
            shippingNotes: data.shippingNotes || data.logisticNote || '',
            facebook: data.facebook || data.facebookUrl || '',
            facebookUrl: data.facebookUrl || data.facebook || '',
            isManualCustomer: true,
            role: data.rank || data.role || 'Customer',
            rank: data.rank || data.role || 'Customer',
            status: 'active',
            // 💰 เตรียมโครงสร้างการเงินให้พร้อมคำนวณ (ป้องกัน NaN)
            walletBalance: 0,
            creditPoints: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            source: 'manual_entry'
        });

        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('dh_cache_customers');
        }
        
        // 3. บันทึก History Log ตามกฎของระบบ Backoffice
        const customerName = getCustomerDisplayName(data, resolvedName);
        await historyService.addLog('Customer', 'Create', docRef.id, `เพิ่มรายชื่อลูกค้าใหม่: ${customerName} (Account ID: ${accountId})`, auth.currentUser?.uid);

        // 4. Non-blocking sync to catalogs/customers_directory chunk
        try {
            await syncCustomerToDirectoryChunk({
                ...data,
                id: docRef.id,
                uid: docRef.id,
                accountId,
                customerCode: accountId,
                name: resolvedName,
                accountName: resolvedName,
                displayName: resolvedName,
                storeName: resolvedName,
                contactName: resolvedContact,
                firstName: resolvedContact,
                address: normalizedAddress,
                logisticProvider: data.logisticProvider || data.preferredCourier || '',
                preferredCourier: data.preferredCourier || data.logisticProvider || '',
                logisticNote: data.logisticNote || data.shippingNotes || '',
                shippingNotes: data.shippingNotes || data.logisticNote || '',
                facebook: data.facebook || data.facebookUrl || '',
                facebookUrl: data.facebookUrl || data.facebook || '',
                role: data.rank || data.role || 'Customer',
                rank: data.rank || data.role || 'Customer',
                status: 'active',
                isActive: true
            }, 'upsert');
        } catch (syncErr) {
            console.warn("⚠️ [CustomerAdminService] Non-blocking directory chunk sync error on create:", syncErr);
        }

        console.log(`✅ [CustomerAdminService] Created manual customer with ID: ${docRef.id} and Account ID: ${accountId}`);
        return docRef.id;
    } catch (error) {
        console.error("❌ [CustomerAdminService] Create Manual Customer Error:", error);
        throw error;
    }
};

export const updateCustomerProfile = async (uid, data) => {
    try {
        const userRef = getUserDocRef(uid);
        
        // 1. ดึงข้อมูลเก่า (Snapshot) มาเปรียบเทียบ
        const userSnap = await getDoc(userRef);
        let oldData = {};
        if (userSnap.exists()) {
            oldData = userSnap.data();
        }

        // 2. เปรียบเทียบความเปลี่ยนแปลง (Diffing Engine)
        const { changes, changeSummary } = computeCustomerChanges(oldData, data);

        // 3. อัปเดตข้อมูลลง Firestore
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        const customerName = getCustomerDisplayName(data, getCustomerDisplayName(oldData, uid));
        
        // 4. บันทึก History แบบละเอียด (ถ้ามีการเปลี่ยนแปลง)
        if (Object.keys(changes).length > 0) {
            const summaryText = changeSummary.length > 0 ? ` (แก้ไข: ${changeSummary.join(', ')})` : '';
            gasHistoryService.log({
                level: 'INFO',
                module: 'Customer',
                action: 'Update',
                target: { id: uid, name: customerName },
                details: {
                    legacy_details: `แก้ไขข้อมูลลูกค้า: ${customerName}${summaryText}`,
                    changes: changes
                }
            });
        } else {
            // Fallback กรณีไม่มีการเปลี่ยนฟิลด์หลัก
            await historyService.addLog('Customer', 'Update', uid, `แก้ไขข้อมูลลูกค้า: ${customerName}`, auth.currentUser?.uid);
        }

        // 🔒 Strict Data Relations: Cascade Disable Partner if suspended
        if (data.isActive === false || data.status === 'suspended' || data.status === 'deleted') {
            await cascadeDisableCustomer(uid, auth.currentUser?.uid);
            await cleanupOrphanedTodos(uid, auth.currentUser?.uid);
        }

        // 5. Non-blocking sync to catalogs/customers_directory chunk
        try {
            await syncCustomerToDirectoryChunk({
                ...oldData,
                ...data,
                id: uid,
                uid: uid
            }, 'upsert');
        } catch (syncErr) {
            console.warn("⚠️ [CustomerAdminService] Non-blocking directory chunk sync error on update:", syncErr);
        }

        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Update Customer Profile Error:", error);
        throw error;
    }
};

export const deleteCustomer = async (targetUid, customerName) => {
    try {
        const userRef = getUserDocRef(targetUid);
        
        // 🔒 Strict Data Relations: Check wallet balance before deleting
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            const credits = Number(data.creditPoints || data.stats?.rewardPoints || data.walletBalance || 0);
            if (credits > 0) {
                throw new Error("ไม่อนุญาตให้ลบรายชื่อที่มีเครดิต/เงินค้างอยู่ในระบบ (Orphan Data Prevention)");
            }
        }

        // 🗑️ Soft Delete
        await updateDoc(userRef, {
            status: 'deleted',
            isActive: false,
            updatedAt: serverTimestamp(),
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser?.uid
        });
        
        await historyService.addLog('Customer', 'Delete', targetUid, `ลบรายชื่อลูกค้า: ${customerName} (Soft Delete)`, auth.currentUser?.uid);

        // 🔒 Strict Data Relations: Cascade Disable Partner, Map Pin (ActivePartners), and Ads if deleted
        await cascadeDeleteCustomer(targetUid, auth.currentUser?.uid);

        // 🗑️ Non-blocking sync to catalogs/customers_directory chunk
        try {
            await syncCustomerToDirectoryChunk({
                id: targetUid,
                uid: targetUid
            }, 'delete');
        } catch (syncErr) {
            console.warn("⚠️ [CustomerAdminService] Non-blocking directory chunk sync error on delete:", syncErr);
        }

        console.log(`✅ [CustomerAdminService] Deleted customer ${customerName} (${targetUid})`);
        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Delete Customer Error:", error);
        throw error;
    }
};

export const syncCustomerAccount = async (manualUid, targetAccountId) => {
    try {
        const { query, where, getDocs, runTransaction } = await import('firebase/firestore');
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
        const ordersQ = query(ordersRef, where('customer.uid', '==', manualUid), limit(300));
        const ordersSnap = await getDocs(ordersQ);

        // --- C. ย้ายรายการ Todos ---
        const todosRef = collection(db, getCollectionPath('todos'));
        const todosQ1 = query(todosRef, where('customerUid', '==', manualUid), limit(300));
        const todosSnap1 = await getDocs(todosQ1);

        const todosQ2 = query(todosRef, where('payload.customerUid', '==', manualUid), limit(300));
        const todosSnap2 = await getDocs(todosQ2);

        // --- D. ย้ายรายการ Claims ---
        const claimsRef = collection(db, getCollectionPath('claims'));
        const claimsQ = query(claimsRef, where('customerUid', '==', manualUid), limit(300));
        const claimsSnap = await getDocs(claimsQ);

        // --- E. ย้ายรายการ Partners ---
        const partnersRef = collection(db, getCollectionPath('partners'));
        const partnersQ = query(partnersRef, where('ownerId', '==', manualUid), limit(300));
        const partnersSnap = await getDocs(partnersQ);
        
        // --- F. ย้ายรายการ Credit Transactions ---
        const creditsRef = collection(db, getCollectionPath('credit_transactions'));
        const creditsQ = query(creditsRef, where('uid', '==', manualUid), limit(300));
        const creditsSnap = await getDocs(creditsQ);

        // --- F.2 ย้ายรายการ Wallet Transactions ---
        const oldWalletTxRef = collection(db, getCollectionPath('users'), manualUid, 'wallet_transactions');
        const walletTxSnap = await getDocs(oldWalletTxRef);

        let logManualData = {};

        // 3. เริ่มโอนย้ายข้อมูล (Transaction ป้องกันเงินหาย)
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

            // G. อัปเดตสถานะบัญชีเดิม (Soft Delete)
            transaction.update(manualRef, {
                status: 'merged',
                isActive: false,
                mergedInto: targetUid,
                updatedAt: serverTimestamp(),
                mergedAt: serverTimestamp(),
                mergedBy: auth.currentUser?.uid
            });

            // อัปเดตข้อมูลลูกหลานทั้งหมด
            ordersSnap.forEach((docSnap) => {
                const currentCustomer = docSnap.data().customer || {};
                transaction.update(docSnap.ref, { 
                    customer: { ...currentCustomer, uid: targetUid },
                    updatedAt: serverTimestamp()
                });
            });

            todosSnap1.forEach((docSnap) => {
                transaction.update(docSnap.ref, { customerUid: targetUid });
            });

            todosSnap2.forEach((docSnap) => {
                const currentPayload = docSnap.data().payload || {};
                transaction.update(docSnap.ref, { payload: { ...currentPayload, customerUid: targetUid } });
            });

            claimsSnap.forEach((docSnap) => {
                transaction.update(docSnap.ref, { customerUid: targetUid });
            });

            partnersSnap.forEach((docSnap) => {
                transaction.update(docSnap.ref, { ownerId: targetUid });
            });
            
            creditsSnap.forEach((docSnap) => {
                transaction.update(docSnap.ref, { uid: targetUid });
            });

            walletTxSnap.forEach((docSnap) => {
                const newTxRef = doc(collection(db, getCollectionPath('users'), targetUid, 'wallet_transactions'), docSnap.id);
                transaction.set(newTxRef, docSnap.data());
                transaction.delete(docSnap.ref);
            });
        });

        // 4. บันทึก Audit Log อย่างละเอียด
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
        console.error("❌ [CustomerAdminService] Sync Customer Account Error:", error);
        throw error;
    }
};


