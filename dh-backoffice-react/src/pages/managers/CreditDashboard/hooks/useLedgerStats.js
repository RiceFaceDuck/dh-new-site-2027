import { useState, useEffect, useCallback } from 'react';
import { limit, doc, onSnapshot, collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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

  // ดึงยอดผู้ใช้งานจริง (ใช้ Aggregation เพื่อลดยอด Read จากหลักพันเหลือแค่ 3 Reads)
  const fetchRealUserStats = async () => {
    try {
      const usersRef = collection(db, getCollectionPath('users'));
      
      // คิวรี่ 1: คนที่มีเครดิต > 0 (หาผลรวมเครดิต และจำนวนคน)
      const q1 = query(usersRef, where('creditPoints', '>', 0), limit(300));
      
      // คิวรี่ 2: พาร์ทเนอร์ (หาจำนวนพาร์ทเนอร์ทั้งหมด)
      const q2 = query(usersRef, where('role', '==', 'partner'), limit(300));
      
      // คิวรี่ 3: พาร์ทเนอร์ที่มีเครดิต > 0 (เพื่อหักลบส่วนที่ซ้ำกัน)
      const q3 = query(usersRef, where('role', '==', 'partner'), where('creditPoints', '>', 0), limit(300));
      
      const [agg1, agg2, agg3] = await Promise.all([
        getAggregateFromServer(q1, { totalCredit: sum('creditPoints'), activeUsers: count() }),
        getAggregateFromServer(q2, { partnerCount: count() }),
        getAggregateFromServer(q3, { overlapCount: count() })
      ]);
      
      const totalCredit = agg1.data().totalCredit || 0;
      const countUsersWithCredit = agg1.data().activeUsers || 0;
      const countPartners = agg2.data().partnerCount || 0;
      const overlapCount = agg3.data().overlapCount || 0;
      
      const activeCount = countUsersWithCredit + countPartners - overlapCount;
      
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
      const ledgerRef = doc(db, getCollectionPath('settings'), 'credit_config');
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