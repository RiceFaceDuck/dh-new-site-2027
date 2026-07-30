import { useState, useEffect, useCallback } from 'react';
import { limit, collection, query, getDocs, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';

import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
export const useCustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // เปลี่ยน Key เพื่อเคลียร์แคชเก่าที่มียอดสั่งซื้อ 30 วันไม่ถูกต้องทิ้งไป
  const CACHE_KEY = 'dh_customers_data_cache_v7'; 
  const LAST_SYNC_KEY = 'dh_customers_last_sync_v7';
  const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner', 'manager', 'owner', 'admin', 'packer', 'staff'];

  const processCustomerData = (usersData) => {
    // กรองเอาเฉพาะลูกค้า (ไม่เอา staff) และไม่เอาคนที่ถูก Soft Delete (status === 'deleted' หรือ isActive === false)
    const customersOnly = usersData.filter(user => 
      (!user.role || !staffRoles.includes(user.role)) && 
      user.status !== 'deleted' && 
      user.isActive !== false
    );
    
    // 💎 เรียงลำดับอัจฉริยะ: ดันคนที่ "มีบิลล่าสุดใหม่สุด" ขึ้นมาก่อน หากเท่ากันดึงตามยอด 30D และ Wallet
    customersOnly.sort((a, b) => {
      const lastOrderA = Number(a.lastOrderDate || a.stats?.lastOrderDate || a.stats?.lastPurchaseDate || 0);
      const lastOrderB = Number(b.lastOrderDate || b.stats?.lastOrderDate || b.stats?.lastPurchaseDate || 0);
      if (lastOrderB !== lastOrderA) return lastOrderB - lastOrderA;

      const salesA = Number(a.sales30Days || a.stats?.sales30Days || a.stats?.monthlySales || a.stats?.totalSales || 0);
      const salesB = Number(b.sales30Days || b.stats?.sales30Days || b.stats?.monthlySales || b.stats?.totalSales || 0);
      if (salesB !== salesA) return salesB - salesA; 
      
      const walletA = a.walletBalance || 0;
      const walletB = b.walletBalance || 0;
      return walletB - walletA; 
    });
    setCustomers(customersOnly);
  };

  // 🎯 อัปเดตข้อมูลสถิติบิลล่าสุดและ 30D Paid Out ของกลุ่มลูกค้าในหน้าปัจจุบัน
  const enrichCustomersWithOrderStats = useCallback((orderStatsMap) => {
    if (!orderStatsMap || Object.keys(orderStatsMap).length === 0) return;
    
    setCustomers(prevCustomers => {
      let isChanged = false;
      const updated = prevCustomers.map(cust => {
        const uid = cust.uid || cust.id;
        const stats = orderStatsMap[uid];
        if (stats) {
          const newLastOrder = stats.lastOrderDate || cust.lastOrderDate;
          const newSales30Days = stats.sales30Days !== undefined ? stats.sales30Days : cust.sales30Days;
          const newOrderCount30Days = stats.orderCount30Days !== undefined ? stats.orderCount30Days : (cust.orderCount30Days || 0);
          
          if (newLastOrder !== cust.lastOrderDate || newSales30Days !== cust.sales30Days || newOrderCount30Days !== cust.orderCount30Days) {
            isChanged = true;
            return {
              ...cust,
              lastOrderDate: newLastOrder,
              sales30Days: newSales30Days,
              orderCount30Days: newOrderCount30Days,
              stats: {
                ...(cust.stats || {}),
                lastOrderDate: newLastOrder,
                sales30Days: newSales30Days,
                orderCount30Days: newOrderCount30Days
              }
            };
          }
        }
        return cust;
      });

      if (!isChanged) return prevCustomers;

      // จัดเรียงใหม่หลังจากอัปเดตสถิติบิลล่าสุด
      updated.sort((a, b) => {
        const lastOrderA = Number(a.lastOrderDate || a.stats?.lastOrderDate || a.stats?.lastPurchaseDate || 0);
        const lastOrderB = Number(b.lastOrderDate || b.stats?.lastOrderDate || b.stats?.lastPurchaseDate || 0);
        if (lastOrderB !== lastOrderA) return lastOrderB - lastOrderA;

        const salesA = Number(a.sales30Days || a.stats?.sales30Days || a.stats?.monthlySales || a.stats?.totalSales || 0);
        const salesB = Number(b.sales30Days || b.stats?.sales30Days || b.stats?.monthlySales || b.stats?.totalSales || 0);
        if (salesB !== salesA) return salesB - salesA; 

        return (b.walletBalance || 0) - (a.walletBalance || 0);
      });

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update cache with enriched order stats", e);
      }

      return updated;
    });
  }, [CACHE_KEY]);

  const fetchCustomers = useCallback(async (useCache = true) => {
    if (!useCache) setIsRefreshing(true);
    try {
      let cachedUsers = [];
      let lastSync = 0;
      
      if (useCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const syncData = localStorage.getItem(LAST_SYNC_KEY);
        if (cachedData) {
          try {
            cachedUsers = safeJsonParse(cachedData);
            if (syncData) lastSync = parseInt(syncData, 10);
          } catch (e) {
            console.error("Failed to parse customer cache", e);
            cachedUsers = [];
          }
          
          processCustomerData(cachedUsers);
          setLoading(false);
        }
      }

      if (!useCache || cachedUsers.length === 0) {
        // 🔥 Cleanup ghost accounts generated by previous bugs
        try {
          const { deleteDoc, doc } = await import('firebase/firestore');
          await deleteDoc(doc(db, getCollectionPath('users'), '0AUXLNHI'));
          await deleteDoc(doc(db, getCollectionPath('users'), '0AUxlnHi'));
        } catch (e) { console.log('Cleanup error (ignored):', e); }
      }

      let q;
      // 🚀 Delta Fetching Optimization
      if (useCache && lastSync > 0) {
        const bufferMs = 5 * 60 * 1000;
        const safeSyncTime = Math.max(0, lastSync - bufferMs);
        q = query(collection(db, getCollectionPath('users')), where('updatedAt', '>', Timestamp.fromMillis(safeSyncTime)), limit(300));
      } else {
        q = query(collection(db, getCollectionPath('users')), orderBy('createdAt', 'desc'), limit(300)); 
      }

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty || !useCache || cachedUsers.length === 0) {
        const fetchedData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            walletBalance: Number(data.walletBalance || 0),
            creditPoints: Number(data.creditPoints || data.stats?.rewardPoints || 0),
            hasTaxInfo: !!(data.hasTaxInfo || data.taxId || data.taxInfo || data.taxAddress),
            lastOrderDate: Number(data.lastOrderDate || data.stats?.lastOrderDate || data.stats?.lastPurchaseDate || 0),
            sales30Days: Number(data.sales30Days || data.stats?.sales30Days || data.stats?.monthlySales || 0),
            
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
          };
        });

        let updatedUsersData = [];
        if (useCache && lastSync > 0 && cachedUsers.length > 0) {
          const fetchedMap = new Map(fetchedData.map(u => [u.id, u]));
          updatedUsersData = cachedUsers.map(u => fetchedMap.has(u.id) ? fetchedMap.get(u.id) : u);
          
          const cachedSet = new Set(cachedUsers.map(u => u.id));
          const newUsers = fetchedData.filter(u => !cachedSet.has(u.id));
          updatedUsersData = [...updatedUsersData, ...newUsers];
        } else {
          updatedUsersData = fetchedData;
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedUsersData));
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        processCustomerData(updatedUsersData);
      } else if (cachedUsers.length > 0) {
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [CACHE_KEY, LAST_SYNC_KEY]);

  useEffect(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  return { customers, setCustomers, loading, isRefreshing, fetchCustomers, enrichCustomersWithOrderStats, CACHE_KEY };
};