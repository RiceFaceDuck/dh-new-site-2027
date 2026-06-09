import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';

const appId = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

const getUsersPath = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('canvas') && typeof window.__app_id !== 'undefined') {
        return `artifacts/${window.__app_id}/public/data/users`;
    }
    return 'users';
};

/**
 * Service สำหรับจัดการข้อมูล Wallet และ Credit Points ของลูกค้าฝั่ง Backoffice
 * แยกออกมาจาก userService เพื่อให้เป็น Clean Architecture และทำงานแบบ Single Responsibility
 */
export const walletService = {
  /**
   * Subscribe ข้อมูลกระเป๋าเงินและแต้มสะสมแบบ Real-time (สำหรับหน้าตารางและ Detail)
   * @param {string} customerId - รหัสของลูกค้า (UID)
   * @param {function} callback - ฟังก์ชันรับข้อมูลกลับไปแสดงผล
   * @returns {function} Unsubscribe function สำหรับยกเลิกการฟังสัญญาณเมื่อ Component Unmount
   */
  subscribeToWalletAndPoints: (customerId, callback) => {
    if (!customerId) {
      callback({ walletBalance: 0, creditPoints: 0 });
      return () => {}; // return empty unsubscribe
    }

    const usersPath = getUsersPath();
    const userRef = doc(db, usersPath, customerId);
    
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // ค้นหาค่า Wallet (เงินสด/เงินคืน) จากฟิลด์ที่ถูกต้อง
          const wallet = Number(data.walletBalance ?? 0);

          // ค้นหาค่า Points (แต้ม) จากฟิลด์ที่ถูกต้อง
          const points = Number(data.creditPoints ?? 0);

          callback({
            walletBalance: isNaN(wallet) ? 0 : wallet,
            creditPoints: isNaN(points) ? 0 : points
          });
        } else {
          callback({ walletBalance: 0, creditPoints: 0 });
        }
      }, 
      (error) => {
        console.error(`Error subscribing to wallet data for ${customerId}:`, error);
        callback({ walletBalance: 0, creditPoints: 0 });
      }
    );

    return unsubscribe;
  },

  /**
   * ดึงข้อมูลกระเป๋าเงินและแต้มสะสมแบบครั้งเดียว (One-time fetch)
   * @param {string} customerId - รหัสของลูกค้า (UID)
   * @returns {Promise<{walletBalance: number, creditPoints: number}>}
   */
  getWalletAndPoints: async (customerId) => {
    if (!customerId) return { walletBalance: 0, creditPoints: 0 };
    
    try {
      const usersPath = getUsersPath();
      const userRef = doc(db, usersPath, customerId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const wallet = Number(data.walletBalance ?? 0);
        const points = Number(data.creditPoints ?? 0);

        return {
          walletBalance: isNaN(wallet) ? 0 : wallet,
          creditPoints: isNaN(points) ? 0 : points
        };
      }
      return { walletBalance: 0, creditPoints: 0 };
    } catch (error) {
      console.error(`Error fetching wallet data for ${customerId}:`, error);
      return { walletBalance: 0, creditPoints: 0 };
    }
  }
};