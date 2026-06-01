import { db } from './config';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    serverTimestamp,
    setDoc,
    deleteDoc,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';

// ============================================================================
// 📍 Helper Paths
// ============================================================================
const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUsersCollectionRef = () => collection(db, getCollectionPath('users'));
const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

// 🛡️ Super Admins & Valid Roles (อัปเกรดแผนงาน #2)
// ส่งออกให้ AdminLayout ใช้เพื่อ Bypass Gatekeeper ทันที
export const SUPER_ADMINS = [
    'zhoulinjuan1@gmail.com', // 👑 Owner (เจ้าของ - มีสิทธิ์สูงสุด)
    'dh1notebook@gmail.com'   // 💼 VP 1 (รองประธาน 1 - มีอำนาจจัดการทุกอย่าง)
];

const VALID_STAFF_ROLES = [
    'admin', 'manager', 'staff', 'packer', 
    'pending', 'pending_approval', 'pending-staff', 
    'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'
];

// ============================================================================
// 👤 Core Profile Sync & Listening
// ============================================================================

export const syncUserProfile = async (user) => {
    if (!user) return null;
    
    try {
        const userRef = getUserDocRef(user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // สร้าง Profile พื้นฐานหากเพิ่ง Login ครั้งแรกโดยไม่ได้ผ่านฟอร์มพนักงาน
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || null,
                role: 'user', // Default role
                status: 'active',
                financials: { credit: 0, wallet: 0 },
                metadata: {
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    source: 'auto_sync'
                }
            };
            await setDoc(userRef, newUserData);
            console.log(`✅ [UserService] Created new profile for: ${user.email}`);
            return newUserData;
        } else {
            // อัปเดตเวลาเข้าสู่ระบบ
            const currentData = userSnap.data();
            await updateDoc(userRef, {
                'metadata.lastLogin': serverTimestamp()
            });
            return currentData;
        }
    } catch (error) {
        console.error("❌ [UserService] Sync Profile Error:", error);
        throw error;
    }
};

export const listenToUserRole = (uid, callback) => {
    if (!uid) {
        callback('user', null, new Error('No UID provided'));
        return () => {};
    }
    
    const userRef = getUserDocRef(uid);
    
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 🌟 Legacy Check: คืนชีพพนักงานเก่าที่มีแค่ isStaff: true
            let currentRole = data.role || 'user';
            if (data.isStaff === true && (currentRole === 'user' || !data.role)) {
                currentRole = 'staff'; // ผลักดันให้เข้าถึงระบบได้ทันที
            }
            
            // ส่งค่ากลับไปหา AdminLayout (role, data, error)
            callback(currentRole, data, null);
        } else {
            callback('user', null, null);
        }
    }, (error) => {
        console.error("❌ [UserService] Listen Role Error:", error);
        // 🚨 ส่ง Error กลับไปที่ UI เพื่อปิด Loading ป้องกันหน้าจอค้างตลอดกาล
        callback('user', null, error); 
    });
};

// ============================================================================
// 🚀 NEW: Staff Onboarding System (ระบบลงทะเบียนพนักงานใหม่)
// ============================================================================

export const registerPendingStaff = async (uid, email, staffData) => {
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);

        const newStaffPayload = {
            uid: uid,
            email: email,
            displayName: staffData.name || email.split('@')[0],
            gender: staffData.gender || 'unspecified',
            startDate: staffData.startDate || null,
            requestedRole: staffData.position || 'staff',
            role: 'pending_approval', // 🔒 ล็อกสถานะไว้รอการอนุมัติ
            status: 'active', 
            metadata: {
                createdAt: snap.exists() ? snap.data().metadata?.createdAt : serverTimestamp(),
                updatedAt: serverTimestamp(),
                registeredVia: 'staff_onboarding_portal'
            }
        };

        // ใช้ setDoc แบบ merge เพื่ออัปเดตข้อมูลหรือสร้างใหม่ได้อย่างปลอดภัย
        await setDoc(userRef, newStaffPayload, { merge: true });
        console.log(`✅ [UserService] Staff Onboarding Submitted for: ${email}`);
        
        return { success: true, message: 'Registration submitted successfully' };
    } catch (error) {
        console.error("❌ [UserService] Register Pending Staff Error:", error);
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
        console.log(`✅ [UserService] Staff details updated for UID: ${targetUid}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserService] Update Staff Details Error:", error);
        throw error;
    }
};

// ============================================================================
// 🔍 User Data Retrievals
// ============================================================================

export const getUserProfile = async (uid) => {
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            
            // 🌟 Legacy Support: จัดการ Role พนักงานเก่าตอนดึง Profile ปกติ
            if (data.isStaff === true && (!data.role || data.role === 'user')) {
                data.role = 'staff';
            }
            return { id: snap.id, ...data };
        }
        return null;
    } catch (error) {
        console.error("❌ [UserService] Get User Profile Error:", error);
        throw error;
    }
};

export const getUserById = getUserProfile; // Alias

export const getAllStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        const snap = await getDocs(usersRef);
        const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter in memory เพื่อหลีกเลี่ยง Index Requirement ที่ซับซ้อน
        return allUsers.filter(u => VALID_STAFF_ROLES.includes(u.role) || u.isStaff === true);
    } catch (error) {
        console.error("❌ [UserService] Get All Staff Error:", error);
        throw error;
    }
};

export const getPendingStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        const snap = await getDocs(usersRef);
        const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return allUsers.filter(u => u.role === 'pending_approval' || u.role === 'pending');
    } catch (error) {
        console.error("❌ [UserService] Get Pending Staff Error:", error);
        throw error;
    }
};

// ============================================================================
// ⚙️ Management & Administrative Actions
// ============================================================================

export const updateUserProfile = async (uid, data) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, {
            ...data,
            'metadata.updatedAt': serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("❌ [UserService] Update Profile Error:", error);
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
        console.log(`✅ [UserService] Role updated to ${newRole} for UID: ${targetUid}`);
        return { success: true };
    } catch (error) {
        console.error("❌ [UserService] Update Role Error:", error);
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
        console.error("❌ [UserService] Update Ecosystem Error:", error);
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

        // เนื่องจาก creditService.adjustUserCredit ส่งผลทั้ง wallet และ credit รวมกัน
        // ในกรณีนี้ควรใช้วิธีอัปเดตแยกกัน (แต่แบบปลอดภัย) เพื่อรักษายอดแยกกัน (ในกรณีที่ระบบมี 2 กระเป๋า)
        const data = userSnap.data();
        let newCredit = Number(data.creditPoints || data.creditPoint || 0) + creditAmount;
        let newWallet = Number(data.walletBalance || 0) + walletAmount;
        
        batch.update(userRef, {
            creditPoints: newCredit,
            creditPoint: newCredit,
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
        console.log(`✅ [UserService] Financials adjusted securely using batch for user ${uid}`);
        return { success: true, newCredit, newWallet };

    } catch (error) {
        console.error("❌ [UserService] Financial adjustment failed:", error);
        throw error;
    }
};

// ============================================================================
// 🟠 Object Export
// ============================================================================
export const userService = {
    syncUserProfile,
    listenToUserRole,
    getUserProfile,
    getUserById,
    getAllStaff,
    getPendingStaff,
    updateUserProfile,
    updateUserRole,
    suspendUser,
    restoreUser,
    deleteUser,
    updateUserLoginStatus,
    updateUserEcosystem,
    adminAdjustFinancials,
    registerPendingStaff, 
    updateStaffDetails    
};