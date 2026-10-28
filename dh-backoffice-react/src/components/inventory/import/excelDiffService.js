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
  const generalFields = ['category', 'brand', 'unit', 'bufferStock', 'warehouseLocation', 'shortDescription', 'fullDescription'];
  generalFields.forEach(f => {
    if (item[f] !== undefined && item[f] !== existing[f]) {
      changes.push({ field: f, old: existing[f], new: item[f] });
    }
  });

  return changes;
}

export const excelDiffService = {
  detectRowChanges
};
