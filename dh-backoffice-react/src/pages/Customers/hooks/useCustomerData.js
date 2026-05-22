import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

export const useCustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // เปลี่ยน Key เพื่อเคลียร์แคชเก่าที่ไม่มีข้อมูลการเงินทิ้งไป
  const CACHE_KEY = 'dh_customers_data_cache_v2'; 
  const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner', 'manager', 'owner', 'admin', 'packer', 'staff'];

  const processCustomerData = (usersData) => {
    const customersOnly = usersData.filter(user => !user.role || !staffRoles.includes(user.role));
    
    // 💎 เรียงลำดับอัจฉริยะ: ดันคนที่ "มีเงินค้างในระบบ (Wallet)" ขึ้นมาก่อนให้แอดมินเห็นง่ายๆ
    customersOnly.sort((a, b) => {
      const salesA = a.stats?.totalSales || 0;
      const salesB = b.stats?.totalSales || 0;
      if (salesB !== salesA) return salesB - salesA; 
      
      const walletA = a.walletBalance || 0;
      const walletB = b.walletBalance || 0;
      return walletB - walletA; 
    });
    setCustomers(customersOnly);
  };

  const fetchCustomers = async (useCache = true) => {
    if (!useCache) setIsRefreshing(true);
    try {
      if (useCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          processCustomerData(JSON.parse(cachedData));
          setLoading(false);
        }
      }

      if (!useCache || !localStorage.getItem(CACHE_KEY)) {
        const q = query(collection(db, 'users')); // ยึดตาม Root Collection ของระบบหลังบ้าน
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // ⚡️ ผนวกข้อมูลทางการเงินและการเสียภาษี ให้พร้อมใช้งานในตาราง
            walletBalance: Number(data.walletBalance || data.stats?.currentWallet || data.partnerCredit || 0),
            creditPoints: Number(data.creditPoints || data.creditPoint || data.stats?.rewardPoints || 0),
            hasTaxInfo: !!(data.hasTaxInfo || data.taxId || data.taxInfo || data.taxAddress),
            
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

  useEffect(() => {
    fetchCustomers(true);
  }, []);

  return { customers, setCustomers, loading, isRefreshing, fetchCustomers, CACHE_KEY };
};