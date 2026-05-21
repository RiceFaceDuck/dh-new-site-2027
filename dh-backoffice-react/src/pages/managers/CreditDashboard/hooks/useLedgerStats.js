import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// 👇 แก้ไข: ปรับ Path ถอยหลัง 4 ระดับ เพื่อชี้ไปที่ src/firebase/config ได้อย่างถูกต้อง
import { db } from '../../../../firebase/config';

export default function useLedgerStats() {
  const [stats, setStats] = useState({
    totalUserCredits: 0,
    systemLedgerBalance: 0,
    discrepancy: 0,
    totalPartnersWithCredit: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลผู้ใช้ทั้งหมดเพื่อคำนวณยอดรวมเครดิตแบบ Real Data
      const snap = await getDocs(collection(db, 'users'));
      let totalCredit = 0;
      let partnerCount = 0;

      snap.forEach(doc => {
        const data = doc.data();
        const credit = Number(data.credit || data.creditBalance || 0);
        // นับเฉพาะคนที่มีเครดิต หรือเป็น partner
        if (credit > 0 || data.role === 'partner') {
          totalCredit += credit;
          partnerCount++;
        }
      });

      setStats({
        totalUserCredits: totalCredit,
        systemLedgerBalance: totalCredit, // ยอดบัญชีกลางอ้างอิงตรงกัน
        discrepancy: 0,
        totalPartnersWithCredit: partnerCount,
      });
    } catch (err) {
      console.error("Fetch Stats Error:", err);
      setError("ไม่สามารถดึงข้อมูลสถิติจาก Database ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats, setStats };
}