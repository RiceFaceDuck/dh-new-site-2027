import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

export function useProductHistory(selectedProduct) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetchHistoryLogs = async () => {
      setLoadingHistory(true);
      try {
        const qTarget = query(collection(db, 'history_logs'), where('targetId', '==', selectedProduct.sku), limit(20));
        const snap = await getDocs(qTarget);
        let logs = snap.docs.map(d => ({id: d.id, ...d.data()}));
        logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); 
        setHistoryLogs(logs);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistoryLogs();
  }, [selectedProduct?.sku]);

  return {
    historyLogs,
    loadingHistory,
    isHistoryModalOpen,
    setIsHistoryModalOpen
  };
}
