import { db } from './config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// 🧠 Smart Memory Cache (ประหยัดค่าใช้จ่าย Firebase Reads)
// ==========================================
let userProfileCache = {};
let lastFetchTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // แคชข้อมูลไว้ 5 นาที

/**
 * ล้างข้อมูลแคช (เรียกใช้ตอน Logout)
 */
export const clearUserCache = (uid = null) => {
  if (uid) {
    delete userProfileCache[uid];
    delete lastFetchTime[uid];
  } else {
    userProfileCache = {};
    lastFetchTime = {};
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
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const data = snap.data();
        // บันทึกข้อมูลลง Cache
        userProfileCache[uid] = data;
        lastFetchTime[uid] = now;
        return data;
      }
      return null;
    } catch (error) {
      console.error('❌ [userService] Error fetching profile:', error);
      throw error;
    }
  },

  // ==========================================
  // 2. อัปเดตข้อมูล Profile (ระบบรักษาความปลอดภัยข้อมูล)
  // ==========================================
  updateUserProfile: async (uid, data) => {
    if (!uid) throw new Error('User ID is required');

    try {
      const userRef = doc(db, 'users', uid);
      // บังคับใช้ merge: true เพื่อป้องกันข้อมูลสูญหาย 100%
      await setDoc(userRef, data, { merge: true });
      
      // อัปเดต Cache ทันทีเพื่อให้ UI ตอบสนองไม่ต้องรอรอบดึงใหม่
      if (userProfileCache[uid]) {
        userProfileCache[uid] = { ...userProfileCache[uid], ...data };
      }
      return true;
    } catch (error) {
      console.error('❌ [userService] Error updating profile:', error);
      throw error;
    }
  },

  // ==========================================
  // 3. จัดการเฉพาะส่วน Ecosystem (เช่น Google Maps)
  // ==========================================
  updateEcosystem: async (uid, ecosystemData) => {
    if (!uid) throw new Error('User ID is required');
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ecosystem: ecosystemData }, { merge: true });
      
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
    }, (error) => {
      console.error('❌ [userService] Real-time listener error:', error);
    });

    // คืนค่าฟังก์ชันสำหรับ Unsubscribe เมื่อ Component ถูกทำลาย
    return unsubscribe;
  }
};