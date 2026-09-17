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

/**
 * Parses a stats snapshot from IDB cache.
 * @param {any} raw - Raw value from IDB
 * @returns {object|null} Parsed snapshot or null if invalid
 */
export function parseStatsSnapshot(raw) {
  if (!raw) return null;
  try {
    if (typeof raw === 'string') return JSON.parse(raw);
    if (typeof raw === 'object') return raw;
    return null;
  } catch {
    return null;
  }
}
