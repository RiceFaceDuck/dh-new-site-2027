import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';

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

    const userRef = doc(db, 'users', customerId);
    
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
            creditPoints: typeof data.creditPoints === 'number' ? data.creditPoints : 0
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
      const userRef = doc(db, 'users', customerId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
          creditPoints: typeof data.creditPoints === 'number' ? data.creditPoints : 0
        };
      }
      return { walletBalance: 0, creditPoints: 0 };
    } catch (error) {
      console.error(`Error fetching wallet data for ${customerId}:`, error);
      return { walletBalance: 0, creditPoints: 0 };
    }
  }
};