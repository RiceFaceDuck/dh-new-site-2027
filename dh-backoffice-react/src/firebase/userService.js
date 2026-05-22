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
    writeBatch // ✅ เพิ่ม writeBatch
} from 'firebase/firestore';

// 📍 Helper: Path อ้างอิงถึงข้อมูลผู้ใช้ (รองรับทั้ง Local และ Production)
const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUsersCollectionRef = () => collection(db, getCollectionPath('users'));
const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

// 🛡️ รายชื่ออีเมลเจ้าของระบบ (Super Admin) ที่จะไม่ถูกจำกัดสิทธิ์ในทุกกรณี
const SUPER_ADMINS = [
    'dh1notebook@gmail.com', 
    'dh2notebook@gmail.com', // ✅ เพิ่ม dh2notebook อย่างเป็นทางการ
    'zhoulinjuan1@gmail.com'
];

const VALID_STAFF_ROLES = ['admin', 'manager', 'staff', 'packer', 'pending', 'pending-staff', 'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'];

// ============================================================================
// 🟢 ส่วนที่ 1: ระบบ Auth และตรวจสอบสิทธิ์ (Gatekeeper Logic)
// ============================================================================

export const syncUserProfile = async (user) => {
    if (!user || !user.uid) return;
  
    const userRef = getUserDocRef(user.uid);
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
        // หากเป็นเจ้าของ ยัดยศสูงสุดให้ทันที
        userData.isStaff = true;
        userData.roles = docSnap.exists() && docSnap.data().roles 
          ? docSnap.data().roles 
          : ['Owner', 'Admin', 'Manager'];
        userData.role = 'owner';
        userData.isActive = true;
      } else if (!docSnap.exists()) {
        // ✅ หากเป็นคนสมัครใหม่ กำหนดสถานะเป็น Pending รอผู้จัดการอนุมัติ
        userData.isStaff = false;
        userData.roles = ['Pending'];
        userData.role = 'pending';
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
            data.roles = ['Owner'];
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
// 🔵 ส่วนที่ 2: ฟังก์ชันจัดการพนักงาน (Staff Management Data)
// ============================================================================

export const getUserProfile = async (uid) => {
    if (!uid) return null;
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const getUserById = async (uid) => {
    return await getUserProfile(uid);
};

export const getAllStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        const snapshot = await getDocs(usersRef);
        
        return snapshot.docs
            .map(doc => {
                const data = doc.data();
                let rawRole = data.role || (data.roles && data.roles[0]) || data.userType || data.type || '';
                let cleanRole = String(rawRole).toLowerCase().trim();

                return { 
                    id: doc.id, 
                    isActive: data.isActive !== false,
                    computedRole: cleanRole,
                    ...data 
                };
            })
            .filter(user => {
                // ตัดลูกค้า (customer) ออกจากการแสดงผลตารางพนักงาน
                if (!user.computedRole) return false;
                if (user.computedRole === 'customer' || user.computedRole === 'user') return false;
                return true;
            });
    } catch (error) {
        console.error("Error fetching staff:", error);
        throw error;
    }
};

// ✅ ฟังก์ชันใหม่: ดึงรายชื่อพนักงานที่รออนุมัติ (ใช้ในหน้า Manager Overview)
export const getPendingStaff = async () => {
    try {
        const usersRef = getUsersCollectionRef();
        const snapshot = await getDocs(usersRef);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => {
                const role = String(user.role || (user.roles && user.roles[0]) || '').toLowerCase().trim();
                return role === 'pending' || role === 'pending-staff';
            });
    } catch (error) {
        console.error("Error fetching pending staff:", error);
        return [];
    }
};

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
            isStaff: true, // บังคับเปิดสิทธิ์
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
// 🌟 ส่วนที่ 3: ระบบ Ecosystem & การเงิน (เพิ่มใหม่สำหรับแผนพัฒนา Account)
// ============================================================================

export const updateUserEcosystem = async (uid, data) => {
    if (!uid) throw new Error("User ID is required");
    try {
        const userRef = getUserDocRef(uid);
        
        // อัปเดตเฉพาะฟิลด์ที่ส่งมา ป้องกันการทับข้อมูลอื่น
        const updatePayload = { updatedAt: serverTimestamp() };
        if (data.accountId) updatePayload.accountId = data.accountId;
        if (data.mapUrl !== undefined) updatePayload.ecosystem = { mapUrl: data.mapUrl };
        if (data.role) updatePayload.role = data.role;

        await updateDoc(userRef, updatePayload);
        console.log(`✅ [Backoffice] User ${uid} ecosystem updated.`);
        return true;
    } catch (error) {
        console.error("❌ [Backoffice] Error updating ecosystem:", error);
        throw error;
    }
};

export const adminAdjustFinancials = async (uid, adminId, adjustments) => {
    if (!uid || !adminId) throw new Error("User ID and Admin ID are required");
    if (!adjustments.reason) throw new Error("ต้องระบุเหตุผลในการปรับปรุงยอดเสมอ (Audit Trail)");

    const batch = writeBatch(db);
    const userRef = getUserDocRef(uid);
    
    // สร้าง Reference โดยใช้ getCollectionPath ตามมาตรฐานระบบเดิม
    const historyRef = doc(collection(db, getCollectionPath('users'), uid, 'credit_history'));
    const adminAuditRef = doc(collection(db, getCollectionPath('admin_audit_logs')));

    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");

        const userData = userSnap.data();
        const currentCredit = userData.creditPoint || userData.points || 0;
        const currentWallet = userData.walletBalance || 0;

        let newCredit = currentCredit;
        let newWallet = currentWallet;
        let updatePayload = { updatedAt: serverTimestamp() };

        // 1. ตรรกะการปรับแต้ม (Credit Point)
        if (adjustments.creditAmount !== undefined && adjustments.creditAmount !== 0) {
            newCredit = Math.max(0, currentCredit + adjustments.creditAmount);
            updatePayload.creditPoint = newCredit;
            updatePayload.points = newCredit; // อัปเดตทั้งฟิลด์เก่าและใหม่
            
            // บันทึกประวัติให้ลูกค้าเห็น
            batch.set(historyRef, {
                transactionId: `ADJ-CR-${Date.now()}`,
                uid: uid,
                type: adjustments.creditAmount > 0 ? 'earn' : 'spend', // เขียวหรือแดง
                amount: Math.abs(adjustments.creditAmount),
                balanceAfter: newCredit,
                note: `แอดมินปรับปรุงยอด: ${adjustments.reason}`,
                recordedBy: adminId,
                timestamp: serverTimestamp()
            });
        }

        // 2. ตรรกะการปรับยอดเงินสด (Wallet Balance)
        if (adjustments.walletAmount !== undefined && adjustments.walletAmount !== 0) {
            newWallet = Math.max(0, currentWallet + adjustments.walletAmount);
            updatePayload.walletBalance = newWallet;

            // ถ้ามีบัญชี Wallet ย่อยให้ไปอัปเดตด้วย
            const walletRef = doc(db, getCollectionPath('users'), uid, 'wallet', 'default');
            batch.set(walletRef, {
                balance: newWallet,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        // อัปเดต Profile หลัก
        batch.update(userRef, updatePayload);

        // 3. บันทึกหลักฐานตรวจสอบแอดมิน (Audit Trail)
        batch.set(adminAuditRef, {
            action: 'FINANCIAL_ADJUSTMENT',
            targetUid: uid,
            performedBy: adminId,
            reason: adjustments.reason,
            changes: {
                credit: { from: currentCredit, to: newCredit, diff: adjustments.creditAmount || 0 },
                wallet: { from: currentWallet, to: newWallet, diff: adjustments.walletAmount || 0 }
            },
            timestamp: serverTimestamp()
        });

        await batch.commit();
        console.log(`✅ [Backoffice] Financials adjusted securely for user ${uid}`);
        return { success: true, newCredit, newWallet };

    } catch (error) {
        console.error("❌ [Backoffice] Financial adjustment failed:", error);
        throw error;
    }
};

// ============================================================================
// 🟠 Object Export: รวมฟังก์ชันทั้งหมดไว้ที่ userService เผื่อการเรียกใช้แบบออบเจกต์
// ============================================================================
export const userService = {
    syncUserProfile,
    listenToUserRole,
    getUserProfile,
    getUserById,
    getAllStaff,
    getPendingStaff, // ✅ ส่งออกให้ ManagersOverview ใช้งาน
    updateUserProfile,
    updateUserRole,
    suspendUser,
    restoreUser,
    deleteUser,
    updateUserLoginStatus,
    updateUserEcosystem,   // ✅ NEW: รองรับระบบ Partner Map / Account ID
    adminAdjustFinancials  // ✅ NEW: รองรับระบบกระเป๋าเงิน (Double Entry)
};