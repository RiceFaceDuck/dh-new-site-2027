import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function useLedgerStats() {
  const [stats, setStats] = useState({
    totalUserCredits: 0,
    systemLedgerBalance: 0,
    discrepancy: 0,
    totalPartnersWithCredit: 0,
    ledgerStatus: 'INITIALIZING',
    lastUpdated: null
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // ดึงยอดผู้ใช้งานจริง (คิวรี่เฉพาะคนที่มีเครดิต หรือเป็นพาร์ทเนอร์ เพื่อประหยัด Quota)
  const fetchRealUserStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      // คิวรี่ 1: คนที่มีเครดิต > 0
      const q1 = query(usersRef, where('creditPoints', '>', 0));
      // คิวรี่ 2: พาร์ทเนอร์
      const q2 = query(usersRef, where('role', '==', 'partner'));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      let totalCredit = 0;
      let activeCount = 0;
      const seen = new Set();
      
      const processDoc = (doc) => {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          const d = doc.data();
          let pool = Number(d.creditPoints || 0);
          
          if (pool > 0 || d.role === 'partner') {
            totalCredit += pool;
            activeCount += 1;
          }
        }
      };

      snap1.forEach(processDoc);
      snap2.forEach(processDoc);
      
      return { totalCredit, activeCount };
    } catch (err) {
      console.error("Failed to fetch real users:", err);
      return { totalCredit: 0, activeCount: 0 };
    }
  };

  const refetch = useCallback(async () => {
    setIsLoading(true);
    const userStats = await fetchRealUserStats();
    setStats(prev => ({ 
      ...prev, 
      totalUserCredits: userStats.totalCredit,
      totalPartnersWithCredit: userStats.activeCount 
    }));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    const initStats = async () => {
      const userStats = await fetchRealUserStats();
      if (!isActive) return;
      
      setStats(prev => ({ 
        ...prev, 
        totalUserCredits: userStats.totalCredit,
        totalPartnersWithCredit: userStats.activeCount 
      }));

      // 👇 FIX: แก้ Path ให้เป็น 6 ระดับ (เลขคู่)
      const ledgerRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      const unsubscribe = onSnapshot(ledgerRef, (docSnap) => {
        if (!isActive) return;
        
        let systemPoolMax = 1000000;
        let status = 'SECURE';

        if (docSnap.exists()) {
          const data = docSnap.data();
          const ledger = data.ledger || {};
          systemPoolMax = Number(ledger.systemPoolMax || 1000000);
          status = ledger.status || 'SECURE';
        }

        setStats(current => ({
          ...current,
          systemLedgerBalance: systemPoolMax,
          discrepancy: systemPoolMax > 0 ? (systemPoolMax - current.totalUserCredits) : 0,
          ledgerStatus: status,
          lastUpdated: new Date()
        }));
        setIsLoading(false);
      }, (err) => {
        console.error("🔥 System Error [Master Ledger]:", err);
        if (isActive) setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initStats();

    return () => {
      isActive = false;
      if (unsubscribe && typeof unsubscribe.then === 'function') {
        unsubscribe.then(unsub => unsub && unsub());
      } else if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return { stats, isLoading, error: null, refetch, setStats };
}