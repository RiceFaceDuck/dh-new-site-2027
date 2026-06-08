import { useState, useEffect } from 'react';
import { walletService } from '../../../../firebase/walletService';

/**
 * Custom Hook สำหรับดึงข้อมูลการเงิน (Wallet & Credit Points) ของลูกค้าแบบ Real-time
 * @param {string} customerId - รหัสของลูกค้า (UID)
 * @returns {Object} { walletBalance: number, creditPoints: number, loading: boolean }
 */
export function useCustomerFinancials(customerId) {
  const [financials, setFinancials] = useState({
    walletBalance: 0,
    creditPoints: 0,
    loading: true
  });

  useEffect(() => {
    let isMounted = true;

    // ถ้ารหัสลูกค้าไม่มีอยู่ ให้รีเซ็ตค่าเป็น 0 และหยุดโหลด
    if (!customerId) {
      setFinancials({ walletBalance: 0, creditPoints: 0, loading: false });
      return;
    }

    // เซ็ตสถานะโหลดก่อนเริ่มดึงข้อมูล
    setFinancials(prev => ({ ...prev, loading: true }));

    // เรียกใช้ Service เพื่อ Subscribe ข้อมูลจาก Firestore แบบ Real-time
    const unsubscribe = walletService.subscribeToWalletAndPoints(customerId, (data) => {
      if (isMounted) {
        setFinancials({
          walletBalance: data.walletBalance || 0,
          creditPoints: data.creditPoints || 0,
          loading: false
        });
      }
    });

    // Cleanup function: ทำงานเมื่อ Component ถูก Unmount หรือ customerId เปลี่ยน
    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [customerId]);

  return financials;
}