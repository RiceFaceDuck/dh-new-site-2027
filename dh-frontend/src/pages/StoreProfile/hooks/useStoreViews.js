import { useState, useEffect, useRef } from 'react';
import { resolveStoreViewMetrics, getBangkokDateKey } from 'dh-shared/src/utils/storeMetricsHelper';
import { trackStoreView } from '../../../firebase/marketingAnalyticsService';

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes (1,800,000 ms)

// Graceful in-memory fallback for Incognito / Private Browsing mode
const memoryLockStore = new Map();

const getStoredLock = (partnerId) => {
  if (!partnerId) return null;
  const storageKey = `dh_store_view_lock_${partnerId}`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const lock = JSON.parse(raw);
        if (Date.now() > lock.expiresAt) {
          localStorage.removeItem(storageKey);
          memoryLockStore.delete(storageKey);
          return null;
        }
        return lock;
      }
    }
  } catch {
    // Graceful fallback for Private Browsing / QuotaExceeded
  }

  // Fallback to in-memory map
  const memLock = memoryLockStore.get(storageKey);
  if (memLock) {
    if (Date.now() > memLock.expiresAt) {
      memoryLockStore.delete(storageKey);
      return null;
    }
    return memLock;
  }
  return null;
};

const setStoredLock = (partnerId, lockObj) => {
  if (!partnerId) return;
  const storageKey = `dh_store_view_lock_${partnerId}`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(storageKey, JSON.stringify(lockObj));
    }
  } catch {
    // LocalStorage quota or access denied fallback
  }
  memoryLockStore.set(storageKey, lockObj);
};

const _removeStoredLock = (partnerId) => {
  if (!partnerId) return;
  const storageKey = `dh_store_view_lock_${partnerId}`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // LocalStorage access denied fallback
  }
  memoryLockStore.delete(storageKey);
};

/**
 * Controller hook for store profile view tracking and multi-period metrics aggregation.
 * Clean Architecture & SRP: handles dwell-time gating, cross-tab lock sync, and anti-flicker reconciliation.
 * 
 * Invariants & Guarantees:
 * 1. Synchronous State Initialization: useState(() => resolveStoreViewMetrics(partner, initialLock))
 *    permanently eliminates 1-frame paint flicker (no 0 -> 1 flash).
 * 2. Monotonic Max Guard: UI display counters never drop on remote sync.
 * 3. Cross-Tab Session Sticky Lock: 30-min TTL lock shared via localStorage prevents repeat increments.
 * 4. Cooldown Persistence: 30-min lock persists until natural expiresAt TTL (no premature purge).
 * 5. MRC 1,000ms Dwell Time: Bounces < 1s do not trigger telemetry writes.
 * 
 * @param {Object} partner Store partner document
 * @returns {{ allTime: number, today: number, dateKey: string }}
 */
export const useStoreViews = (partner) => {
  const partnerId = partner?.id || partner?.userId;
  const initialLock = getStoredLock(partnerId);

  // Synchronous State Initialization: permanently eliminates 1-frame paint flicker
  const [metrics, setMetrics] = useState(() => {
    return resolveStoreViewMetrics(partner, initialLock);
  });

  const dwellTimerRef = useRef(null);
  const lastPartnerIdRef = useRef(partnerId);

  // Synchronize when partner prop changes (e.g. finished loading or auth state change)
  useEffect(() => {
    if (!partnerId) return;
    const currentLock = getStoredLock(partnerId);

    // Handle SPA navigation across different stores
    if (lastPartnerIdRef.current !== partnerId) {
      lastPartnerIdRef.current = partnerId;
      setMetrics(resolveStoreViewMetrics(partner, currentLock));
      return;
    }

    setMetrics((prev) => {
      const next = resolveStoreViewMetrics(partner, currentLock);
      // Monotonic Max Guard: numbers must never drop below what's currently rendered
      return {
        allTime: Math.max(prev.allTime, next.allTime),
        today: Math.max(prev.today, next.today),
        dateKey: next.dateKey
      };
    });

    // Note: The 30-minute lock persists until natural expiresAt TTL (no premature purge)
    // to protect against duplicate dwell triggers on revisit within the cooldown window.
  }, [
    partner?.id,
    partner?.userId,
    partner?.views?.allTime,
    partner?.views?.today,
    partner?.viewCount,
    partner?.viewsCount
  ]);

  // Dwell-Time Timer (1,000ms) with Cross-Tab Cooldown Guard & Anti-Fraud Defense in Depth
  useEffect(() => {
    if (!partnerId) return;
    const existingLock = getStoredLock(partnerId);
    let adCooldown = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        adCooldown = window.localStorage.getItem(`dh_ad_store_view_${partnerId}`);
      }
    } catch {
      // LocalStorage access denied / private browsing fallback
    }
    const isAdCooldownActive = adCooldown && (Date.now() - parseInt(adCooldown, 10)) < COOLDOWN_MS;

    // If active lock exists or anti-fraud cooldown is active (visited within 30 min or opened in another tab), skip immediately
    if (existingLock || isAdCooldownActive) {
      return;
    }

    dwellTimerRef.current = setTimeout(() => {
      const todayKey = getBangkokDateKey();
      setMetrics((prev) => {
        const optimisticAllTime = prev.allTime + 1;
        const optimisticToday = prev.today + 1;

        // Record Lock to localStorage for cross-tab sync
        const newLock = {
          timestamp: Date.now(),
          expiresAt: Date.now() + COOLDOWN_MS,
          dateKey: todayKey,
          targetViews: optimisticAllTime,
          targetToday: optimisticToday
        };

        setStoredLock(partnerId, newLock);

        // Queue view telemetry buffer (2-minute flush)
        trackStoreView(partnerId);

        return {
          allTime: optimisticAllTime,
          today: optimisticToday,
          dateKey: todayKey
        };
      });
    }, 1000);

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
    };
  }, [partnerId]);

  return metrics;
};

export default useStoreViews;
