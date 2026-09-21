/**
 * Migration Service - IDB Cache Key Constants & Snapshot Parser
 * Provides IndexedDB cache key constants and snapshot parsing for inventory stats.
 */

// IDB Cache Keys for inventory stats system
export const IDB_STATS_CACHE_KEY = 'dh_inv_stats_cache';
export const IDB_STATS_MAP_KEY = 'dh_inv_stats_map';
export const IDB_STATS_SNAPSHOT_KEY = 'dh_inv_stats_snapshot';
export const IDB_CATALOG_KEY = 'dh_catalog_cache';
export const IDB_FULL_CACHE_KEY = 'dh_inv_full_cache';

const DEFAULT_PERIODS = ['7', '30', '90', '365'];
const PERIODS_21 = ['30', '60', '90', '180', '365'];
const PERIODS_25 = ['7', '30', '60', '90', '180', '365'];

/**
 * Parses and unpacks a stats snapshot from Firestore or IDB cache.
 * Fully decodes compact matrix arrays (17 numbers) and polymorphic structures.
 * @param {any} raw - Raw value from Firestore or IDB
 * @returns {object} Unpacked map keyed by uppercase SKU
 */
export function parseStatsSnapshot(raw) {
  if (!raw) return {};
  try {
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch { return {}; }
    }
    if (!parsed || typeof parsed !== 'object') return {};

    const result = {};
    const periods = Array.isArray(parsed.periods) && parsed.periods.length > 0 
      ? parsed.periods.map(String) 
      : DEFAULT_PERIODS;

    const sourceMap = parsed.statsBySku || parsed.statsMap || parsed.items || parsed.products || parsed;
    if (!sourceMap || typeof sourceMap !== 'object') return {};

    for (let [skuKey, val] of Object.entries(sourceMap)) {
      if (!skuKey || !val) continue;
      const upperSku = String(skuKey).trim().toUpperCase();
      if (!upperSku) continue;

      // 1. Compact Array Format (17, 21, or 25 numbers)
      if (Array.isArray(val)) {
        let activePeriods = periods;
        if (!parsed.periods) {
          if (val.length === 21) activePeriods = PERIODS_21;
          else if (val.length === 25) activePeriods = PERIODS_25;
          else if (val.length >= 17) activePeriods = DEFAULT_PERIODS;
        }

        const plen = activePeriods.length;
        const sIn = {}, sSales = {}, sClaim = {}, sAdj = {};

        activePeriods.forEach((p, idx) => {
          sIn[p] = Number(val[idx] ?? 0);
          sSales[p] = Number(val[idx + plen] ?? 0);
          sClaim[p] = Number(val[idx + plen * 2] ?? 0);
          sAdj[p] = Number(val[idx + plen * 3] ?? 0);
        });

        result[upperSku] = {
          sku: upperSku,
          stockInHistory: sIn,
          salesHistory: sSales,
          claimHistory: sClaim,
          adjustmentHistory: sAdj,
          stockIn: sIn,
          sales: sSales,
          claim: sClaim,
          adjustment: sAdj,
          stockQuantity: Number(val[plen * 4] ?? val.stockQuantity ?? 0),
          sales30D: Number(sSales['30'] ?? 0),
          claims30D: Number(sClaim['30'] ?? 0),
          stockIn30D: Number(sIn['30'] ?? 0),
          adjustment30D: Number(sAdj['30'] ?? 0)
        };
        continue;
      }

      // 2. Object Format
      if (typeof val === 'object') {
        const sInRaw = val.stockInHistory || val.stockIn || {};
        const sSalesRaw = val.salesHistory || val.sales || {};
        const sClaimRaw = val.claimHistory || val.claims || val.claim || {};
        const sAdjRaw = val.adjustmentHistory || val.adjustments || val.adjustment || {};

        const sIn = {}, sSales = {}, sClaim = {}, sAdj = {};
        periods.forEach(p => {
          sIn[p] = Number(sInRaw[p] ?? sInRaw[String(p)] ?? (p === '30' ? (val.stockIn30D ?? val.stockIn30 ?? 0) : 0) ?? 0);
          sSales[p] = Number(sSalesRaw[p] ?? sSalesRaw[String(p)] ?? (p === '30' ? (val.sales30D ?? val.sales30 ?? 0) : 0) ?? 0);
          sClaim[p] = Number(sClaimRaw[p] ?? sClaimRaw[String(p)] ?? (p === '30' ? (val.claims30D ?? val.claim30 ?? 0) : 0) ?? 0);
          sAdj[p] = Number(sAdjRaw[p] ?? sAdjRaw[String(p)] ?? (p === '30' ? (val.adjustment30D ?? val.adjustment30 ?? 0) : 0) ?? 0);
        });

        result[upperSku] = {
          sku: upperSku,
          stockInHistory: sIn,
          salesHistory: sSales,
          claimHistory: sClaim,
          adjustmentHistory: sAdj,
          stockIn: sIn,
          sales: sSales,
          claim: sClaim,
          adjustment: sAdj,
          stockQuantity: Number(val.stockQuantity ?? val.stock ?? 0),
          sales30D: Number(sSales['30'] ?? 0),
          claims30D: Number(sClaim['30'] ?? 0),
          stockIn30D: Number(sIn['30'] ?? 0),
          adjustment30D: Number(sAdj['30'] ?? 0)
        };
      }
    }

    return result;
  } catch (error) {
    console.warn("⚠️ [migrationService] Error parsing stats snapshot:", error);
    return {};
  }
}

