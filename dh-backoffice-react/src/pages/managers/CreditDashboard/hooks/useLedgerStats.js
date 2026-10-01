import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { creditCacheManager, CREDIT_CACHE_KEYS, CREDIT_CACHE_TTL } from '../../../../firebase/credit/creditCacheManager';

export default function useLedgerStats() {
  const [stats, setStats] = useState(() => {
    return creditCacheManager.get(CREDIT_CACHE_KEYS.LEDGER_STATS, CREDIT_CACHE_TTL.LEDGER_STATS) || {
      totalUserCredits: 0,
      systemLedgerBalance: 0,
      systemPoolMax: 10000000,
      remainingPool: 10000000,
      discrepancy: 0,
      totalPartnersWithCredit: 0,
      ledgerStatus: 'INITIALIZING',
      lastUpdated: null
    };
  });

  const [isLoading, setIsLoading] = useState(() => {
    return !creditCacheManager.get(CREDIT_CACHE_KEYS.LEDGER_STATS, CREDIT_CACHE_TTL.LEDGER_STATS);
  });

  // ⚡ ดึงผลรวมจริงจากฐานข้อมูล users โดยใช้ Server Aggregation (1 Read Quota)
  const fetchRealUserStats = async () => {
    try {
      const usersRef = collection(db, getCollectionPath('users'));
      const q = query(usersRef, where('creditPoints', '!=', 0));
      const aggSnap = await getAggregateFromServer(q, {
        totalCredit: sum('creditPoints'),
        activeCount: count()
      });
      const data = aggSnap.data();
      return {
        totalCredit: data.totalCredit || 0,
        activeCount: data.activeCount || 0
      };
    } catch (err) {
      console.error('Failed to fetch real user aggregate:', err);
      return { totalCredit: 0, activeCount: 0 };
    }
  };

  const refetch = useCallback(async (force = false) => {
    if (!force) {
      const cached = creditCacheManager.get(CREDIT_CACHE_KEYS.LEDGER_STATS, CREDIT_CACHE_TTL.LEDGER_STATS);
      if (cached) {
        setStats(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. อ่าน Master Ledger Config จาก settings/credit_config
      const configRef = doc(db, getCollectionPath('settings'), 'credit_config');
      const configSnap = await getDoc(configRef);

      let totalAllocated = 0;
      let systemPoolMax = 10000000;
      let status = 'SECURE';

      if (configSnap.exists()) {
        const ledger = configSnap.data().ledger || {};
        totalAllocated = ledger.totalAllocated === undefined ? 0 : Number(ledger.totalAllocated);
        systemPoolMax = ledger.systemPoolMax === undefined ? 10000000 : Number(ledger.systemPoolMax);
        status = ledger.status || 'SECURE';
      }

      // 2. ดึงยอดภาระหนี้สินจริงที่ผู้ใช้ถือครอง
      const userStats = await fetchRealUserStats();

      // 3. คำนวณความสอดคล้องทางบัญชี (Discrepancy & Safe Remaining Pool)
      const signedDiscrepancy = Math.round(totalAllocated - userStats.totalCredit);
      const discrepancy = Math.abs(signedDiscrepancy);
      const trueEffectiveLiability = Math.max(totalAllocated, userStats.totalCredit);
      const remainingPool = Math.max(0, systemPoolMax - trueEffectiveLiability);

      const computedStats = {
        totalUserCredits: userStats.totalCredit,
        systemLedgerBalance: totalAllocated,
        systemPoolMax: systemPoolMax,
        remainingPool: remainingPool,
        discrepancy: discrepancy,
        signedDiscrepancy: signedDiscrepancy,
        totalPartnersWithCredit: userStats.activeCount,
        ledgerStatus: status,
        lastUpdated: new Date()
      };

      setStats(computedStats);
      creditCacheManager.set(CREDIT_CACHE_KEYS.LEDGER_STATS, computedStats);
    } catch (err) {
      console.error('🔥 Error updating ledger stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch(false);
  }, [refetch]);

  return { stats, isLoading, error: null, refetch, setStats };
}