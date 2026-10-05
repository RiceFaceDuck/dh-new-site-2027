import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CUSTOMER_CACHE_KEY,
  readCachedCustomers,
  writeCachedCustomers,
  fetchCustomerDirectoryChunk,
  fetchCustomersFromFirestore,
  filterAndSortCustomers,
  applyActiveStatsDelta
} from '../services/customerCacheService';
import { fetchActiveCustomerStats, clearCustomerStatsCache } from '../services/customerOrderStatsService';

export const useCustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastActiveCheckRef = useRef(0);
  const isCheckingActiveRef = useRef(false);

  const CACHE_KEY = CUSTOMER_CACHE_KEY;

  // 🎯 อัปเดตข้อมูลสถิติบิลล่าสุดและ 30D Paid Out ของกลุ่มลูกค้าในหน้าปัจจุบัน
  const enrichCustomersWithOrderStats = useCallback((orderStatsMap) => {
    if (!orderStatsMap || Object.keys(orderStatsMap).length === 0) return;

    setCustomers(prev => {
      const { updatedList, isChanged } = applyActiveStatsDelta(prev, orderStatsMap);
      if (isChanged) {
        writeCachedCustomers(updatedList);
        return updatedList;
      }
      return prev;
    });
  }, []);

  // ⚡ ตรวจสอบและอัปเดตสถิติบิล 30 วันจาก catalogs/customers_active_30d แบบ 0-1 Read
  const validateAndRefreshActiveStats = useCallback(async (force = false) => {
    const now = Date.now();
    if (isCheckingActiveRef.current) return;
    if (!force && lastActiveCheckRef.current > 0 && now - lastActiveCheckRef.current < 30000) return; // 30s throttle

    lastActiveCheckRef.current = now;
    isCheckingActiveRef.current = true;

    try {
      const { hasChanges, customersMap } = await fetchActiveCustomerStats(force);
      if (!customersMap || Object.keys(customersMap).length === 0) return;

      setCustomers(prev => {
        const { updatedList, isChanged } = applyActiveStatsDelta(prev, customersMap);
        if (isChanged) {
          writeCachedCustomers(updatedList);
          return updatedList;
        }
        return prev;
      });
    } catch (err) {
      console.warn("⚠️ [useCustomerData] Auto-refresh active stats warning:", err);
    } finally {
      isCheckingActiveRef.current = false;
    }
  }, []);

  // 🚀 โฟลว์หลักการดึงข้อมูลลูกค้า (Cold-Start Directory -> Bounded Delta Query)
  const fetchCustomers = useCallback(async (useCache = true) => {
    if (!useCache) {
      setIsRefreshing(true);
      clearCustomerStatsCache();
    }

    try {
      let cachedUsers = [];
      let lastSync = 0;

      // 1. อ่านแคชจาก SessionStorage / LocalStorage ก่อนเพื่อแสดงผลแบบ Instant (0 Read)
      const cached = await readCachedCustomers();
      cachedUsers = cached?.cachedUsers || [];
      lastSync = cached?.lastSync || 0;

      if (useCache && cachedUsers.length > 0) {
        setCustomers(filterAndSortCustomers(cachedUsers));
        setLoading(false);
      }

      let currentUsers = cachedUsers;

      // 2. Cold Start: ถ้าไม่มีแคชในเครื่อง หรือผู้ใช้สั่งรีเฟรช ให้ดึงจาก catalogs/customers_directory (1 Read ครบ 100% รายการ)
      if (currentUsers.length === 0 || !useCache) {
        const directoryUsers = await fetchCustomerDirectoryChunk();
        if (directoryUsers && directoryUsers.length > 0) {
          currentUsers = directoryUsers;
          const sorted = filterAndSortCustomers(directoryUsers);
          setCustomers(sorted);
          writeCachedCustomers(sorted);
          lastSync = Date.now();
          setLoading(false);
        }
      }

      // 3. Bounded Delta Fetch: ตรวจสอบข้อมูลที่มีการเปลี่ยนแปลงล่าสุดจาก users collection
      // ถ้า lastSync > 0 จะคิวรีเฉพาะ updatedAt > lastSync - buffer (0-3 Reads)
      if (currentUsers.length > 0 && lastSync > 0) {
        const { updatedUsers, hasChanges } = await fetchCustomersFromFirestore(lastSync, currentUsers);
        if (hasChanges && updatedUsers && updatedUsers.length > 0) {
          const sorted = filterAndSortCustomers(updatedUsers);
          setCustomers(sorted);
          writeCachedCustomers(sorted);
        }
      } else if (currentUsers.length === 0) {
        // Fallback กรณีไม่มีทั้งแคชและ directory chunk
        const { updatedUsers } = await fetchCustomersFromFirestore(0, []);
        if (updatedUsers && updatedUsers.length > 0) {
          const sorted = filterAndSortCustomers(updatedUsers);
          setCustomers(sorted);
          writeCachedCustomers(sorted);
        }
      }

      validateAndRefreshActiveStats(!useCache);
    } catch (error) {
      console.error("Error fetching customers from DB:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [validateAndRefreshActiveStats]);

  useEffect(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  // 🔄 ตรวจสอบเมื่อสลับแท็บบราวเซอร์ (Visibility Change / Focus)
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      validateAndRefreshActiveStats(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('focus', handleVisibility);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleVisibility);
      }
    };
  }, [validateAndRefreshActiveStats]);

  return {
    customers,
    setCustomers,
    loading,
    isRefreshing,
    fetchCustomers,
    validateAndRefreshActiveStats,
    enrichCustomersWithOrderStats,
    CACHE_KEY
  };
};