import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * Hook สำหรับจัดการข้อมูลลูกค้าหลักและการทำ Cache
 * แยกออกมาจาก useCustomers.js เดิมเพื่อลดความซับซ้อน
 */
export const useCustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const CACHE_KEY = 'dh_customers_data_cache';
  const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner'];

  // จัดระเบียบข้อมูลลูกค้า (กรอง Staff ออก และเรียงตามยอดขาย)
  const processCustomerData = (usersData) => {
    const customersOnly = usersData.filter(user => !user.role || !staffRoles.includes(user.role));
    customersOnly.sort((a, b) => {
      const salesA = a.stats?.totalSales || 0;
      const salesB = b.stats?.totalSales || 0;
      return salesB - salesA; 
    });
    setCustomers(customersOnly);
  };

  // ฟังก์ชันดึงข้อมูลจาก Firebase
  const fetchCustomers = async (useCache = true) => {
    if (!useCache) setIsRefreshing(true);
    try {
      // 1. ตรวจสอบ Cache ก่อนถ้าต้องการ
      if (useCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          processCustomerData(JSON.parse(cachedData));
          setLoading(false);
        }
      }

      // 2. ดึงข้อมูลใหม่จาก Firestore
      if (!useCache || !localStorage.getItem(CACHE_KEY)) {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
          };
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(usersData));
        processCustomerData(usersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // โหลดข้อมูลทันทีเมื่อ Mount
  useEffect(() => {
    fetchCustomers(true);
  }, []);

  return {
    customers,
    setCustomers, // เผื่อใช้สำหรับ Update Local State หลังจาก Edit
    loading,
    isRefreshing,
    fetchCustomers,
    CACHE_KEY
  };
};