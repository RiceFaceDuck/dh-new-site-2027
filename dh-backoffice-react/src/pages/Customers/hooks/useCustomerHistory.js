import { useState, useCallback } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * Hook สำหรับดึงประวัติการสั่งซื้อและการเคลมของลูกค้า
 * แยกออกมาเพื่อลดภาระของ Main Hook และเรียกใช้เฉพาะตอนกดดูรายละเอียด
 */
export const useCustomerHistory = () => {
  // ==========================================
  // 1. History State
  // ==========================================
  const [customerHistory, setCustomerHistory] = useState({ 
    orders: [], 
    claims: [], 
    loading: false 
  });

  // ==========================================
  // 2. Fetch Logic
  // ==========================================
  
  // ใช้ useCallback เพื่อป้องกันการ render ซ้ำซ้อนเมื่อถูกส่งต่อเป็น prop
  const fetchCustomerHistory = useCallback(async (targetId) => {
    if (!targetId) {
      setCustomerHistory({ orders: [], claims: [], loading: false });
      return;
    }

    setCustomerHistory(prev => ({ ...prev, loading: true }));

    try {
      // ดึงประวัติบิล (Orders)
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('userId', '==', targetId));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // ดึงประวัติเคลม (Claims)
      const claimsRef = collection(db, 'claims');
      const claimsQuery = query(claimsRef, where('uid', '==', targetId));
      const claimsSnapshot = await getDocs(claimsQuery);

      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const claimsData = claimsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCustomerHistory({ 
        orders: ordersData, 
        claims: claimsData, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching customer history:", error);
      // หาก error ให้คืนค่าอาร์เรย์ว่าง เพื่อไม่ให้ UI พัง
      setCustomerHistory({ orders: [], claims: [], loading: false });
    }
  }, []);

  // ฟังก์ชันล้างข้อมูลประวัติ (เรียกใช้ตอนปิด Detail Panel)
  const clearCustomerHistory = useCallback(() => {
    setCustomerHistory({ orders: [], claims: [], loading: false });
  }, []);

  return {
    state: {
      customerHistory
    },
    actions: {
      fetchCustomerHistory,
      clearCustomerHistory
    }
  };
};