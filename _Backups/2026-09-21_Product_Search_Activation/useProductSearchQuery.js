import { useState, useEffect, useMemo, useRef } from 'react';
import { inventoryQueryService } from '../../firebase/inventory/inventoryQueryService';
import { gasStockService } from '../../firebase/gasStockService';

import { safeJsonParse } from 'dh-shared';
const SEARCH_CACHE_KEY = 'search_hybrid_cache';
const SEARCH_CACHE_EXPIRY = 'search_hybrid_cache_expiry';
const CACHE_TTL = 2 * 60 * 60 * 1000;

export function useProductSearchQuery(debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter) {
  const [initialProducts, setInitialProducts] = useState([]);
  const [gasProductsCache, setGasProductsCache] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageCache, setImageCache] = useState({});
  const fetchedSkusRef = useRef(new Set());

  // ✨ Hybrid Cache Fetching
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { products } = await inventoryQueryService.getPaginatedProducts(50);
        setInitialProducts(products);

        const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
        const expiry = sessionStorage.getItem(SEARCH_CACHE_EXPIRY);
        
        if (cached && expiry && new Date().getTime() < Number(expiry)) {
          setGasProductsCache(safeJsonParse(cached));
        } else {
          const gasData = await gasStockService.fetchBackupInventory();
          setGasProductsCache(gasData);
          try {
            sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(gasData));
            sessionStorage.setItem(SEARCH_CACHE_EXPIRY, String(new Date().getTime() + CACHE_TTL));
          } catch (e) {
            console.warn("Storage full", e);
          }
        }
      } catch (error) {
        console.error("Error fetching products", error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const forceSync = async () => {
    setLoading(true);
    try {
      sessionStorage.removeItem(SEARCH_CACHE_KEY);
      sessionStorage.removeItem(SEARCH_CACHE_EXPIRY);
      const gasData = await gasStockService.fetchBackupInventory();
      setGasProductsCache(gasData);
      try {
        sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(gasData));
        sessionStorage.setItem(SEARCH_CACHE_EXPIRY, String(new Date().getTime() + CACHE_TTL));
      } catch (e) {
        console.warn("Storage full", e);
      }
    } catch (e) {
      console.error(e);
      alert('ดึงข้อมูลล้มเหลว กรุณาลองใหม่');
    }
    setLoading(false);
  };

  const mergedProducts = useMemo(() => {
    const base = gasProductsCache || initialProducts;
    return base.map(cacheProduct => {
      const fullProduct = initialProducts.find(p => p.sku === cacheProduct.sku);
      const merged = fullProduct ? { ...cacheProduct, ...fullProduct } : { ...cacheProduct };
      
      const parsedStock = parseInt(merged.stockQuantity, 10);
      merged.stockQuantity = isNaN(parsedStock) ? 0 : parsedStock;
      
      const parsedBuffer = parseInt(merged.bufferStock, 10);
      merged.bufferStock = isNaN(parsedBuffer) ? 2 : parsedBuffer;

      if (imageCache[merged.sku]) {
        merged.images = imageCache[merged.sku];
      }

      return merged;
    });
  }, [gasProductsCache, initialProducts, imageCache]);

  const [displayLimit, setDisplayLimit] = useState(21);

  // Reset display limit when search inputs change
  useEffect(() => {
    setDisplayLimit(21);
  }, [debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter]);

  const allFilteredProducts = useMemo(() => {
    if (!debouncedSearch1.trim() && !debouncedSearch2.trim() && !debouncedSearch3.trim() && stockFilter === 'ALL') {
      return mergedProducts; 
    }
    
    const term1 = debouncedSearch1.toLowerCase();
    const term2 = debouncedSearch2.toLowerCase();
    const term3 = debouncedSearch3.toLowerCase();

    const checkMatch = (product, term) => {
      if (!term) return true; 
      return (
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term)) ||
        (product.warehouseLocation && product.warehouseLocation.toLowerCase().includes(term)) ||
        (product.shortDescription && product.shortDescription.toLowerCase().includes(term)) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.sellingModel && product.sellingModel.toLowerCase().includes(term)) ||
        (product.compatibleModels && product.compatibleModels?.some(m => m.toLowerCase().includes(term))) ||
        (product.compatiblePartNumbers && product.compatiblePartNumbers?.some(pn => pn.toLowerCase().includes(term))) ||
        (product.substituteSkus && product.substituteSkus?.some(sub => sub.toLowerCase().includes(term))) ||
        (product.tags && product.tags?.some(t => t.toLowerCase().includes(term)))
      );
    };

    return mergedProducts.filter(p => {
      if (!checkMatch(p, term1) || !checkMatch(p, term2) || !checkMatch(p, term3)) return false;
      
      if (stockFilter === 'IN_STOCK') return p.stockQuantity > (p.bufferStock || 2);
      if (stockFilter === 'LOW_STOCK') return p.stockQuantity > 0 && p.stockQuantity <= (p.bufferStock || 2);
      if (stockFilter === 'OUT_OF_STOCK') return p.stockQuantity <= 0;
      
      return true;
    });
  }, [debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter, mergedProducts]);

  const filteredProducts = useMemo(() => {
    return allFilteredProducts.slice(0, displayLimit);
  }, [allFilteredProducts, displayLimit]);

  const loadMore = () => {
    if (displayLimit < allFilteredProducts.length) {
      setDisplayLimit(prev => Math.min(prev + 21, allFilteredProducts.length));
    }
  };

  const hasMore = displayLimit < allFilteredProducts.length;

  // ✨ Lazy Fetch Image Effect
  useEffect(() => {
    const fetchMissingImages = async () => {
      const missingImageSkus = filteredProducts
        .filter(p => !p.images || p.images.length === 0)
        .map(p => p.sku);

      if (missingImageSkus.length === 0) return;

      const skusToFetch = missingImageSkus.filter(sku => !fetchedSkusRef.current.has(sku));
      if (skusToFetch.length === 0) return;

      const fetchedImages = await inventoryQueryService.getProductImagesBatch(skusToFetch);
      skusToFetch.forEach(sku => fetchedSkusRef.current.add(sku));

      if (Object.keys(fetchedImages).length > 0) {
        setImageCache(prev => ({ ...prev, ...fetchedImages }));
      }
    };
    
    const timer = setTimeout(() => {
      fetchMissingImages();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filteredProducts]);

  const updateProductData = (updater) => {
    setInitialProducts(updater);
    if (gasProductsCache) setGasProductsCache(updater);
  };

  return {
    loading,
    filteredProducts,
    allFilteredProducts,
    totalFilteredCount: allFilteredProducts.length,
    displayLimit,
    hasMore,
    loadMore,
    mergedProducts,
    forceSync,
    updateProductData
  };
}
