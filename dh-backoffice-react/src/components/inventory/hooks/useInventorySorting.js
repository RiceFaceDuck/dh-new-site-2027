import { useMemo } from 'react';

/**
 * Hook to handle multi-column inventory sorting with Thai locale collation support
 */
export default function useInventorySorting(products, sortConfig, salesPeriod) {
  const sortedProducts = useMemo(() => {
    if (!sortConfig?.key || !Array.isArray(products)) return products || [];

    return [...products].sort((a, b) => {
      let valA, valB;

      switch (sortConfig.key) {
        case 'Price':
          valA = Number(a.Price ?? a.price ?? a.wholesalePrice ?? 0);
          valB = Number(b.Price ?? b.price ?? b.wholesalePrice ?? 0);
          break;
        case 'retailPrice':
          valA = Number(a.retailPrice || 0);
          valB = Number(b.retailPrice || 0);
          break;
        case 'stock':
          valA = Number(a.stockQuantity || 0);
          valB = Number(b.stockQuantity || 0);
          break;
        case 'sales':
          valA = Number(a.salesHistory?.[salesPeriod] || 0);
          valB = Number(b.salesHistory?.[salesPeriod] || 0);
          break;
        case 'stockIn':
          valA = Number(a.stockInHistory?.[salesPeriod] || 0);
          valB = Number(b.stockInHistory?.[salesPeriod] || 0);
          break;
        case 'claim':
          valA = Number(a.claimHistory?.[salesPeriod] || 0);
          valB = Number(b.claimHistory?.[salesPeriod] || 0);
          break;
        case 'adjustment':
          valA = Number(a.adjustmentHistory?.[salesPeriod] || 0);
          valB = Number(b.adjustmentHistory?.[salesPeriod] || 0);
          break;
        case 'category':
          valA = String(a.category || '');
          valB = String(b.category || '');
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB, 'th') 
            : valB.localeCompare(valA, 'th');
        default:
          valA = 0;
          valB = 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sortConfig?.key, sortConfig?.direction, salesPeriod]);

  return { sortedProducts };
}
