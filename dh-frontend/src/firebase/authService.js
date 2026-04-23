import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './config'; // ต้องแน่ใจว่า src/firebase/config.js มีการ export db

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const authService = {
  // ฟังก์ชัน Login ด้วย Google พร้อมเชื่อมฐานข้อมูล
  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1. ตรวจสอบว่ามีข้อมูลผู้ใช้ใน Firestore หรือยัง
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 2. ถ้ายังไม่มี (สมัครใหม่) ให้สร้างข้อมูลให้ตรงกับโครงสร้างหลังบ้านเป๊ะๆ
        const newUserProfile = {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL || '',
          userType: 'customer', // 🚀 แก้ไขเป็น customer เพื่อให้แสดงในตารางลูกค้าหลังบ้าน
          rank: 'Partner', 
          role: 'Partner', 
          isApproved: true, 
          
          // ข้อมูลระดับ Root (เพื่อ Backoffice ดึงไปแสดงในตาราง Customers.jsx ได้ทันที)
          accountName: user.displayName || 'ผู้ใช้งานใหม่',
          contactName: user.displayName || 'ลูกค้าใหม่', // เพิ่มค่าเริ่มต้น
          phone: '',
          address: '',
          logisticProvider: '',
          
          // ข้อมูลร้านค้าและบริการ (สำหรับหน้าบ้าน TabOverview.jsx)
          shopInfo: {
            shopName: '',
            mapUrl: '',
            services: {
              screen_keyboard: false,
              board_chip: false,
              software_os: false,
              server_network: false,
              buy_secondhand: false,
              onsite: false,
              machine_robot: false,
              ai_smarthome: false
            },
            social: {
              youtube: '',
              tiktok: '',
              facebook: ''
            },
            tax: {
              name: '',
              taxId: '',
              address: ''
            }
          },

          // การตั้งค่าแสดงผล
          settings: {
            badgeEnabled: true,
            badgeType: '🏆 สมาชิกผู้สนับสนุน (Prime Member)'
          },
          
          // โครงสร้างทางการเงิน (สำคัญมาก ห้ามผิดพลาดเด็ดขาด)
          partnerCredit: 0,
          stats: {
            creditBalance: 0, 
            rewardPoints: 0,  
            totalSales: 0,
            last30DaysSales: 0
          },
          
          // ข้อมูลการสนับสนุน
          isSupportActive: true, 
          
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // บันทึกข้อมูล Profile
        await setDoc(userRef, newUserProfile);

        // 🚀 บันทึก Audit Log แจ้งเตือนแอดมินว่ามีการสมัครใหม่
        await addDoc(collection(db, 'history_logs'), {
          module: 'Auth',
          action: 'Register',
          targetId: user.uid,
          details: `ลูกค้าระบบหน้าบ้านลงทะเบียนใหม่: ${user.email}`,
          actionBy: user.uid,
          actorName: user.displayName || user.email,
          timestamp: serverTimestamp()
        });

        return { isNewUser: true, profile: newUserProfile };
      } else {
        // อัปเดตเวลาใช้งานล่าสุด (Optional แต่ดีต่อการเก็บสถิติ)
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        return { isNewUser: false, profile: userSnap.data() };
      }
    } catch (error) {
      console.error("🔥 Google Login Error:", error);
      throw error;
    }
  },

  // ดึงข้อมูล Profile ปัจจุบันจาก Firestore
  getUserProfile: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error("🔥 Fetch Profile Error:", error);
      return null;
    }
  },

  // ออกจากระบบ
  logout: async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("🔥 Logout Error:", error);
      throw error;
    }
  }
};