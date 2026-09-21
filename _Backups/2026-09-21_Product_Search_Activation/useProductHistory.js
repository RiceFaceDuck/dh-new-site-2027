import { useState, useEffect, useCallback } from 'react';
import { historyService } from '../../firebase/historyService';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export function useProductHistory(selectedProduct) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loadedSku, setLoadedSku] = useState(null);

  const isHistoryLoaded = Boolean(selectedProduct?.sku && loadedSku === selectedProduct.sku);

  const fetchHistoryLogs = useCallback(async () => {
    if (!selectedProduct || !selectedProduct.sku) {
      setHistoryLogs([]);
      setLoadedSku(null);
      return;
    }
    setLoadingHistory(true);
    try {
      const result = await historyService.getRecentLogs(30, null, 'ALL', 'ALL', selectedProduct.sku);
      let logs = result.logs || [];
      
      // --- Merge Billing Orders from Database (Supports past orders like DH-26-0013) ---
      try {
        const ordersRef = collection(db, getCollectionPath('orders'));
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
        const ordersSnap = await getDocs(ordersQuery);
        
        ordersSnap.forEach((docSnap) => {
          const order = docSnap.data();
          const matchingItems = (order.items || []).filter(item => item.sku === selectedProduct.sku);
          if (matchingItems.length > 0) {
            const totalQty = matchingItems.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);
            const orderIdStr = order.orderId || docSnap.id;
            
            // Avoid duplicate logs if already present in GAS logs
            const exists = logs.some(l => l.details?.reference === orderIdStr || (typeof l.details === 'string' && l.details.includes(orderIdStr)));
            if (!exists) {
              logs.push({
                id: `order-hist-${docSnap.id}`,
                action: 'SALE',
                details: {
                  type: 'ขายออก',
                  qtyChange: -totalQty,
                  reference: orderIdStr,
                  legacy_details: `ขายออกบิล ${orderIdStr} (${totalQty} ชิ้น)`
                },
                performedBy: order.creatorName || order.createdBy || 'Staff',
                timestamp: order.createdAt || { seconds: Math.floor(new Date(order.date || Date.now()).getTime() / 1000) },
                isLegacy: true
              });
            }
          }
        });
      } catch (err) {
        console.warn("Fetch historical orders for SKU warning:", err);
      }

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
      setLoadedSku(selectedProduct.sku);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedProduct]);

  // Reset logs when SKU changes
  useEffect(() => {
    if (!selectedProduct || selectedProduct.sku !== loadedSku) {
      setHistoryLogs([]);
    }
  }, [selectedProduct?.sku, loadedSku]);

  // Auto-fetch if user opens modal
  useEffect(() => {
    if (isHistoryModalOpen && selectedProduct?.sku && loadedSku !== selectedProduct.sku) {
      fetchHistoryLogs();
    }
  }, [isHistoryModalOpen, selectedProduct?.sku, loadedSku, fetchHistoryLogs]);

  const handleLoadHistory = useCallback(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  return {
    historyLogs,
    setHistoryLogs,
    loadingHistory,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isHistoryLoaded,
    handleLoadHistory
  };
}
