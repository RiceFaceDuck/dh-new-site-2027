import { db } from './config';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 🧠 Smart Memory Cache (ประหยัดค่าใช้จ่าย Firebase Reads)
// ==========================================
let userProfileCache = {};
let taxInfoCache = {}; // 🛡️ แคชแยกสำหรับข้อมูลลับ (Tax/ID Card)
let lastFetchTime = {};
let lastTaxFetchTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // แคชข้อมูลไว้ 5 นาที

/**
 * ล้างข้อมูลแคช (เรียกใช้ตอน Logout)
 */
export const clearUserCache = (uid = null) => {
  if (uid) {
    delete userProfileCache[uid];
    delete taxInfoCache[uid];
    delete lastFetchTime[uid];
    delete lastTaxFetchTime[uid];
  } else {
    userProfileCache = {};
    taxInfoCache = {};
    lastFetchTime = {};
    lastTaxFetchTime = {};
  }
};

export const userService = {
  // ==========================================
  // 1. ดึงข้อมูล Profile (พร้อมระบบ แคชอัจฉริยะ)
  // ==========================================
  getUserProfile: async (uid, forceRefresh = false) => {
    if (!uid) return null;

    const now = Date.now();
    
    // ตรวจสอบ Cache ก่อน หากยังไม่หมดอายุและไม่ได้บังคับรีเฟรช ให้ใช้ของเดิม (Zero Read Cost)
    if (!forceRefresh && userProfileCache[uid] && (now - lastFetchTime[uid] < CACHE_DURATION)) {
      console.log('⚡ [userService] Returning cached profile for:', uid);
      return userProfileCache[uid];
    }

    try {
      console.log('☁️ [userService] Fetching profile from Firestore for:', uid);
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // บันทึกลง Cache
        userProfileCache[uid] = data;
        lastFetchTime[uid] = now;
        return data;
      }
      return null;
    } catch (error) {
      console.error('❌ [userService] Error fetching user profile:', error);
      throw error;
    }
  },

  // ==========================================
  // 2. อัปเดตข้อมูล Profile (ฉลาดขึ้น - รองรับ Nested Object เช่น address)
  // ==========================================
  updateUserProfile: async (uid, data) => {
    if (!uid) throw new Error('User ID is required');
    
    try {
      const userRef = doc(db, 'users', uid);
      
      // ดึงข้อมูลเดิมมาเทียบ (ประหยัด Write ถ้าไม่มีอะไรเปลี่ยน)
      const currentProfile = userProfileCache[uid] || (await getDoc(userRef)).data() || {};
      let hasChanges = false;
      const updatePayload = {};

      for (const key in data) {
        // 🚀 [NEW FEATURE] Deep Compare สำหรับ Object เช่น address: { addressLine, subDistrict... }
        if (typeof data[key] === 'object' && data[key] !== null) {
          if (JSON.stringify(currentProfile[key]) !== JSON.stringify(data[key])) {
            updatePayload[key] = data[key];
            hasChanges = true;
          }
        } 
        // เปรียบเทียบค่าทั่วไป (String, Number, Boolean)
        else if (currentProfile[key] !== data[key]) {
          updatePayload[key] = data[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updatePayload.updatedAt = serverTimestamp(); // 🕒 แทรกลายเซ็นเวลาอัตโนมัติ
        await setDoc(userRef, updatePayload, { merge: true });
        
        // อัปเดต Cache ทันทีโดยไม่ต้องดึงใหม่
        userProfileCache[uid] = { ...currentProfile, ...updatePayload };
        lastFetchTime[uid] = Date.now();
        
        console.log('✅ [userService] Profile updated successfully');
        return true;
      } else {
        console.log('⏭️ [userService] No changes detected, skipped Firestore write.');
        return false;
      }
    } catch (error) {
      console.error('❌ [userService] Error updating profile:', error);
      throw error;
    }
  },

  // ==========================================
  // 3. จัดการ Ecosystem (เชื่อมลิงก์ Google Maps)
  // ==========================================
  updateEcosystem: async (uid, ecosystemData) => {
    if (!uid) throw new Error('User ID is required');
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ecosystem: ecosystemData, updatedAt: serverTimestamp() }, { merge: true });
      
      if (userProfileCache[uid]) {
        userProfileCache[uid].ecosystem = { 
          ...userProfileCache[uid].ecosystem, 
          ...ecosystemData 
        };
      }
      return true;
    } catch (error) {
      console.error('❌ [userService] Error updating ecosystem:', error);
      throw error;
    }
  },

  // ==========================================
  // 4. ติดตามสถานะ Profile แบบสดๆ (Real-time Wallet & Credit)
  // ==========================================
  subscribeToProfile: (uid, callback) => {
    if (!uid) return () => {};
    
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // อัปเดต Cache เงียบๆ ทุกครั้งที่มีการเปลี่ยนแปลงจาก Server
        userProfileCache[uid] = data;
        lastFetchTime[uid] = Date.now();
        
        callback(data);
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  },

  // ==========================================
  // 5. 🛡️ [NEW] ดึงข้อมูลความลับ (Tax/ID Card)
  // ==========================================
  getPrivateTaxInfo: async (uid, forceRefresh = false) => {
    if (!uid) return null;

    const now = Date.now();
    
    // ตรวจสอบ Cache ลับ
    if (!forceRefresh && taxInfoCache[uid] && (now - lastTaxFetchTime[uid] < CACHE_DURATION)) {
      console.log('⚡ [userService] Returning cached Private Tax Info for:', uid);
      return taxInfoCache[uid];
    }

    try {
      console.log('☁️ [userService] Fetching Private Tax Info from Firestore for:', uid);
      // 🔥 ดึงจาก Sub-collection ลับที่จำกัดสิทธิ์ด้วย Security Rules
      const taxRef = doc(db, 'users', uid, 'private', 'taxInfo');
      const docSnap = await getDoc(taxRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        taxInfoCache[uid] = data;
        lastTaxFetchTime[uid] = now;
        return data;
      }
      return null;
    } catch (error) {
      // ไม่โยน Error เพื่อไม่ให้ UI แคช แต่ให้ Log ไว้แทน (กรณี User อาจจะยังไม่เคยตั้งค่า)
      console.warn('ℹ️ [userService] No Private Tax Info found or permission denied:', error.message);
      return null;
    }
  },

  // ==========================================
  // 6. 🛡️ [NEW] บันทึกข้อมูลความลับ (Tax/ID Card)
  // ==========================================
  updatePrivateTaxInfo: async (uid, taxData) => {
    if (!uid) throw new Error('User ID is required');
    
    try {
      // 🔥 บันทึกลง Sub-collection ลับ
      const taxRef = doc(db, 'users', uid, 'private', 'taxInfo');
      const payload = {
        ...taxData,
        updatedAt: serverTimestamp() // ฝังเวลาเสมอ
      };

      await setDoc(taxRef, payload, { merge: true });
      
      // อัปเดต Cache ลับทันที
      taxInfoCache[uid] = { ...(taxInfoCache[uid] || {}), ...taxData };
      lastTaxFetchTime[uid] = Date.now();
      
      console.log('✅ [userService] Private Tax Info secured successfully');
      return true;
    } catch (error) {
      console.error('❌ [userService] Error securing Private Tax Info:', error);
      throw error;
    }
  },

  // ==========================================
  // 7. 🗑️ [NEW] ลบบัญชีผู้ใช้ (Hard Delete - PDPA)
  // ==========================================
  deleteAccount: async (user, walletBalance) => {
    if (!user) throw new Error('User object is required');
    
    // ตรวจสอบเงินค้างในกระเป๋า (Orphan Data Prevention)
    if (walletBalance > 0) {
      throw new Error("ไม่อนุญาตให้ลบบัญชีที่มีเงินค้างอยู่ในระบบ กรุณาถอนเงินก่อนดำเนินการ");
    }

    try {
      const uid = user.uid;
      
      // 1. ลบเอกสารจาก Firestore (Hard Delete)
      const userRef = doc(db, 'users', uid);
      await setDoc(doc(db, 'users_deleted_log', uid), {
         deletedAt: serverTimestamp(),
         reason: "User requested deletion (PDPA)",
      }); // เก็บ Log เล็กน้อย
      
      // ลบข้อมูลหลัก
      await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(userRef));
      
      // 2. ลบออกจาก Firebase Auth
      await import('firebase/auth').then(({ deleteUser }) => deleteUser(user));
      
      clearUserCache(uid);
      console.log('✅ [userService] Account permanently deleted.');
      return true;
    } catch (error) {
      console.error('❌ [userService] Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('กรุณาล็อกเอาท์และเข้าสู่ระบบใหม่อีกครั้ง ก่อนทำการลบบัญชี (เพื่อความปลอดภัย)');
      }
      throw error;
    }
  }
};