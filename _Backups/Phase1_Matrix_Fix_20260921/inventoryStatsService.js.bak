import { get, set, del } from 'idb-keyval';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { 
  IDB_STATS_CACHE_KEY, 
  IDB_STATS_MAP_KEY, 
  IDB_STATS_SNAPSHOT_KEY, 
  IDB_CATALOG_KEY, 
  IDB_FULL_CACHE_KEY,
  parseStatsSnapshot 
} from './migrationService';

/**
 * Purges and refreshes IndexedDB stats caches (IDB_STATS_CACHE_KEY, IDB_STATS_MAP_KEY)
 * and fetches fresh stats from Firestore snapshot document.
 * Returns the fresh stats map.
 */
export const recalculateDailyStats = async () => {
  try {
    // 1. Fetch fresh stats snapshot from Firestore FIRST
    const snapshotRef = doc(db, getCollectionPath('catalogs'), 'inventory_stats_snapshot');
    const snap = await getDoc(snapshotRef);

    if (!snap || !snap.exists()) {
      throw new Error('Snapshot document "inventory_stats_snapshot" not found in Firestore');
    }

    const rawData = snap.data();
    const parsed = parseStatsSnapshot(rawData);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Failed to parse inventory_stats_snapshot data');
    }

    // 2. Only upon successful Firestore snapshot fetch & parse, clear old caches and update IndexedDB
    await Promise.all([
      del(IDB_STATS_CACHE_KEY).catch(() => null),
      del(IDB_STATS_MAP_KEY).catch(() => null),
      del(IDB_STATS_SNAPSHOT_KEY).catch(() => null),
      del('inventory_stats_cache').catch(() => null),
      del('inventory_stats_map').catch(() => null),
      del('inventory_stats_snapshot').catch(() => null)
    ]);

    await Promise.all([
      set(IDB_STATS_SNAPSHOT_KEY, rawData).catch(() => null),
      set(IDB_STATS_CACHE_KEY, parsed).catch(() => null),
      set(IDB_STATS_MAP_KEY, parsed).catch(() => null)
    ]);

    return parsed;
  } catch (error) {
    console.error("⚠️ [inventoryStatsService] Error recalculating daily stats:", error);
    throw error;
  }
};

export const inventoryStatsService = {
  recalculateDailyStats,
  recalculateInventoryStats: recalculateDailyStats,
  /**
   * Fetches 5-dimension stats (stockIn, sales, claim, adjustment) for given products & salesPeriod.
   * Prioritizes IndexedDB snapshot cache (0ms / Zero Firestore Reads).
   */
  fetchProductStats: async (products = [], salesPeriod = '30') => {
    if (!products || products.length === 0) return {};

    const statsMap = {};
    const skuLookup = {};

    products.forEach(p => {
      if (p.sku) {
        const upperSku = String(p.sku).trim().toUpperCase();
        statsMap[p.sku] = { stockIn: 0, sales: 0, claim: 0, adjustment: 0 };
        skuLookup[upperSku] = p.sku;
      }
    });

    try {
      const periodKey = String(salesPeriod);

      // 1. Try reading dedicated normalized stats cache
      let normalizedStatsMap = await get(IDB_STATS_CACHE_KEY).catch(() => null);
      if (!normalizedStatsMap) {
        normalizedStatsMap = await get(IDB_STATS_MAP_KEY).catch(() => null);
      }

      // 2. If not found, try reading raw snapshot doc from IDB and parse it
      if (!normalizedStatsMap) {
        const snapshotRaw = await get(IDB_STATS_SNAPSHOT_KEY).catch(() => null);
        if (snapshotRaw) {
          normalizedStatsMap = parseStatsSnapshot(snapshotRaw);
        }
      }

      if (normalizedStatsMap && typeof normalizedStatsMap === 'object') {
        for (const [skuKey, pStats] of Object.entries(normalizedStatsMap)) {
          const matchedSku = skuLookup[skuKey];
          if (matchedSku && statsMap[matchedSku]) {
            const sIn = pStats.stockInHistory?.[periodKey] ?? pStats.stockIn?.[periodKey] ?? 0;
            const sSales = pStats.salesHistory?.[periodKey] ?? pStats.sales?.[periodKey] ?? 0;
            const sClaim = pStats.claimHistory?.[periodKey] ?? pStats.claim?.[periodKey] ?? 0;
            const sAdj = pStats.adjustmentHistory?.[periodKey] ?? pStats.adjustment?.[periodKey] ?? 0;

            statsMap[matchedSku].stockIn = Number(sIn);
            statsMap[matchedSku].sales = Number(sSales);
            statsMap[matchedSku].claim = Number(sClaim);
            statsMap[matchedSku].adjustment = Number(sAdj);
          }
        }
        return statsMap;
      }

      // 3. Fallback: Read from catalog products cache (IDB_CATALOG_KEY or IDB_FULL_CACHE_KEY)
      const cachedCatalog = (await get(IDB_CATALOG_KEY).catch(() => null)) || 
                            (await get(IDB_FULL_CACHE_KEY).catch(() => null));

      if (Array.isArray(cachedCatalog)) {
        cachedCatalog.forEach(item => {
          const itemSku = item.sku || item.id;
          if (itemSku) {
            const matchedSkuKey = skuLookup[String(itemSku).trim().toUpperCase()];
            if (matchedSkuKey && statsMap[matchedSkuKey]) {
              const sIn = item.stockInHistory?.[periodKey] ?? (periodKey === '30' ? item.stockIn30D : 0) ?? 0;
              const sSales = item.salesHistory?.[periodKey] ?? (periodKey === '30' ? item.sales30D : 0) ?? 0;
              const sClaim = item.claimHistory?.[periodKey] ?? (periodKey === '30' ? item.claims30D : 0) ?? 0;
              const sAdj = item.adjustmentHistory?.[periodKey] ?? (periodKey === '30' ? item.adjustment30D : 0) ?? 0;

              statsMap[matchedSkuKey].stockIn = Number(sIn);
              statsMap[matchedSkuKey].sales = Number(sSales);
              statsMap[matchedSkuKey].claim = Number(sClaim);
              statsMap[matchedSkuKey].adjustment = Number(sAdj);
            }
          }
        });
      }
    } catch (error) {
      console.warn("⚠️ Error fetching product stats from cache:", error);
    }

    return statsMap;
  }
};

export { parseStatsSnapshot };
