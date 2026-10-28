/**
 * Catalog Checksum Service
 * High-performance deterministic dual-algorithm checksum calculation (FNV-1a 32-bit + DJB2 32-bit).
 * Single Responsibility: Generates authoritative catalog fingerprints to detect data drift with 0 reads.
 * Location: Management System/dh-backoffice-react/src/firebase/inventory/catalogChecksumService.js
 */

export function computeCatalogHash(catalog) {
  if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
    return 'empty_00000000';
  }

  const validItems = catalog.filter(Boolean);
  if (validItems.length === 0) {
    return 'empty_00000000';
  }

  const sorted = [...validItems].sort((a, b) =>
    String(a?.sku || a?.id || '').localeCompare(String(b?.sku || b?.id || ''))
  ).map(item =>
    `${item.sku || item.id || ''}:${Number(item.stockQuantity ?? 0)}:${Number(item.Price ?? item.price ?? item.wholesalePrice ?? 0)}:${Number(item.adjustmentHistory?.['30'] ?? 0)}:${item.updatedAt?.seconds || item.updatedAt || ''}`
  ).join('|');

  let h1 = 2166136261; // FNV-1a 32-bit offset basis
  let h2 = 5381;       // DJB2 hash seed

  for (let i = 0; i < sorted.length; i++) {
    const code = sorted.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 = ((h2 << 5) + h2) ^ code;
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `cat_${p1}${p2}_${catalog.length}`;
}

export const catalogChecksumService = {
  computeCatalogHash
};
