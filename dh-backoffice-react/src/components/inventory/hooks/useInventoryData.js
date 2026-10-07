import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../firebase/inventoryService';
import { categoryService } from '../../../firebase/categoryService';
import { catalogHydrationService } from '../../../firebase/catalogHydrationService';

export default function useInventoryData(PAGE_LIMIT = 50) {
  const queryClient = useQueryClient();
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { data, isLoading: loading, refetch: fetchInitialProducts } = useQuery({
    queryKey: ['inventoryInitial', PAGE_LIMIT],
    queryFn: async () => {
      // 🚀 Zero-Read Optimization: Hydrate catalog from 3-Tier Cache (0-8 Reads for all 2,412 items)
      // Eliminates 50 redundant direct collection reads on cold start!
      const [settingsResult, catalogResult, categoriesResult] = await Promise.all([
        inventoryService.getInventorySettings(),
        catalogHydrationService.hydrateCatalog().catch(() => ({ products: [] })),
        categoryService.getAllCategories()
      ]);

      let rawProducts = catalogResult?.products || [];
      // Graceful Fallback: Only issue paginated direct query if catalog cache is completely empty
      if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
        const fallbackRes = await inventoryService.getPaginatedProducts(PAGE_LIMIT);
        rawProducts = fallbackRes.products || [];
      }
      const statsMap = await inventoryService.fetchProductStats(rawProducts);

      const productsWithStats = rawProducts.map(p => {
        const stats = statsMap[p.sku] || { stockIn: 0, sales: 0, claim: 0, adjustment: 0 };
        return {
          ...p,
          stockInHistory: { ...p.stockInHistory, '30': stats.stockIn },
          salesHistory: { ...p.salesHistory, '30': stats.sales },
          claimHistory: { ...p.claimHistory, '30': stats.claim },
          adjustmentHistory: { ...p.adjustmentHistory, '30': stats.adjustment }
        };
      });
      
      // Deduplicate strictly by name to avoid UI duplicates
      const uniqueData = Array.from(new Map(categoriesResult.map(item => [
        (item.name || '').trim().toLowerCase(), 
        item
      ])).values());
      
      return {
        globalBufferStock: settingsResult.defaultBufferStock !== undefined ? settingsResult.defaultBufferStock : 2,
        products: productsWithStats,
        categories: uniqueData,
        lastVisibleDoc: null,
        hasMore: false
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins for instant loads
  });

  const loadMore = async () => {
    if (!data?.lastVisibleDoc || loadingMore || !data?.hasMore) return;
    setLoadingMore(true);
    
    try {
      const { products: newProducts, lastDoc } = await inventoryService.getPaginatedProducts(PAGE_LIMIT, data.lastVisibleDoc);
      
      // Update cache directly
      queryClient.setQueryData(['inventoryInitial', PAGE_LIMIT], (old) => {
        if (!old) return old;
        return {
          ...old,
          products: [...old.products, ...newProducts],
          lastVisibleDoc: lastDoc,
          hasMore: newProducts.length === PAGE_LIMIT
        };
      });
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateProductInState = (productData, isEdit) => {
    queryClient.setQueryData(['inventoryInitial', PAGE_LIMIT], (old) => {
      if (!old) return old;
      let newProducts;
      if (isEdit) {
        newProducts = old.products.map(p => p.sku === productData.sku ? productData : p);
      } else {
        newProducts = [productData, ...old.products];
      }
      return { ...old, products: newProducts };
    });
  };

  return {
    products: data?.products || [],
    categories: data?.categories || [],
    loading,
    loadingMore,
    globalBufferStock: data?.globalBufferStock ?? 2,
    hasMore: data?.hasMore || false,
    loadMore,
    fetchInitialProducts,
    updateProductInState
  };
}
