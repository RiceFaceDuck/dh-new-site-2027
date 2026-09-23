import { useState, useEffect, useCallback, useRef, useSyncExternalStore, useMemo } from 'react';
import { bigSellerQueryService } from '../../../firebase/bigseller';
import { gasStockService } from '../../../firebase/gasStockService';
import { syncSnapshotService } from '../../../firebase/bigseller/syncSnapshotService';
import { db } from '../../../firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// --- Centralized External Store State (Singleton) ---
const initialState = {
  changes: null,
  rawChanges: null,
  isCalculating: true,
  lastSyncTime: new Date(),
  realOrders: [],
  realClaims: [],
  realOrdersLoaded: false,
  realClaimsLoaded: false,
  lastResetDate: null,
  resetTimeKey: null,
  pendingCount: 0,
  isFlushing: false,
  latestSnapshot: null,
  latestFullExport: null,
  isInitialized: false
};

let storeState = { ...initialState };
const listeners = new Set();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.error("useGenerateSyncStore listener error:", err);
    }
  }
}

export function subscribeStore(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoreState() {
  return storeState;
}

export function setStoreState(updater) {
  const next = typeof updater === 'function' ? updater(storeState) : updater;
  if (next) {
    storeState = { ...storeState, ...next };
    notifyListeners();
  }
}

export function resetStore() {
  storeState = { ...initialState, lastSyncTime: new Date() };
  notifyListeners();
}

export const setLatestFullExport = (exportData) => setStoreState({ latestFullExport: exportData });

export function useGenerateSyncStore(selector = (s) => s, equalityFn = Object.is) {
  const lastStateRef = useRef(null);
  const lastSelectedRef = useRef(null);

  const getSnapshot = useCallback(() => {
    const currentState = getStoreState();
    if (lastStateRef.current === currentState && lastSelectedRef.current !== null) {
      return lastSelectedRef.current;
    }
    const selected = typeof selector === 'function' ? selector(currentState) : currentState;
    if (lastSelectedRef.current !== null && equalityFn(lastSelectedRef.current, selected)) {
      return lastSelectedRef.current;
    }
    lastStateRef.current = currentState;
    lastSelectedRef.current = selected;
    return selected;
  }, [selector, equalityFn]);

  return useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);
}

useGenerateSyncStore.getState = getStoreState;
useGenerateSyncStore.setState = setStoreState;
useGenerateSyncStore.subscribe = subscribeStore;
useGenerateSyncStore.resetStore = resetStore;

// Lifecycle guards
let isInitializing = false;
let activeLayoutMountCount = 0;
let unsubscribePendingChanges = null;
let inFlightFetchPromise = null;
let storeEpoch = 0;

export function cleanupListeners() {
  storeEpoch++;
  inFlightFetchPromise = null;
  isInitializing = false;
}

// Global Fetch Changes Action
export async function fetchChanges() {
  if (inFlightFetchPromise) return inFlightFetchPromise;
  const currentEpoch = storeEpoch;
  setStoreState({ isCalculating: true });

  inFlightFetchPromise = (async () => {
    try {
      const result = await bigSellerQueryService.calculateChanges();
      
      // Check Firestore sync_pending_changes to merge any staged changes
      try {
        const pendingRef = doc(db, getCollectionPath('catalogs'), 'sync_pending_changes');
        const pendingSnap = await getDoc(pendingRef);
        if (pendingSnap.exists() && pendingSnap.data().changes) {
          const staged = pendingSnap.data().changes;
          if (result) {
            const decSet = new Set((result.decreased || []).map(x => x.sku));
            (staged.decreased || []).forEach(x => {
              if (!decSet.has(x.sku)) result.decreased.push(x);
            });
            const incSet = new Set((result.increased || []).map(x => x.sku));
            (staged.increased || []).forEach(x => {
              if (!incSet.has(x.sku)) result.increased.push(x);
            });
          }
        }
      } catch (err) {
        console.warn("Could not read sync_pending_changes:", err);
      }

      if (currentEpoch === storeEpoch) {
        const safeChanges = result || { increased: [], decreased: [], priceChanged: [], otherChanged: [] };
        setStoreState({
          rawChanges: safeChanges,
          changes: safeChanges,
          lastResetDate: safeChanges?.lastResetDate || null,
          resetTimeKey: safeChanges?.lastResetDate ? new Date(safeChanges.lastResetDate).getTime() : null,
          lastSyncTime: new Date(),
          isCalculating: false,
          isInitialized: true
        });
      }
      return result;
    } catch (err) {
      console.error("Failed to calculate changes", err);
      if (currentEpoch === storeEpoch) {
        // Defensive fallback: Ensure changes is not null so UI does not collapse
        const fallbackChanges = storeState.changes || { increased: [], decreased: [], priceChanged: [], otherChanged: [] };
        setStoreState({
          changes: fallbackChanges,
          isCalculating: false,
          isInitialized: true
        });
      }
      throw err;
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  return inFlightFetchPromise;
}

// Global Fetch Latest Snapshot Action
export async function fetchLatestSnapshot() {
  const currentEpoch = storeEpoch;
  try {
    const snap = await syncSnapshotService.getLatestSnapshot();
    if (currentEpoch === storeEpoch) {
      setStoreState({ latestSnapshot: snap });
    }
    return snap;
  } catch (err) {
    console.error("Failed to fetch latest snapshot", err);
    throw err;
  }
}

// Global Manual Reset Baseline Action
export async function handleManualResetBaseline() {
  const currentEpoch = storeEpoch;
  setStoreState({ isCalculating: true });
  try {
    const result = await bigSellerQueryService.manualResetBaseline();
    if (currentEpoch === storeEpoch) {
      const safeChanges = result || { increased: [], decreased: [], priceChanged: [], otherChanged: [] };
      setStoreState({
        rawChanges: safeChanges,
        changes: safeChanges,
        lastResetDate: safeChanges?.lastResetDate || null,
        resetTimeKey: safeChanges?.lastResetDate ? new Date(safeChanges.lastResetDate).getTime() : null,
        lastSyncTime: new Date(),
        isCalculating: false,
        isInitialized: true
      });
    }
    return result;
  } catch (err) {
    console.error("Failed to reset baseline", err);
    if (currentEpoch === storeEpoch) {
      setStoreState({ isCalculating: false });
    }
    throw err;
  }
}

// --- Main Hook (Backwards Compatible + Centralized Store) ---
export default function useGenerateSync() {
  const state = useGenerateSyncStore();
  const {
    changes,
    rawChanges,
    isCalculating,
    lastSyncTime,
    pendingCount,
    isFlushing,
    latestSnapshot,
    latestFullExport
  } = state;

  // Listen to gasStockService queue
  useEffect(() => {
    const unsubscribe = gasStockService.subscribe((count, flushing) => {
      setStoreState({
        pendingCount: count,
        isFlushing: flushing
      });
    });
    setStoreState({ pendingCount: gasStockService.getPendingCount() });
    return unsubscribe;
  }, []);

  // Real-time listener on catalogs/sync_pending_changes
  useEffect(() => {
    activeLayoutMountCount++;
    if (activeLayoutMountCount === 1) {
      let debounceTimer = null;
      let isFirstEvent = true;

      const triggerDebouncedFetch = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchChanges();
        }, 1200);
      };

      try {
        const pendingDocRef = doc(db, getCollectionPath('catalogs'), 'sync_pending_changes');
        const unsub = onSnapshot(pendingDocRef, () => {
          if (isFirstEvent) {
            isFirstEvent = false;
            return;
          }
          triggerDebouncedFetch();
        }, (err) => console.warn("sync_pending_changes listener warning:", err));

        unsubscribePendingChanges = () => {
          clearTimeout(debounceTimer);
          unsub();
        };
      } catch (err) {
        console.warn("Failed to attach sync_pending_changes listener:", err);
      }
    }

    return () => {
      activeLayoutMountCount--;
      if (activeLayoutMountCount <= 0) {
        activeLayoutMountCount = 0;
        if (unsubscribePendingChanges) {
          unsubscribePendingChanges();
          unsubscribePendingChanges = null;
        }
      }
    };
  }, []);

  // Initial fetch if not already initialized
  useEffect(() => {
    if (!getStoreState().isInitialized && !isInitializing) {
      isInitializing = true;
      const currentEpoch = storeEpoch;
      Promise.all([fetchChanges(), fetchLatestSnapshot()]).finally(() => {
        if (currentEpoch === storeEpoch) {
          isInitializing = false;
        }
      });
    }
  }, []);

  return {
    changes: changes || rawChanges || { increased: [], decreased: [], priceChanged: [], otherChanged: [] },
    rawChanges,
    isCalculating,
    lastSyncTime,
    pendingCount,
    isFlushing,
    latestSnapshot,
    latestFullExport,
    setLatestFullExport,
    fetchChanges,
    handleManualReset: handleManualResetBaseline,
    fetchLatestSnapshot
  };
}
