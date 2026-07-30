import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../../firebase/inventoryService';
import { categoryService } from '../../../firebase/categoryService';

export default function useInventoryData(PAGE_LIMIT = 50) {
  const queryClient = useQueryClient();
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { data, isLoading: loading, refetch: fetchInitialProducts } = useQuery({
    queryKey: ['inventoryInitial', PAGE_LIMIT],
    queryFn: async () => {
      const [settingsResult, productsResult, categoriesResult] = await Promise.all([
        inventoryService.getInventorySettings(),
        inventoryService.getPaginatedProducts(PAGE_LIMIT),
        categoryService.getAllCategories()
      ]);

      const rawProducts = productsResult.products || [];
      const statsMap = await inventoryService.fetchProductStats(rawProducts);

      const productsWithStats = rawProducts.map(p => {
        const stats = statsMap[p.sku] || { stockIn: 0, sales: 0, claim: 0 };
        return {
          ...p,
          stockInHistory: { ...p.stockInHistory, '30': stats.stockIn },
          salesHistory: { ...p.salesHistory, '30': stats.sales },
          claimHistory: { ...p.claimHistory, '30': stats.claim }
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
        lastVisibleDoc: productsResult.lastDoc,
        hasMore: rawProducts.length === PAGE_LIMIT
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
    globalBufferStock: data?.globalBufferStock || 2,
    hasMore: data?.hasMore || false,
    loadMore,
    fetchInitialProducts,
    updateProductInState
  };
}
