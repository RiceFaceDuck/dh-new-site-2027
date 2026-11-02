import { useState, useEffect, useMemo } from 'react';
import { webTrafficClientService } from '../firebase/webTrafficClientService';

/**
 * Custom Hook สำหรับดึงและจัดการยอดผู้เข้าชมเว็บไซต์ All-Time
 * แยก Logic ออกจาก Presentation UI ตามหลัก Clean Architecture
 */
export const useWebTrafficAllTime = () => {
  const [allTimeCount, setAllTimeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    webTrafficClientService.getAllTimeVisitors()
      .then((count) => {
        if (isMounted) {
          setAllTimeCount(count);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('🔥 Failed to load all-time visitor count:', err);
        if (isMounted) {
          setAllTimeCount(0);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedCount = useMemo(() => {
    return Number(allTimeCount).toLocaleString('th-TH');
  }, [allTimeCount]);

  return {
    allTimeCount,
    formattedCount,
    loading
  };
};
