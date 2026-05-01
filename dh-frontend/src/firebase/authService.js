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

// ------------------------------------
// 1. เข้าสู่ระบบด้วย Google
// ------------------------------------
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // ตรวจสอบข้อมูลใน Firestore (ประหยัด Writes ไม่เขียนทับข้อมูลกระเป๋าเงินเดิม)
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // กรณีผู้ใช้ใหม่ สร้าง Profile ใหม่
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || 'ผู้ใช้งานใหม่',
        email: user.email,
        photoURL: user.photoURL || '',
        role: 'customer', 
        wallet: 0,
        creditPoint: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      // กรณีมีบัญชีอยู่แล้ว อัปเดตเฉพาะเวลาเข้าสู่ระบบล่าสุดและรูปภาพ
      await setDoc(userRef, { 
        lastLogin: serverTimestamp(),
        photoURL: user.photoURL 
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Google Login Error: ", error);
    // เพิ่มการดักจับกรณี Popup โดนบล็อคโดยเบราว์เซอร์
    if (error.code === 'auth/popup-blocked') {
      throw new Error('เบราว์เซอร์ของคุณบล็อคหน้าต่าง Popup กรุณาอนุญาตให้แสดง Popup สำหรับเว็บนี้');
    }
    throw error;
  }
};

// ------------------------------------
// 2. เข้าสู่ระบบด้วย Email
// ------------------------------------
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// ------------------------------------
// 3. สมัครสมาชิกด้วย Email
// ------------------------------------
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name || 'ผู้ใช้งานใหม่',
      email: user.email,
      photoURL: '',
      role: 'customer',
      wallet: 0,
      creditPoint: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

// ------------------------------------
// 4. ออกจากระบบ
// ------------------------------------
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error: ", error);
    throw error;
  }
};