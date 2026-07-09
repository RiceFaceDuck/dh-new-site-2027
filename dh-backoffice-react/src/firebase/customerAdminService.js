import { db, auth } from './config';
import { collection, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { historyService } from './historyService';
import { generateAccountId } from './customer/accountIdService';
import { gasHistoryService } from './gasHistoryService';
import { computeCustomerChanges } from '../utils/customerDiffUtils';
import { cascadeDisableCustomer, cleanupOrphanedTodos, cascadeDeleteCustomer } from './customer/customerCascadeService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';


const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const createManualCustomer = async (data) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        
        // ถ้าระบุรหัสมาเอง (customerCode/accountId) ให้ใช้ค่านั้น ถ้าไม่ระบุ ให้สร้างใหม่มาตรฐาน
        const accountId = data.accountId || data.customerCode || generateAccountId();

        // 1. สร้าง Document ใหม่เพื่อให้ Firestore สุ่ม ID ให้ก่อน
        const docRef = doc(usersRef);
        await setDoc(docRef, {
            ...data,
            uid: docRef.id,
            accountId: accountId,
            customerCode: accountId, // เก็บไว้เพื่อ backward compatibility
            isManualCustomer: true,
            role: data.rank || 'Customer',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            source: 'manual_entry'
        });
        
        // 3. บันทึก History Log ตามกฎของระบบ Backoffice
        const customerName = getCustomerDisplayName(data, 'Unknown');
        await historyService.addLog('Customer', 'Create', docRef.id, `เพิ่มรายชื่อลูกค้าใหม่: ${customerName} (Account ID: ${accountId})`, auth.currentUser?.uid);

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

        console.log(`✅ [CustomerAdminService] Deleted customer ${customerName} (${targetUid})`);
        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Delete Customer Error:", error);
        throw error;
    }
};

export const syncCustomerAccount = async (manualUid, targetAccountId) => {
    try {
        const { query, where, getDocs, writeBatch } = await import('firebase/firestore');
        const usersRef = collection(db, getCollectionPath('users'));
        
        // 1. หาบัญชี Web ปลายทาง (Target)
        const q = query(usersRef, where('accountId', '==', targetAccountId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error(`ไม่พบบัญชีลูกค้าระบบที่มี ID: ${targetAccountId}`);
        }
        
        const targetDoc = querySnapshot.docs[0];
        const targetData = targetDoc.data();
        const targetUid = targetDoc.id;

        if (!targetData.email) {
            throw new Error(`บัญชีปลายทางยังไม่ได้ยืนยัน Email ไม่สามารถควบรวมได้`);
        }

        if (manualUid === targetUid) {
            throw new Error(`ไม่สามารถซิงค์ข้อมูลเข้าตัวเองได้`);
        }

        // 2. ดึงข้อมูลบัญชี Manual ต้นทาง
        const manualRef = getUserDocRef(manualUid);
        const manualSnap = await getDoc(manualRef);
        
        if (!manualSnap.exists()) {
            throw new Error(`ไม่พบข้อมูลบัญชีต้นทาง`);
        }
        
        const manualData = manualSnap.data();

        // 3. เริ่มโอนย้ายข้อมูล (Batch)
        // สร้าง batch เพื่ออัปเดตข้อมูลทุกอย่างพร้อมกัน
        const batch = writeBatch(db);

        // --- A. อัปเดตข้อมูลลูกค้า (รวม Wallet/Points) ---
        const combinedWallet = Number(targetData.walletBalance || 0) + Number(manualData.walletBalance || 0);
        const combinedPoints = Number(targetData.creditPoints || targetData.stats?.rewardPoints || 0) + Number(manualData.creditPoints || manualData.stats?.rewardPoints || 0);
        
        const updatePayload = {
            walletBalance: combinedWallet,
            creditPoints: combinedPoints,
            updatedAt: serverTimestamp()
        };

        // โอนย้ายข้อมูลติดต่อ (ถ้าปลายทางยังไม่มี)
        if (!targetData.phone && manualData.phone) updatePayload.phone = manualData.phone;
        if (!targetData.address && manualData.address) updatePayload.address = manualData.address;
        if ((!targetData.accountName || targetData.accountName === targetData.displayName) && manualData.accountName) updatePayload.accountName = manualData.accountName;
        
        // กรณีมี Rank ให้เลือก Rank ที่สูงกว่า (สมมติว่าอัปเดตถ้าต้นทางมี)
        if (manualData.rank && !targetData.rank) updatePayload.rank = manualData.rank;

        batch.update(targetDoc.ref, updatePayload);

        // --- B. ย้ายรายการ Orders ---
        const ordersRef = collection(db, getCollectionPath('orders'));
        const ordersQ = query(ordersRef, where('customer.uid', '==', manualUid));
        const ordersSnap = await getDocs(ordersQ);
        ordersSnap.forEach((docSnap) => {
            const currentCustomer = docSnap.data().customer || {};
            batch.update(docSnap.ref, { 
                customer: { ...currentCustomer, uid: targetUid },
                updatedAt: serverTimestamp()
            });
        });

        // --- C. ย้ายรายการ Todos ---
        const todosRef = collection(db, getCollectionPath('todos'));
        const todosQ1 = query(todosRef, where('customerUid', '==', manualUid));
        const todosSnap1 = await getDocs(todosQ1);
        todosSnap1.forEach((docSnap) => {
            batch.update(docSnap.ref, { customerUid: targetUid });
        });

        const todosQ2 = query(todosRef, where('payload.customerUid', '==', manualUid));
        const todosSnap2 = await getDocs(todosQ2);
        todosSnap2.forEach((docSnap) => {
            const currentPayload = docSnap.data().payload || {};
            batch.update(docSnap.ref, { payload: { ...currentPayload, customerUid: targetUid } });
        });

        // --- D. ย้ายรายการ Claims ---
        const claimsRef = collection(db, 'claims');
        const claimsQ = query(claimsRef, where('customerUid', '==', manualUid));
        const claimsSnap = await getDocs(claimsQ);
        claimsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { customerUid: targetUid });
        });

        // --- E. ย้ายรายการ Partners ---
        const partnersRef = collection(db, getCollectionPath('partners'));
        const partnersQ = query(partnersRef, where('ownerId', '==', manualUid));
        const partnersSnap = await getDocs(partnersQ);
        partnersSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { ownerId: targetUid });
        });
        
        // --- F. ย้ายรายการ Credit Transactions ---
        const creditsRef = collection(db, getCollectionPath('credit_transactions'));
        const creditsQ = query(creditsRef, where('uid', '==', manualUid));
        const creditsSnap = await getDocs(creditsQ);
        creditsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { uid: targetUid });
        });

        // --- F.2 ย้ายรายการ Wallet Transactions ---
        const oldWalletTxRef = collection(db, getCollectionPath('users'), manualUid, 'wallet_transactions');
        const walletTxSnap = await getDocs(oldWalletTxRef);
        walletTxSnap.forEach((docSnap) => {
            const newTxRef = doc(collection(db, getCollectionPath('users'), targetUid, 'wallet_transactions'), docSnap.id);
            batch.set(newTxRef, docSnap.data());
            batch.delete(docSnap.ref);
        });

        // --- G. ลบหรือปิดใช้งานบัญชีเดิม (Soft Delete) ---
        batch.update(manualRef, {
            status: 'merged',
            isActive: false,
            mergedInto: targetUid,
            updatedAt: serverTimestamp(),
            mergedAt: serverTimestamp(),
            mergedBy: auth.currentUser?.uid
        });

        await batch.commit();

        // 4. บันทึก Audit Log อย่างละเอียด
        const sourceName = getCustomerDisplayName(manualData, manualUid);
        const targetName = getCustomerDisplayName(targetData, targetUid);
        
        gasHistoryService.log({
            level: 'WARNING',
            module: 'Customer',
            action: 'Merge',
            target: { id: manualUid, name: sourceName },
            details: {
                legacy_details: `โอนย้ายข้อมูลทั้งหมดจากบัญชี: ${sourceName} ไปยังบัญชีเว็บ: ${targetName} (${targetAccountId}) สำเร็จ`,
                merge_stats: {
                    walletTransferred: manualData.walletBalance || 0,
                    pointsTransferred: manualData.creditPoints || 0,
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
            message: `โอนย้ายสำเร็จ (บิล ${ordersSnap.size} รายการ, เงิน ${formatCurrency(manualData.walletBalance || 0)} บาท)` 
        };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Sync Customer Account Error:", error);
        throw error;
    }
};

const formatCurrency = (num) => Number(num || 0).toLocaleString('th-TH');
