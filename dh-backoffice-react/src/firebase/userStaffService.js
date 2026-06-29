import { db } from './config';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
        const snap = await getDocs(usersRef);
        const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return allUsers.filter(u => 
            (VALID_STAFF_ROLES.includes(u.role) || u.isStaff === true) &&
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
        const snap = await getDocs(usersRef);
        const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return allUsers.filter(u => 
            (u.role === 'pending_approval' || u.role === 'pending') &&
            u.status !== 'deleted'
        );
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
