/**
 * Excel Import Diff & Change Detection Service
 * Dedicated helper to compare mapped import items against existing inventory records.
 * Location: Management System/dh-backoffice-react/src/components/inventory/import/excelDiffService.js
 */

export function detectRowChanges(item, existing) {
  if (!existing) return [];
  const changes = [];

  if (item.name !== undefined && item.name !== existing.name) {
    changes.push({ field: 'Name', old: existing.name, new: item.name });
  }
  if (item.Price !== undefined && item.Price !== existing.Price) {
    changes.push({ field: 'Price', old: existing.Price, new: item.Price });
  }
  if (item.retailPrice !== undefined && item.retailPrice !== existing.retailPrice) {
    changes.push({ field: 'RetailPrice', old: existing.retailPrice, new: item.retailPrice });
  }

  if (item.stockQuantity !== undefined && item.stockQuantity !== existing.stockQuantity) {
    if (item._addStockAmount !== undefined) {
      changes.push({ 
        field: 'Stock', 
        old: existing.stockQuantity, 
        new: item.stockQuantity, 
        type: 'add', 
        added: item._addStockAmount 
      });
    } else {
      const diff = (item._adjustmentDiff !== undefined) 
        ? item._adjustmentDiff 
        : (item.stockQuantity - (existing.stockQuantity || 0));
      changes.push({ 
        field: 'Stock', 
        old: existing.stockQuantity, 
        new: item.stockQuantity, 
        type: 'adjustment', 
        diff 
      });
    }
  }

  // Detect general attribute changes
  const generalFields = ['category', 'brand', 'unit', 'bufferStock', 'warehouseLocation', 'shortDescription'];
  generalFields.forEach(f => {
    if (item[f] !== undefined) {
      // 🛡️ Legacy Shard Cache Guard:
      // If existing item came from a cache/shard that did not store 'unit', don't flag phantom change
      if (f === 'unit' && existing.unit === undefined) {
        return;
      }

      if (f === 'bufferStock') {
        const numItem = Number(item.bufferStock);
        const numExist = Number(existing.bufferStock);
        if (!isNaN(numItem) && numItem !== numExist) {
          changes.push({ field: f, old: existing[f], new: item[f] });
        }
      } else if (item[f] !== existing[f]) {
        changes.push({ field: f, old: existing[f], new: item[f] });
      }
    }
  });

  // 🛡️ Full Description Phantom Change Guard:
  // Shards intentionally omit fullDescription to prevent hitting Firestore 1MB doc limits.
  // Only detect diff if existing record explicitly contains fullDescription.
  if (item.fullDescription !== undefined && existing.fullDescription !== undefined) {
    if (String(item.fullDescription).trim() !== String(existing.fullDescription).trim()) {
      changes.push({ field: 'fullDescription', old: existing.fullDescription, new: item.fullDescription });
    }
  }

  return changes;
}

export const excelDiffService = {
  detectRowChanges
};
