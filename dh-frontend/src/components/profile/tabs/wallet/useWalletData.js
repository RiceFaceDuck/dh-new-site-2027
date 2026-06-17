import { useState, useEffect } from 'react';
import { getCreditHistory } from '../../../../firebase/creditService';
import { getWalletHistory } from '../../../../firebase/walletService';

export const useWalletData = (user) => {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!user?.uid) return;
      setLoadingHistory(true);
      try {
        const creditData = await getCreditHistory(user.uid);
        const creditLogs = Array.isArray(creditData) ? creditData : (creditData?.logs || []);

        const walletData = await getWalletHistory(user.uid);
        const walletLogs = Array.isArray(walletData) ? walletData : (walletData?.logs || []);

        if (isMounted) {
          const combinedLogs = [...creditLogs, ...walletLogs].sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
            return timeB - timeA;
          });
          setHistoryLogs(combinedLogs);
        }
      } catch (error) {
        console.error("❌ Error fetching history:", error);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    
    fetchHistory();
    return () => { isMounted = false; };
  }, [user]);

  return { historyLogs, loadingHistory };
};
