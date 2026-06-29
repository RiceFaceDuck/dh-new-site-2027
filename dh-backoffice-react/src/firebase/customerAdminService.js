import { db, auth } from './config';
import { collection, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import { historyService } from './historyService';
import { generateAccountId } from './customer/accountIdService';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const createManualCustomer = async (data) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        
        // ถ้าระบุรหัสมาเอง (customerCode/accountId) ให้ใช้ค่านั้น ถ้าไม่ระบุ ให้สร้างใหม่มาตรฐาน
        const accountId = data.accountId || data.customerCode || generateAccountId();

        // 1. สร้าง Document ใหม่เพื่อให้ Firestore สุ่ม ID ให้ก่อน
        const docRef = await addDoc(usersRef, {
            ...data,
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
        const customerName = data.accountName || data.displayName || 'Unknown';
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
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        const customerName = data.accountName || data.displayName || uid;
        await historyService.addLog('Customer', 'Update', uid, `แก้ไขข้อมูลลูกค้า: ${customerName}`, auth.currentUser?.uid);

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

        console.log(`✅ [CustomerAdminService] Deleted customer ${customerName} (${targetUid})`);
        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Delete Customer Error:", error);
        throw error;
    }
};
