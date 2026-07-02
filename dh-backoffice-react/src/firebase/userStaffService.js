import { db } from './config';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUsersCollectionRef = () => collection(db, getCollectionPath('users'));
const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const VALID_STAFF_ROLES = [
    'admin', 'manager', 'staff', 'packer', 
    'pending', 'pending_approval', 'pending-staff', 
    'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'
];

export const getAllStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        
        // 🚀 OPTIMIZATION: Query specifically by role and isStaff flag to prevent Quota Leak (O(1) instead of O(N))
        // We do two simple queries and merge to avoid complex composite index requirements.
        
        // 1. Get by VALID_STAFF_ROLES
        // Firestore limits 'in' queries to 10 items.
        // VALID_STAFF_ROLES has 11 items. We need to chunk it.
        const chunk1 = VALID_STAFF_ROLES.slice(0, 10);
        const chunk2 = VALID_STAFF_ROLES.slice(10);
        
        const q1 = query(usersRef, where('role', 'in', chunk1));
        const q2 = chunk2.length > 0 ? query(usersRef, where('role', 'in', chunk2)) : null;
        
        // 2. Get by isStaff == true
        const q3 = query(usersRef, where('isStaff', '==', true));
        
        const promises = [getDocs(q1), getDocs(q3)];
        if (q2) promises.push(getDocs(q2));
        
        const snaps = await Promise.all(promises);
        
        const allStaffMap = new Map();
        
        snaps.forEach(snap => {
            snap.docs.forEach(doc => {
                if (!allStaffMap.has(doc.id)) {
                    allStaffMap.set(doc.id, { id: doc.id, ...doc.data() });
                }
            });
        });
        
        const allUsers = Array.from(allStaffMap.values());
        
        // Final filtering in memory for simple conditions
        return allUsers.filter(u => 
            u.status !== 'deleted' &&
            u.isActive !== false
        );
    } catch (error) {
        console.error("❌ [UserStaffService] Get All Staff Error:", error);
        throw error;
    }
};

export const getPendingStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        
        // 🚀 OPTIMIZATION: Query specifically by role
        const q = query(usersRef, where('role', 'in', ['pending_approval', 'pending']));
        const snap = await getDocs(q);
        const pendingUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return pendingUsers.filter(u => u.status !== 'deleted');
    } catch (error) {
        console.error("❌ [UserStaffService] Get Pending Staff Error:", error);
        throw error;
    }
};

export const registerPendingStaff = async (uid, email, staffData) => {
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);

        const newStaffPayload = {
            uid: uid,
            email: email,
            firstName: staffData.firstName || '',
            lastName: staffData.lastName || '',
            nickname: staffData.nickname || '',
            age: Number(staffData.age) || null,
            displayName: `${staffData.firstName} ${staffData.lastName}`.trim() || email.split('@')[0],
            gender: staffData.gender || 'unspecified',
            startDate: staffData.startDate || null,
            requestedRole: staffData.position || 'staff',
            role: 'pending_approval', 
            status: 'active', 
            // 🐛 FIX: Ensure pending staff are hidden from normal active filters if needed, 
            // but we explicitly define isStaff and isActive flags for clarity
            isActive: false, 
            isStaff: false,
            metadata: {
                createdAt: snap.exists() ? snap.data().metadata?.createdAt : serverTimestamp(),
                updatedAt: serverTimestamp(),
                registeredVia: 'staff_onboarding_portal'
            }
        };

        await setDoc(userRef, newStaffPayload, { merge: true });
        console.log(`✅ [UserStaffService] Staff Onboarding Submitted for: ${email}`);
        
        return { success: true, message: 'Registration submitted successfully' };
    } catch (error) {
        console.error("❌ [UserStaffService] Register Pending Staff Error:", error);
        throw error;
    }
};

export const updateStaffDetails = async (adminId, targetUid, updates) => {
    try {
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, {
            ...updates,
            'metadata.updatedAt': serverTimestamp(),
            'metadata.updatedBy': adminId
        });
        console.log(`✅ [UserStaffService] Staff details updated for UID: ${targetUid}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserStaffService] Update Staff Details Error:", error);
        throw error;
    }
};
