import { get } from 'idb-keyval';
import { 
  IDB_STATS_CACHE_KEY, 
  IDB_STATS_MAP_KEY, 
  IDB_STATS_SNAPSHOT_KEY, 
  IDB_CATALOG_KEY, 
  IDB_FULL_CACHE_KEY,
  parseStatsSnapshot 
} from './migrationService';

export const inventoryStatsService = {
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
