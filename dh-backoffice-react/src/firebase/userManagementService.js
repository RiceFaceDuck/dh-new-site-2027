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

const runCascadeUserDeactivation = async (targetUid, actorUid) => {
    try {
        const { query, where, getDocs, writeBatch } = await import('firebase/firestore');
        const batch = writeBatch(db);
        let hasUpdates = false;

        // 1. Disable in partners collection
        const partnersRef = collection(db, getCollectionPath('partners'));
        const partnersQ = query(partnersRef, where('ownerId', '==', targetUid));
        const partnersSnap = await getDocs(partnersQ);
        partnersSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { isActive: false, updatedAt: serverTimestamp() });
            hasUpdates = true;
        });

        // 2. Delete from ActivePartners (Frontend Map Pins)
        const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), targetUid);
        batch.delete(activePartnerRef);
        hasUpdates = true;

        // 3. Pause active ads
        const adCols = ['partner_ads', 'billboard_ads', 'user_sku_ads'];
        for (const col of adCols) {
            const adsRef = collection(db, getCollectionPath(col));
            const adsQ = query(adsRef, where('ownerId', '==', targetUid));
            const adsSnap = await getDocs(adsQ);
            adsSnap.forEach(adDoc => {
                batch.update(adDoc.ref, {
                    status: 'paused',
                    isActive: false,
                    pauseReason: 'Owner account was deleted/suspended',
                    updatedAt: serverTimestamp()
                });
                hasUpdates = true;
            });
        }

        // 4. Cancel active/pending todos (as creator, assignee, or customer)
        const todosRef = collection(db, getCollectionPath('todos'));
        const activeStatuses = ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing'];
        
        const q1 = query(todosRef, where('createdByUid', '==', targetUid), where('status', 'in', activeStatuses));
        const q2 = query(todosRef, where('customerUid', '==', targetUid), where('status', 'in', activeStatuses));
        const q3 = query(todosRef, where('assignedTo', '==', targetUid), where('status', 'in', activeStatuses));
        const q4 = query(todosRef, where('payload.customerUid', '==', targetUid), where('status', 'in', activeStatuses));

        const [snap1, snap2, snap3, snap4] = await Promise.all([
            getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)
        ]);

        const processedTodoIds = new Set();
        const processSnap = (snap) => {
            snap.forEach((docSnap) => {
                if (!processedTodoIds.has(docSnap.id)) {
                    processedTodoIds.add(docSnap.id);
                    batch.update(docSnap.ref, {
                        status: 'cancelled',
                        cancelReason: 'Creator/assignee/customer account was suspended or deleted',
                        updatedAt: serverTimestamp()
                    });
                    hasUpdates = true;
                }
            });
        };

        processSnap(snap1);
        processSnap(snap2);
        processSnap(snap3);
        processSnap(snap4);

        if (hasUpdates) {
            await batch.commit();
            await historyService.addLog('UserManagement', 'CascadeDeactivate', targetUid, `ลบร้านช่างบนแผนที่ ระงับโฆษณา และยกเลิกงาน Todo ที่เกี่ยวข้องกับ UID: ${targetUid}`, actorUid);
        }
    } catch (err) {
        console.error("🔥 Error during cascade deactivation:", err);
    }
};

export const suspendUser = async (adminId, targetUid) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { status: 'suspended' });
        
        await historyService.addLog('UserManagement', 'SuspendUser', targetUid, `ระงับบัญชีผู้ใช้ UID: ${targetUid}`, adminId || auth.currentUser?.uid);
        
        // 🔒 Cascade deactivation for partners, ActivePartners, ads, and todos
        await runCascadeUserDeactivation(targetUid, adminId || auth.currentUser?.uid || 'system');
        
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
        
        // 🔒 Strict Data Relations: Check wallet balance before deleting
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            const credits = Number(data.creditPoints || data.stats?.rewardPoints || data.walletBalance || 0);
            if (credits > 0) {
                throw new Error("ไม่อนุญาตให้ลบรายชื่อที่มีเครดิต/เงินค้างอยู่ในระบบ (Orphan Data Prevention)");
            }
        }

        // 🗑️ Hard Delete (PDPA Right to be Forgotten)
        await deleteDoc(userRef);
        
        await historyService.addLog('UserManagement', 'DeleteUser', targetUid, `ลบบัญชีผู้ใช้ UID: ${targetUid} (Hard Delete ถาวร)`, adminId || auth.currentUser?.uid);
        
        // 🔒 Cascade deactivation for partners, ActivePartners, ads, and todos
        await runCascadeUserDeactivation(targetUid, adminId || auth.currentUser?.uid || 'system');
        
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
