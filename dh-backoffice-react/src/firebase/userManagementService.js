import { db } from './config';
import { collection, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, addDoc } from 'firebase/firestore';
import { gasHistoryService } from './gasHistoryService';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const updateUserProfile = async (uid, data) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, {
            ...data,
            'metadata.updatedAt': serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("❌ [UserManagementService] Update Profile Error:", error);
        throw error;
    }
};

export const updateUserRole = async (adminId, targetUid, newRole) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { 
            role: newRole,
            'metadata.roleUpdatedAt': serverTimestamp(),
            'metadata.roleUpdatedBy': adminId
        });
        console.log(`✅ [UserManagementService] Role updated to ${newRole} for UID: ${targetUid}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserManagementService] Update Role Error:", error);
        throw error;
    }
};

export const suspendUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { status: 'suspended' });
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const restoreUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { status: 'active' });
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await deleteDoc(userRef);
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const updateUserLoginStatus = async (uid, isOnline) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, { isOnline });
    } catch (error) {
        // เงียบไว้เพื่อไม่ให้รก Console
    }
};

export const updateUserEcosystem = async (uid, ecoData) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, { ecosystem: ecoData });
        return { success: true };
    } catch (error) {
        console.error("❌ [UserManagementService] Update Ecosystem Error:", error);
        throw error;
    }
};

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
        console.log(`✅ [UserManagementService] Financials adjusted securely using batch for user ${uid}`);
        return { success: true, newCredit, newWallet };

    } catch (error) {
        console.error("❌ [UserManagementService] Financial adjustment failed:", error);
        throw error;
    }
};

export const createManualCustomer = async (data) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        const docRef = await addDoc(usersRef, {
            ...data,
            isManualCustomer: true,
            role: data.rank || 'Customer',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            source: 'manual_entry'
        });
        
        gasHistoryService.log({
            level: 'INFO',
            module: 'Customer',
            action: 'Create',
            target: { id: docRef.id, name: data.accountName || data.displayName || 'Unknown', type: 'Customer' },
            details: {
                legacy_details: `เพิ่มรายชื่อลูกค้าใหม่: ${data.accountName || data.displayName || 'Unknown'}`,
                data: data,
                tags: ['customer_management', 'create']
            }
        });

        console.log(`✅ [UserManagementService] Created manual customer with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("❌ [UserManagementService] Create Manual Customer Error:", error);
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
        
        gasHistoryService.log({
            level: 'WARN',
            module: 'Customer',
            action: 'Update',
            target: { id: uid, name: data.accountName || data.displayName || uid, type: 'Customer' },
            details: {
                legacy_details: `แก้ไขข้อมูลลูกค้า: ${data.accountName || data.displayName || uid}`,
                data: data,
                tags: ['customer_management', 'update']
            }
        });

        return { success: true };
    } catch (error) {
        console.error("❌ [UserManagementService] Update Customer Profile Error:", error);
        throw error;
    }
};

export const deleteCustomer = async (targetUid, customerName) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await deleteDoc(userRef);
        
        gasHistoryService.log({
            level: 'ERROR',
            module: 'Customer',
            action: 'Delete',
            target: { id: targetUid, name: customerName, type: 'Customer' },
            details: {
                legacy_details: `ลบรายชื่อลูกค้า: ${customerName}`,
                tags: ['customer_management', 'delete']
            }
        });

        console.log(`✅ [UserManagementService] Deleted customer ${customerName} (${targetUid})`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserManagementService] Delete Customer Error:", error);
        throw error;
    }
};
