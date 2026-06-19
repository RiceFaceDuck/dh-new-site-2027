import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../../firebase/inventoryService';
import { categoryService } from '../../../firebase/categoryService';

export default function useInventoryData(PAGE_LIMIT = 50) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalBufferStock, setGlobalBufferStock] = useState(2);
  
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchInitialProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, productsResult, categoriesResult] = await Promise.all([
        inventoryService.getInventorySettings(),
        inventoryService.getPaginatedProducts(PAGE_LIMIT),
        categoryService.getAllCategories()
      ]);
      
      setGlobalBufferStock(settingsResult.defaultBufferStock !== undefined ? settingsResult.defaultBufferStock : 2);
      setProducts(productsResult.products);
      setCategories(categoriesResult.map(c => c.name));
      setLastVisibleDoc(productsResult.lastDoc);
      setHasMore(productsResult.products.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error fetching initial inventory data:", error);
    } finally {
      setLoading(false);
    }
  }, [PAGE_LIMIT]);

  useEffect(() => {
    fetchInitialProducts();
  }, [fetchInitialProducts]);

  const loadMore = async () => {
    if (!lastVisibleDoc || loadingMore) return;
    setLoadingMore(true);
    
    try {
      const { products: newProducts, lastDoc } = await inventoryService.getPaginatedProducts(PAGE_LIMIT, lastVisibleDoc);
      
      setProducts(prev => [...prev, ...newProducts]);
      setLastVisibleDoc(lastDoc);
      setHasMore(newProducts.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateProductInState = (productData, isEdit) => {
    setProducts(prev => {
      if (isEdit) {
        return prev.map(p => p.sku === productData.sku ? productData : p);
      } else {
        return [productData, ...prev];
      }
    });
  };

  return {
    products,
    categories,
    loading,
    loadingMore,
    globalBufferStock,
    hasMore,
    loadMore,
    fetchInitialProducts,
    updateProductInState
  };
}
