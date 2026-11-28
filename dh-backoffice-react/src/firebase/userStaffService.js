import app, { db } from './config';
import { limit, collection, doc, getDocs, getDoc, updateDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const syncStaffCustomClaims = (targetUid) => {
    if (!targetUid || typeof window === 'undefined') return;
    try {
        const fn = httpsCallable(getFunctions(app, 'asia-southeast1'), 'syncUserClaims');
        fn({ targetUid }).catch((err) => {
            console.warn('[UserStaffService] Non-blocking syncUserClaims warning:', err?.message || err);
        });
    } catch (_) {}
};



const getUsersCollectionRef = () => collection(db, getCollectionPath('users'));
const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const VALID_STAFF_ROLES = [
    'admin', 'manager', 'staff', 'packer', 'developer', 'finance', 
    'pending', 'pending_approval', 'pending-staff', 'owner',
    'ผู้จัดการ', 'เจ้าของ', 'admin ฝ่ายขาย', 'จัดแพ็ค', 'การบัญชี', 'อื่นๆ'
];

export const getAllStaff = async (includeInactive = false) => {
    try {
        const usersRef = getUsersCollectionRef();
        
        // 🚀 OPTIMIZATION: Query specifically by role and isStaff flag to prevent Quota Leak (O(1) instead of O(N))
        // Chunk 1 & 2 for VALID_STAFF_ROLES (Firestore limits 'in' queries to 10 items)
        const chunk1 = VALID_STAFF_ROLES.slice(0, 10);
        const chunk2 = VALID_STAFF_ROLES.slice(10);
        
        const q1 = query(usersRef, where('role', 'in', chunk1), limit(300));
        const q2 = chunk2.length > 0 ? query(usersRef, where('role', 'in', chunk2), limit(300)) : null;
        
        // Query by isStaff == true and isApproved == false
        const q3 = query(usersRef, where('isStaff', '==', true), limit(300));
        const q4 = query(usersRef, where('isApproved', '==', false), limit(300));
        
        const promises = [getDocs(q1), getDocs(q3), getDocs(q4)];
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
        
        const allUsers = Array.from(allStaffMap.values()).map(u => {
            const isNotApproved = u.isApproved === false || (u.isApproved === undefined && u.isStaff !== true && u.role === 'pending_approval');
            if (isNotApproved && u.role !== 'pending_approval') {
                u.requestedRole = u.role;
                u.role = 'pending_approval';
            }
            return u;
        });
        
        // Final filtering in memory for simple conditions
        return allUsers.filter(u => {
            if (u.status === 'deleted') return false;
            if (!includeInactive && u.isActive === false && u.role !== 'pending_approval') return false;
            return true;
        });
    } catch (error) {
        console.error("❌ [UserStaffService] Get All Staff Error:", error);
        throw error;
    }
};

export const getPendingStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        
        // 🚀 OPTIMIZATION: Query specifically by role & approval status
        const q1 = query(usersRef, where('role', 'in', ['pending_approval', 'pending', 'pending-staff']), limit(300));
        const q2 = query(usersRef, where('isApproved', '==', false), limit(300));
        const [snapRole, snapApproval] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const pendingMap = new Map();
        snapRole.docs.forEach(doc => {
            if (doc.data().status !== 'deleted') {
                pendingMap.set(doc.id, { id: doc.id, ...doc.data() });
            }
        });
        snapApproval.docs.forEach(doc => {
            if (doc.data().status !== 'deleted') {
                pendingMap.set(doc.id, { id: doc.id, ...doc.data() });
            }
        });
        
        return Array.from(pendingMap.values());
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
            isApproved: false,
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
        if (updates && (updates.role !== undefined || updates.isStaff !== undefined || updates.isApproved !== undefined)) {
            syncStaffCustomClaims(targetUid);
        }
        console.log(`✅ [UserStaffService] Staff details updated for UID: ${targetUid}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserStaffService] Update Staff Details Error:", error);
        throw error;
    }
};

export const searchUsersForStaffPromotion = async (keyword) => {
    try {
        const usersRef = getUsersCollectionRef();
        const searchWord = keyword.toLowerCase().trim();
        
        // Optimize: Use Firestore native queries with prefix matching to prevent fetching entire users collection
        const prefixEnd = searchWord + '\uf8ff';
        
        const [emailSnap, phoneSnap, nameSnap] = await Promise.all([
            getDocs(query(usersRef, where('email', '>=', searchWord), where('email', '<=', prefixEnd), limit(20))),
            getDocs(query(usersRef, where('phone', '>=', searchWord), where('phone', '<=', prefixEnd), limit(20))),
            getDocs(query(usersRef, where('displayName', '>=', searchWord), where('displayName', '<=', prefixEnd), limit(20)))
        ]);

        const resultsMap = new Map();
        
        const processDoc = (doc) => {
            const data = doc.data();
            const currentRole = String(data.role || (data.roles && data.roles[0]) || '').toLowerCase();
            // Filter out existing staff/admins
            if (!['admin', 'manager', 'staff', 'packer', 'developer'].includes(currentRole)) {
                resultsMap.set(doc.id, { id: doc.id, ...data });
            }
        };

        emailSnap.forEach(processDoc);
        phoneSnap.forEach(processDoc);
        nameSnap.forEach(processDoc);

        return Array.from(resultsMap.values());
    } catch (error) {
        console.error("❌ [UserStaffService] Search Users Error:", error);
        throw error;
    }
};

export const promoteUserToStaff = async (adminId, targetUid, newRole) => {
    try {
        // Also call the main userManagementService to track history, but here we update the document directly first
        const userRef = getUserDocRef(targetUid);
        await updateDoc(userRef, { 
            isStaff: true, 
            isActive: true, 
            role: newRole,
            roles: [newRole.charAt(0).toUpperCase() + newRole.slice(1)],
            'metadata.roleUpdatedAt': serverTimestamp(),
            'metadata.roleUpdatedBy': adminId
        });
        syncStaffCustomClaims(targetUid);
        console.log(`✅ [UserStaffService] Promoted UID ${targetUid} to ${newRole}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserStaffService] Promote User Error:", error);
        throw error;
    }
};

export const userStaffService = {
  getAllStaff,
  getPendingStaff,
  registerPendingStaff,
  updateStaffDetails,
  searchUsersForStaffPromotion,
  promoteUserToStaff
};
