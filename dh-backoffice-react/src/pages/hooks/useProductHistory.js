import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { historyService } from '../../firebase/historyService';

export function useProductHistory(selectedProduct) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetchHistoryLogs = async () => {
      setLoadingHistory(true);
      try {
        const result = await historyService.getRecentLogs(30, null, 'ALL', 'ALL', selectedProduct.sku);
        let logs = result.logs || [];
        
        // --- Merge Legacy Internal Notes ---
        if (selectedProduct.comment && typeof selectedProduct.comment === 'string') {
          logs.push({
            id: 'legacy-string',
            action: 'NOTE',
            details: selectedProduct.comment,
            performedBy: 'Legacy System',
            timestamp: { seconds: 0 },
            isLegacy: true
          });
        }
        
        if (Array.isArray(selectedProduct.internalComments)) {
          selectedProduct.internalComments.forEach((c, idx) => {
            logs.push({
              id: `legacy-arr-${idx}`,
              action: 'NOTE',
              details: c.text,
              performedBy: c.uid || 'Staff',
              timestamp: c.timestamp ? { seconds: Math.floor(new Date(c.timestamp).getTime() / 1000) } : { seconds: 0 },
              isLegacy: true
            });
          });
        }

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
    setHistoryLogs,
    loadingHistory,
    isHistoryModalOpen,
    setIsHistoryModalOpen
  };
}
