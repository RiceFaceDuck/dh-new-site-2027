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
    onSnapshot 
} from 'firebase/firestore';

// 🌟 ตัวแปร Global ของ Firebase สภาพแวดล้อมปัจจุบัน (บังคับใช้ตามกฎ Rule 1)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 🛡️ อีเมลเจ้าของระบบ (Super Admin) ที่จะไม่ถูกจำกัดสิทธิ์ในทุกกรณี
const SUPER_ADMINS = ['dh1notebook@gmail.com', 'zhoulinjuan1@gmail.com'];
const VALID_STAFF_ROLES = ['admin', 'manager', 'staff', 'packer', 'pending', 'pending-staff'];

// 📍 Helper: สร้าง Path อ้างอิงถึงข้อมูลผู้ใช้ (ตามกฏระบบใหม่)
const getUsersCollectionRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'users');
const getUserDocRef = (uid) => doc(db, 'artifacts', appId, 'public', 'data', 'users', uid);


// ============================================================================
// 🟢 ส่วนที่ 1: ระบบ Auth และตรวจสอบสิทธิ์แบบ Real-time (ฟังก์ชันใหม่)
// ============================================================================

export const syncUserProfile = async (user) => {
    if (!user || !user.uid) return;
  
    const userRef = getUserDocRef(user.uid);
    // ปรับปรุง: ตรวจสอบแบบไม่สนตัวพิมพ์เล็กใหญ่
    const userEmail = (user.email || '').toLowerCase();
    const isOwner = SUPER_ADMINS.map(e => e.toLowerCase()).includes(userEmail);
  
    try {
      const docSnap = await getDoc(userRef);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'ผู้ใช้ใหม่',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      };
  
      if (isOwner) {
        userData.isStaff = true;
        userData.roles = docSnap.exists() && docSnap.data().roles 
          ? docSnap.data().roles 
          : ['Owner', 'Admin', 'Manager'];
        userData.role = 'owner';
        userData.isActive = true;
      } else if (!docSnap.exists()) {
        userData.isStaff = false;
        userData.roles = ['Customer'];
        userData.role = 'customer';
        userData.isActive = true;
      }
  
      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error("❌ Error syncing profile:", error);
    }
};

export const listenToUserRole = (user, callback, errorCallback) => {
    if (!user || !user.uid) {
      callback(null);
      return () => {}; 
    }
  
    // ปรับปรุง: ตรวจสอบแบบไม่สนตัวพิมพ์เล็กใหญ่
    const userEmail = (user.email || '').toLowerCase();
    const isOwner = SUPER_ADMINS.map(e => e.toLowerCase()).includes(userEmail);
    const userRef = getUserDocRef(user.uid);
  
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (isOwner) {
            data.isStaff = true;
            if (!data.roles) data.roles = ['Owner'];
            data.role = 'owner';
          }
          callback(data);
        } else {
          if (isOwner) {
            callback({ uid: user.uid, email: user.email, isStaff: true, roles: ['Owner'], role: 'owner' });
          } else {
            callback(null); 
          }
        }
      },
      (error) => {
        console.error("❌ Error real-time role listener:", error);
        if (errorCallback) errorCallback(error);
      }
    );
  
    return unsubscribe;
};


// ============================================================================
// 🔵 ส่วนที่ 2: ฟังก์ชันเดิมของระบบ (อัปเดต Path ให้ตรงกับโครงสร้างใหม่และคืนค่าที่หายไป)
// ============================================================================

export const getUserProfile = async (uid) => {
    if (!uid) return null;
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        
        // Fallback เผื่อกรณีข้อมูลยังอยู่ที่โครงสร้างเก่า
        const oldRef = doc(db, 'users', uid);
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists()) {
            return { id: oldSnap.id, ...oldSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const getUserById = async (uid) => {
    if (!uid) return null;
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        
        // Fallback เผื่อกรณีข้อมูลยังอยู่ที่โครงสร้างเก่า
        const oldRef = doc(db, 'users', uid);
        const oldSnap = await getDoc(oldRef);
        if (oldSnap.exists()) {
            return { id: oldSnap.id, ...oldSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user by id:", error);
        return null;
    }
};

export const getAllStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
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

// 📍 ฟังก์ชันนี้ถูกเพิ่มกลับเข้ามาเพื่อป้องกัน StaffManagement บั๊ก
export const updateUserProfile = async (uid, updateData) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, { 
            ...updateData,
            updatedAt: serverTimestamp() 
        });
        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const updateUserRole = async (uid, newRole) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, { 
            role: newRole,
            roles: [newRole.charAt(0).toUpperCase() + newRole.slice(1)],
            updatedAt: serverTimestamp() 
        });
        return true;
    } catch (error) {
        throw error;
    }
};

export const suspendUser = async (uid) => {
    try {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, {
            isActive: false, 
            suspendedAt: serverTimestamp(),
            suspendedUntil: oneYearFromNow.toISOString(), 
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw error;
    }
};

export const restoreUser = async (uid) => {
    try {
        const userRef = getUserDocRef(uid);
        await updateDoc(userRef, {
            isActive: true,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (uid) => {
    try {
        const userRef = getUserDocRef(uid);
        await deleteDoc(userRef); 
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const updateUserLoginStatus = async (uid, isOnline = true) => {
    if(!uid) return;
    try {
        const userRef = getUserDocRef(uid);
        await setDoc(userRef, { 
            lastLogin: serverTimestamp(),
            isOnline: isOnline
        }, { merge: true });
    } catch (error) {
        console.error("Error updating login status:", error);
    }
};

// ============================================================================
// 🟠 ส่วนสำคัญ: คืนค่า Object Export (รวบรวมฟังก์ชันทุกตัวเพื่อกัน Error หน้าอื่นๆ)
// ============================================================================
export const userService = {
    syncUserProfile,
    listenToUserRole,
    getUserProfile,
    getUserById,
    updateUserProfile, // ✅ เพิ่มฟังก์ชันเข้าสู่ออบเจ็กต์นี้
    getAllStaff,
    updateUserRole,
    suspendUser,
    restoreUser,
    deleteUser,
    updateUserLoginStatus
};