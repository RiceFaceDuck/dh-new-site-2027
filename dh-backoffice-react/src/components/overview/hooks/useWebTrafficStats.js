import { useState, useEffect, useMemo } from 'react';
import { webTrafficService } from '../../../firebase/webTrafficService';

/**
 * แปลง Timestamp หรือ ISO string ให้เป็นรูปแบบวันที่ไทยที่อ่านง่ายและกระชับ
 */
export const formatThaiTimestamp = (timestamp) => {
  if (!timestamp) return 'ยังไม่มีข้อมูล';

  let dateObj;
  if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    dateObj = new Date(timestamp);
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'ยังไม่มีข้อมูล';
  }

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = dateObj.getDate();
  const month = thaiMonths[dateObj.getMonth()];
  const year = dateObj.getFullYear() + 543;
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
};

/**
 * Custom Hook จัดการข้อมูลสถิติการเข้าชมหน้าเว็บ
 */
export const useWebTrafficStats = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = webTrafficService.subscribeTrafficStats(
      (data) => {
        if (!isMounted) return;
        setStatsData(data);
        setLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const formattedStats = useMemo(() => {
    return {
      yesterday: statsData?.yesterday ?? 0,
      last7Days: statsData?.last7Days ?? 0,
      last30Days: statsData?.last30Days ?? 0,
      allTime: statsData?.allTime ?? 0,
      lastUpdatedText: formatThaiTimestamp(statsData?.lastUpdatedAt),
      rawUpdatedAt: statsData?.lastUpdatedAt || null
    };
  }, [statsData]);

  return {
    stats: formattedStats,
    loading,
    error
  };
};
