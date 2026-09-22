/**
 * 🔒 Centralized Cache Manager for Credit Core Engine
 * Manages in-memory and sessionStorage caches to optimize Firestore reads and eliminate quota spikes.
 */

const memoryCache = new Map();

export const CREDIT_CACHE_KEYS = {
  PARTNER_CREDITS: 'dh_cache_credit_partners_v1',
  TRANSACTION_HISTORY: 'dh_cache_credit_history_v1',
  LEDGER_STATS: 'dh_cache_credit_ledger_stats_v1',
  CREDIT_CONFIG: 'dh_cache_credit_config_v1'
};

export const CREDIT_CACHE_TTL = {
  PARTNER_CREDITS: 5 * 60 * 1000,     // 5 minutes
  TRANSACTION_HISTORY: 3 * 60 * 1000, // 3 minutes
  LEDGER_STATS: 5 * 60 * 1000,        // 5 minutes
  CREDIT_CONFIG: 10 * 60 * 1000       // 10 minutes
};

export const creditCacheManager = {
  get: (key, ttl = CREDIT_CACHE_TTL[key] || 5 * 60 * 1000) => {
    const now = Date.now();
    const mem = memoryCache.get(key);
    if (mem && (now - mem.timestamp < ttl)) {
      return mem.data;
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (now - parsed.timestamp < ttl)) {
            memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp });
            return parsed.data;
          }
        }
      } catch (e) {
        // Ignore JSON parse errors from corrupted storage
      }
    }
    return null;
  },

  set: (key, data) => {
    const now = Date.now();
    memoryCache.set(key, { data, timestamp: now });
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: now }));
      } catch (e) {
        console.warn(`[creditCacheManager] SessionStorage write error for ${key}:`, e);
      }
    }
  },

  invalidate: (key) => {
    memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {}
    }
  },

  invalidateAll: () => {
    memoryCache.clear();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        Object.values(CREDIT_CACHE_KEYS).forEach(k => sessionStorage.removeItem(k));
      } catch (e) {}
    }
  },

  optimisticUpdateTransaction: ({ uid, amount, type, newBalance, txRecord }) => {
    const cachedPartners = creditCacheManager.get(CREDIT_CACHE_KEYS.PARTNER_CREDITS, CREDIT_CACHE_TTL.PARTNER_CREDITS);
    if (cachedPartners && Array.isArray(cachedPartners)) {
      const updated = cachedPartners.map(p => {
        if (p.id === uid) {
          const bal = newBalance !== undefined 
            ? newBalance 
            : (type === 'add' ? p.balance + amount : p.balance - amount);
          return { ...p, balance: bal };
        }
        return p;
      });
      creditCacheManager.set(CREDIT_CACHE_KEYS.PARTNER_CREDITS, updated);
    }
    const cachedHistory = creditCacheManager.get(CREDIT_CACHE_KEYS.TRANSACTION_HISTORY, CREDIT_CACHE_TTL.TRANSACTION_HISTORY);
    if (cachedHistory && Array.isArray(cachedHistory) && txRecord) {
      const updated = [txRecord, ...cachedHistory.slice(0, 99)];
      creditCacheManager.set(CREDIT_CACHE_KEYS.TRANSACTION_HISTORY, updated);
    }
    creditCacheManager.invalidate(CREDIT_CACHE_KEYS.LEDGER_STATS);
  }
};
