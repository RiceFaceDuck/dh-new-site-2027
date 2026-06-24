import { auth, db } from './config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();
// บังคับให้เลือกบัญชีทุกครั้ง ป้องกันการ Auto-login บัญชีผิด
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// ==========================================
// 🛠️ Core Utility: ระบบจัดการ Profile แบบรัดกุม (Auto-Healing Schema)
// ==========================================

// Removed generateAccountId as we now use deterministic uid slicing for accountId

// ฟังก์ชันตรวจสอบและซ่อมแซม Profile (ป้องกัน Data Corrupted 100%)
const ensureUserProfile = async (user, additionalData = {}) => {
  if (!user) return null;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // ข้อมูลพื้นฐานที่ต้องอัปเดตทุกครั้งที่ Login
    const loginData = {
      email: user.email,
      lastLogin: serverTimestamp(),
      ...additionalData
    };

    if (!userSnap.exists()) {
      // 🌟 กรณี User ใหม่: สร้าง Schema ให้สมบูรณ์แบบ
      console.log('✨ [Auth] Creating new professional profile...');
      await setDoc(userRef, {
        uid: user.uid,
        accountId: user.uid.substring(0, 8).toUpperCase(), // รหัสลูกค้าสุดเท่ (8 หลักแรกของ UID)
        name: user.displayName || additionalData.name || 'ผู้ใช้งานใหม่',
        photoURL: user.photoURL || '',
        role: 'customer',
        // 💰 เตรียมโครงสร้างการเงิน (Ecosystem)
        walletBalance: 0,
        creditPoints: 0,
        // 🗺️ เตรียมโครงสร้างแผนที่สำหรับ Partner
        ecosystem: {
          mapUrl: ''
        },
        createdAt: serverTimestamp(),
        ...loginData
      });
    } else {
      // 🛡️ กรณี User เดิม: ตรวจสอบฟิลด์ที่หายไป และ Merge เข้าไป (Data Healing)
      const existingData = userSnap.data();
      const updateData = { ...loginData };

      // ถ้าไม่มี Account ID (User เก่า) ให้สร้างให้ใหม่
      if (!existingData.accountId) updateData.accountId = user.uid.substring(0, 8).toUpperCase();
      // การันตีว่ามีฟิลด์การเงิน ไม่พังตอนเรียกใช้
      if (existingData.walletBalance === undefined) updateData.walletBalance = 0;
      if (existingData.creditPoints === undefined) updateData.creditPoints = 0;
      if (!existingData.ecosystem) updateData.ecosystem = { mapUrl: '' };

      // ใช้ { merge: true } เพื่อไม่ให้ทับข้อมูลอื่นๆ ที่ลูกค้าเคยกรอกไว้ (เช่น เบอร์โทร)
      await setDoc(userRef, updateData, { merge: true });
      console.log('🔒 [Auth] Profile secured and synchronized.');
    }
    return userRef;
  } catch (error) {
    console.error('❌ [Auth Error] Failed to ensure profile:', error);
    throw error;
  }
};

// ==========================================
// 1. เข้าสู่ระบบด้วย Google
// ==========================================
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // เรียกใช้ระบบรักษาความปลอดภัยข้อมูลทันทีที่ Login สำเร็จ
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Login Error:', error);
    throw error;
  }
};

// ==========================================
// 2. เข้าสู่ระบบด้วย Email
// ==========================================
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // เรียกใช้ระบบรักษาความปลอดภัยข้อมูลอัปเดต Last Login และซ่อมแซม Schema
    await ensureUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// 3. สมัครสมาชิกด้วย Email
// ==========================================
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // สร้าง Profile ใหม่พร้อมแนบชื่อที่กรอกเข้ามา
    await ensureUserProfile(userCredential.user, { name: name });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// 4. ออกจากระบบ
// ==========================================
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("👋 [Auth] User signed out successfully");
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};