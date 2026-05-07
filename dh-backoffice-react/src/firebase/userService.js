import { db } from './config';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    serverTimestamp,
    setDoc,
    deleteDoc // นำเข้าฟังก์ชันลบถาวร
} from 'firebase/firestore';

const USERS_COL = 'users';
const VALID_STAFF_ROLES = ['admin', 'manager', 'staff', 'packer', 'pending', 'pending-staff'];

export const getAllStaff = async () => {
    try {
        const usersRef = collection(db, USERS_COL);
        const snapshot = await getDocs(usersRef);
        
        return snapshot.docs
            .map(doc => {
                const data = doc.data();
                let rawRole = data.role || data.userType || data.type || '';
                let cleanRole = String(rawRole).toLowerCase().trim();

                return { 
                    id: doc.id, 
                    isActive: data.isActive !== false,
                    computedRole: cleanRole,
                    ...data 
                };
            })
            .filter(user => {
                if (!user.computedRole) return false;
                if (user.computedRole === 'customer' || user.computedRole === 'user') return false;
                if (VALID_STAFF_ROLES.includes(user.computedRole)) return true;
                return true;
            });
    } catch (error) {
        console.error("Error fetching staff:", error);
        throw error;
    }
};

export const getAllCustomers = async () => {
    try {
        const usersRef = collection(db, USERS_COL);
        const snapshot = await getDocs(usersRef);
        
        return snapshot.docs
            .map(doc => {
                const data = doc.data();
                let cleanRole = String(data.role || data.userType || data.type || '').toLowerCase().trim();
                return { id: doc.id, computedRole: cleanRole, ...data };
            })
            .filter(user => {
                if (!user.computedRole || user.computedRole === 'customer' || user.computedRole === 'user') return true;
                if (VALID_STAFF_ROLES.includes(user.computedRole)) return false;
                return false; 
            });
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

export const getUserById = async (uid) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        throw error;
    }
};

export const getUserProfile = async (uid) => { return await getUserById(uid); };

export const updateUserProfile = async (uid, profileData) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        await updateDoc(userRef, { ...profileData, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        throw error;
    }
};

export const updateUserRole = async (uid, newRole) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        await updateDoc(userRef, {
            role: newRole,
            userType: newRole, // อัปเดตทั้งคู่เผื่อระบบเก่า
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw error;
    }
};

export const suspendUser = async (uid) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        await updateDoc(userRef, {
            isActive: false, 
            suspendedAt: serverTimestamp(),
            suspendedUntil: oneYearFromNow.toISOString(), // มีอายุ 1 ปี
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw error;
    }
};

export const restoreUser = async (uid) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        await updateDoc(userRef, {
            isActive: true,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw error;
    }
};

// ลบออกแบบถาวรจาก Firebase เลย
export const deleteUser = async (uid) => {
    try {
        const userRef = doc(db, USERS_COL, uid);
        await deleteDoc(userRef); // ลบทิ้งจาก DB ถาวร
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const updateUserLoginStatus = async (uid, isOnline = true) => {
    if(!uid) return;
    try {
        const userRef = doc(db, USERS_COL, uid);
        await setDoc(userRef, { 
            lastLogin: serverTimestamp(),
            isOnline: isOnline
        }, { merge: true });
    } catch (error) {}
};

export const userService = {
    getAllStaff,
    getAllCustomers,
    getUserById,
    getUserProfile,
    updateUserProfile,
    updateUserRole,
    suspendUser,
    restoreUser,
    updateUserLoginStatus,
    deleteUser
};