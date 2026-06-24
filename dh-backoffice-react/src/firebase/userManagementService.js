import { db, auth } from './config';
import { collection, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, addDoc } from 'firebase/firestore';
import { historyService } from './historyService';

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
        
        await historyService.addLog('UserManagement', 'UpdateProfile', uid, `แก้ไขโปรไฟล์ผู้ใช้ UID: ${uid}`, auth.currentUser?.uid);
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
        
        await historyService.addLog('UserManagement', 'UpdateRole', targetUid, `เปลี่ยนตำแหน่งผู้ใช้ UID: ${targetUid} เป็น ${newRole}`, adminId || auth.currentUser?.uid);
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
        
        await historyService.addLog('UserManagement', 'SuspendUser', targetUid, `ระงับบัญชีผู้ใช้ UID: ${targetUid}`, adminId || auth.currentUser?.uid);
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const restoreUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { status: 'active' });
        
        await historyService.addLog('UserManagement', 'RestoreUser', targetUid, `ยกเลิกระงับบัญชีผู้ใช้ UID: ${targetUid}`, adminId || auth.currentUser?.uid);
        return { success: true };
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await deleteDoc(userRef);
        
        await historyService.addLog('UserManagement', 'DeleteUser', targetUid, `ลบบัญชีผู้ใช้ UID: ${targetUid}`, adminId || auth.currentUser?.uid);
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

// The remaining file ends here. Extracted functions removed.
