import { useState, useEffect, useCallback } from 'react';
import { bigSellerQueryService } from '../../../firebase/bigseller';
import { gasStockService } from '../../../firebase/gasStockService';

export default function useGenerateSync() {
  const [changes, setChanges] = useState(null);
  const [isCalculating, setIsCalculating] = useState(true);

  // Sync settings and status
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(localStorage.getItem('bigseller_autosync') === 'true');
  const [syncInterval, setSyncInterval] = useState(Number(localStorage.getItem('bigseller_sync_interval')) || 15);
  const [pendingCount, setPendingCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);

  // Listen to gasStockService queue
  useEffect(() => {
    const unsubscribe = gasStockService.subscribe((count, flushing) => {
      setPendingCount(count);
      setIsFlushing(flushing);
    });
    setPendingCount(gasStockService.getPendingCount());
    return unsubscribe;
  }, []);

  // Fetch changes
  const fetchChanges = useCallback(async () => {
    setIsCalculating(true);
    try {
      const result = await bigSellerQueryService.calculateChanges();
      

      setChanges(result);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to calculate changes", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Auto refresh interval
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const intervalId = setInterval(() => {
      fetchChanges();
    }, syncInterval * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, syncInterval, fetchChanges]);

  // Initial fetch
  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  const handleManualReset = useCallback(async () => {
    setIsCalculating(true);
    try {
      const result = await bigSellerQueryService.manualResetBaseline();
      setChanges(result);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to reset baseline", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const updateAutoSync = (enabled) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem('bigseller_autosync', enabled);
  };

  const updateSyncInterval = (interval) => {
    setSyncInterval(interval);
    localStorage.setItem('bigseller_sync_interval', interval);
  };

  return {
    changes,
    isCalculating,
    lastSyncTime,
    autoSyncEnabled,
    updateAutoSync,
    syncInterval,
    updateSyncInterval,
    pendingCount,
    isFlushing,
    fetchChanges,
    handleManualReset
  };
}
