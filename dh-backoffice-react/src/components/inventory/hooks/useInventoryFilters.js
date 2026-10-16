import { useState, useEffect, useMemo } from 'react';

/**
 * Hook to handle client-side product filtering by keyword, category, and SKU fallback
 */
export default function useInventoryFilters(sourceProducts, searchTerm, filterCategory, isFetchingAll = false) {
  const [fallbackProduct, setFallbackProduct] = useState(null);

  useEffect(() => {
    const fetchFallback = async () => {
      const safeTerm = typeof searchTerm === 'string' ? searchTerm.trim() : (searchTerm != null ? String(searchTerm).trim() : '');
      if (safeTerm && !isFetchingAll) {
        const term = safeTerm.toLowerCase();
        const foundInCache = sourceProducts.some(p => {
          const s = p.sku ? String(p.sku).toLowerCase() : '';
          return s === term || s.includes(term);
        });
        if (!foundInCache) {
          try {
            const { inventoryQueryService } = await import('../../../firebase/inventory/inventoryQueryService');
            const fbMatch = await inventoryQueryService.getProductBySku(safeTerm.toUpperCase());
            if (fbMatch) {
              setFallbackProduct(fbMatch);
            } else {
              setFallbackProduct(null);
            }
          } catch {
            setFallbackProduct(null);
          }
        } else {
          setFallbackProduct(null);
        }
      } else {
        setFallbackProduct(null);
      }
    };
    fetchFallback();
  }, [searchTerm, sourceProducts, isFetchingAll]);

  const filteredProducts = useMemo(() => {
    const term = (typeof searchTerm === 'string' ? searchTerm : (searchTerm != null ? String(searchTerm) : '')).trim().toLowerCase();
    const targetCat = (filterCategory || '').trim().toLowerCase();

    let list = sourceProducts.filter(p => {
      const getCategoryString = (cat) => {
        if (typeof cat === 'object' && cat !== null) {
          return (cat.name || cat.type || '').trim().toLowerCase();
        }
        return String(cat || '').trim().toLowerCase();
      };
      const productCat = getCategoryString(p.category);
      const productType = (p.type ? String(p.type) : '').trim().toLowerCase();

      const matchesSearch = !term || (() => {
        const sku = p.sku ? String(p.sku).toLowerCase() : '';
        const name = p.name ? String(p.name).toLowerCase() : '';
        const cat = productCat;
        const brand = p.brand ? String(p.brand).toLowerCase() : '';
        const model = p.model ? String(p.model).toLowerCase() : '';
        let tagMatch = false;
        if (p.tags) {
          if (Array.isArray(p.tags)) {
            tagMatch = p.tags.some(t => t && String(t).toLowerCase().includes(term));
          } else if (typeof p.tags === 'string') {
            tagMatch = p.tags.toLowerCase().includes(term);
          }
        }
        return sku.includes(term) || name.includes(term) || cat.includes(term) || brand.includes(term) || model.includes(term) || tagMatch;
      })();

      const matchesCategory = !filterCategory || filterCategory === 'All' || 
        (productCat && productCat === targetCat) || 
        (productType && productType === targetCat) ||
        (typeof p.category === 'object' && p.category !== null && (
          String(p.category.name || '').trim().toLowerCase() === targetCat ||
          String(p.category.type || '').trim().toLowerCase() === targetCat ||
          String(p.category.id || '').trim().toLowerCase() === targetCat
        )) ||
        p.category === filterCategory || p.type === filterCategory;

      return matchesSearch && matchesCategory;
    });

    if (fallbackProduct && !list.some(p => p.sku === fallbackProduct.sku)) {
      list = [fallbackProduct, ...list];
    }

    return list;
  }, [sourceProducts, searchTerm, filterCategory, fallbackProduct]);

  return { filteredProducts, fallbackProduct };
}
