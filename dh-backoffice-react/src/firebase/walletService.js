import { db } from './config';
import { sharedWalletService } from 'dh-shared/src/firebase/walletService';
import { getUsersPath } from 'dh-shared/src/firebase/pathUtils';

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
    return sharedWalletService.subscribeToWalletAndPoints(db, getUsersPath(), customerId, callback);
  },

  getWalletAndPoints: async (customerId) => {
    return await sharedWalletService.getWalletAndPoints(db, getUsersPath(), customerId);
  }
};