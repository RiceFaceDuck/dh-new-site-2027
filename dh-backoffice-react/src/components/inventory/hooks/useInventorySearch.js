import { useState, useEffect, useMemo } from 'react';
import { catalogHydrationService } from '../../../firebase/catalogHydrationService';
import useInventoryFilters from './useInventoryFilters';
import useInventorySorting from './useInventorySorting';
import useInventoryPagination from './useInventoryPagination';

import { safeJsonParse } from 'dh-shared';
const CACHE_KEY = 'inventory_full_cache';
const CACHE_EXPIRY_KEY = 'inventory_full_cache_expiry';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in ms

export default function useInventorySearch(products, searchTerm, filterCategory, sortConfig, salesPeriod) {
  const [allProductsCache, setAllProductsCache] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const expiry = sessionStorage.getItem(CACHE_EXPIRY_KEY);
      if (cached && expiry && new Date().getTime() < Number(expiry)) {
        return safeJsonParse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cache', e);
    }
    return null;
  });
  
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // โหลดข้อมูลทั้งหมดเมื่อมีการค้นหา หมวดหมู่ หรือจัดเรียง
  const isGlobalActionActive = searchTerm || filterCategory !== 'All' || sortConfig?.key;

  useEffect(() => {
    if (!allProductsCache && !isFetchingAll) {
      const fetchAll = async () => {
        setIsFetchingAll(true);
        try {
          // ดึงข้อมูลผ่าน 3-Tier Zero-Read Architecture (Memory -> Session -> IDB -> Shards)
          const { products: fullCatalog } = await catalogHydrationService.hydrateCatalog();
          if (Array.isArray(fullCatalog) && fullCatalog.length > 0) {
            setAllProductsCache(fullCatalog);
            
            // เก็บลง sessionStorage
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify(fullCatalog));
              sessionStorage.setItem(CACHE_EXPIRY_KEY, String(new Date().getTime() + CACHE_TTL));
            } catch (storageError) {
              console.warn("Could not save to sessionStorage (might be full)", storageError);
            }
          }
        } catch (error) {
          console.error("Error hydrating catalog in useInventorySearch:", error);
        } finally {
          setIsFetchingAll(false);
        }
      };
      fetchAll();
    }
  }, [allProductsCache, isFetchingAll]);

  // ใช้ cache ถ้ามี แต่ต้อง 'ผสาน' กับข้อมูล products เดิมจาก Firebase
  // อย่างถูกต้อง: ต้องเอา live products เป็นตัวตั้ง แล้วค่อยเติมสินค้าจาก cache ที่ไม่อยู่ใน live
  const rawSourceProducts = useMemo(() => {
    if (!allProductsCache) return products;
    
    const liveSkus = new Set(products.map(p => p.sku));
    const cacheMap = new Map(allProductsCache.map(cp => [cp.sku, cp]));
    
    // 1. Live products (ผสานข้อมูลจาก cache เข้าไป)
    const merged = products.map(liveProduct => {
      const cacheProduct = cacheMap.get(liveProduct.sku);
      return cacheProduct ? { ...cacheProduct, ...liveProduct } : liveProduct;
    });
    
    // 2. เติมสินค้าจาก Cache ที่ยังโหลดมาไม่ถึงใน Live (Pagination fallback)
    allProductsCache.forEach(cp => {
      if (!liveSkus.has(cp.sku)) {
        merged.push(cp);
      }
    });
    
    return merged;
  }, [allProductsCache, products]);

  const [statsMap, setStatsMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (rawSourceProducts && rawSourceProducts.length > 0) {
        try {
          const { inventoryStatsService } = await import('../../../firebase/inventory/inventoryStatsService');
          const res = await inventoryStatsService.fetchProductStats(rawSourceProducts, salesPeriod);
          if (isMounted) {
            setStatsMap(res);
          }
        } catch (e) {
          console.error("Failed to load 30D stats:", e);
        }
      }
    };
    loadStats();
    return () => { isMounted = false; };
  }, [rawSourceProducts.length, salesPeriod]);

  const sourceProducts = useMemo(() => {
    return rawSourceProducts.map(p => {
      const upperSku = p.sku ? String(p.sku).trim().toUpperCase() : '';
      const st = statsMap[p.sku] || statsMap[upperSku] || {};
      const resolveMetric = (statVal, fieldName, historyObj) => {
        // 1. Authoritative 5D Snapshot: If statsMap has an authentic numeric value (including 0), use it directly
        if (statVal != null && !isNaN(Number(statVal))) {
          return Number(statVal);
        }
        // 2. Check product history object if statsMap does not have this SKU
        const histVal = historyObj?.[salesPeriod];
        if (histVal != null && !isNaN(Number(histVal))) {
          return Number(histVal);
        }
        // 3. Flat dotted field fallback (only if valid number)
        const flatVal = p[`${fieldName}.${salesPeriod}`];
        if (flatVal != null && !isNaN(Number(flatVal))) {
          return Number(flatVal);
        }
        // 4. Flat fallback fields for specific period (e.g. sales30D, claims30D when salesPeriod === '30')
        const baseKey = fieldName.replace('History', '');
        const fallback = p[`${baseKey}${salesPeriod}D`] ?? (salesPeriod === '30' ? (p[`${baseKey}30D`] ?? (fieldName === 'claimHistory' ? p.claims30D : null)) : null);
        if (fallback != null && !isNaN(Number(fallback))) {
          return Number(fallback);
        }
        if (fieldName === 'salesHistory' && salesPeriod === '30') {
          const sold = p.stats?.sold;
          if (sold != null && !isNaN(Number(sold))) return Number(sold);
        }
        return 0;
      };

      return {
        ...p,
        stockInHistory: { ...p.stockInHistory, [salesPeriod]: resolveMetric(st.stockIn, 'stockInHistory', p.stockInHistory) },
        salesHistory: { ...p.salesHistory, [salesPeriod]: resolveMetric(st.sales, 'salesHistory', p.salesHistory) },
        claimHistory: { ...p.claimHistory, [salesPeriod]: resolveMetric(st.claim, 'claimHistory', p.claimHistory) },
        adjustmentHistory: { ...p.adjustmentHistory, [salesPeriod]: resolveMetric(st.adjustment, 'adjustmentHistory', p.adjustmentHistory) }
      };
    });
  }, [rawSourceProducts, statsMap, salesPeriod]);

  // 1. Filtering (Keyword, category, tags, and fallback SKU search)
  const { filteredProducts } = useInventoryFilters(sourceProducts, searchTerm, filterCategory, isFetchingAll);

  // 2. Sorting (Multi-column with Thai locale collation)
  const { sortedProducts } = useInventorySorting(filteredProducts, sortConfig, salesPeriod);

  // 3. Pagination (Clamped bounds, safe slicing)
  const {
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    slicePage
  } = useInventoryPagination(sortedProducts.length, [searchTerm, filterCategory, sortConfig?.key, sortConfig?.direction]);

  const paginatedProducts = slicePage(sortedProducts);

  const updateCache = (productData, isEdit) => {
    if (allProductsCache) {
      const newCache = isEdit 
        ? allProductsCache.map(p => p.sku === productData.sku ? productData : p)
        : [productData, ...allProductsCache];
        
      setAllProductsCache(newCache);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      } catch (e) {
         // ignore
      }
    }
  };

  const clearCache = () => {
    setAllProductsCache(null);
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_EXPIRY_KEY);
  };

  return {
    filteredProducts: paginatedProducts,
    isSearching: isFetchingAll,
    totalItems: sortedProducts.length,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    updateCache,
    clearCache
  };
}
