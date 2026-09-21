import { useState, useEffect, useCallback } from 'react';
import { skuHistoryService } from '../../firebase/skuHistoryService';

export function useProductHistory(selectedProduct) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loadedSku, setLoadedSku] = useState(null);

  const isHistoryLoaded = Boolean(selectedProduct?.sku && loadedSku === selectedProduct.sku);

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!selectedProduct || !selectedProduct.sku) {
      setHistoryLogs([]);
      setLoadedSku(null);
      return;
    }

    setLoadingHistory(true);
    try {
      const res = await skuHistoryService.fetchSkuHistory(selectedProduct, { forceRefresh });
      const logs = res?.logs || (Array.isArray(res) ? res : []);
      setHistoryLogs(logs);
      setLoadedSku(selectedProduct.sku);
    } catch (error) {
      console.error('Error fetching SKU history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedProduct]);

  // Reset logs when SKU changes (ensures on-demand card is shown for new SKU)
  useEffect(() => {
    if (!selectedProduct || selectedProduct.sku !== loadedSku) {
      setHistoryLogs([]);
    }
  }, [selectedProduct, loadedSku]);

  // Auto-fetch ONLY if user explicitly opened the History Modal and history is not loaded yet
  useEffect(() => {
    if (isHistoryModalOpen && selectedProduct?.sku && loadedSku !== selectedProduct.sku) {
      fetchHistory(false);
    }
  }, [isHistoryModalOpen, selectedProduct, loadedSku, fetchHistory]);

  // Triggered on-demand when user clicks "กดเพื่อดูประวัติ"
  const handleLoadHistory = useCallback(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  // Manual refresh bypassing 10-minute cache
  const refetchHistory = useCallback(async () => {
    if (selectedProduct?.sku) {
      await skuHistoryService.clearSkuHistoryCache(selectedProduct.sku);
      await fetchHistory(true);
    }
  }, [selectedProduct, fetchHistory]);

  return {
    historyLogs,
    setHistoryLogs,
    loadingHistory,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isHistoryLoaded,
    handleLoadHistory,
    refetchHistory
  };
}

export default useProductHistory;
