import { useState, useEffect } from 'react';
import { gasStockService } from '../../../firebase/gasStockService';

const CACHE_KEY = 'inventory_full_cache';
const CACHE_EXPIRY_KEY = 'inventory_full_cache_expiry';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in ms

export default function useInventorySearch(products, searchTerm, filterCategory, sortConfig, salesPeriod) {
  const [allProductsCache, setAllProductsCache] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const expiry = sessionStorage.getItem(CACHE_EXPIRY_KEY);
      if (cached && expiry && new Date().getTime() < Number(expiry)) {
        return JSON.parse(cached);
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
    if (isGlobalActionActive && !allProductsCache && !isFetchingAll) {
      const fetchAll = async () => {
        setIsFetchingAll(true);
        try {
          // ดึงข้อมูล Backup แบบประหยัดโควต้า Firebase จาก GAS (Google Sheet)
          const data = await gasStockService.fetchBackupInventory();
          
          setAllProductsCache(data);
          
          // เก็บลง sessionStorage
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
            sessionStorage.setItem(CACHE_EXPIRY_KEY, String(new Date().getTime() + CACHE_TTL));
          } catch (storageError) {
            console.warn("Could not save to sessionStorage (might be full)", storageError);
          }
          
        } catch (error) {
          console.error("Error fetching backup inventory from GAS:", error);
          // Fallback mechanism to Firebase could be added here if GAS completely fails, but sticking to GAS-only for now to enforce quota saving.
        } finally {
          setIsFetchingAll(false);
        }
      };
      fetchAll();
    }
  }, [isGlobalActionActive, allProductsCache, isFetchingAll]);

  // ใช้ cache ถ้ามี แต่ต้อง 'ผสาน' กับข้อมูล products เดิมจาก Firebase
  // เพื่อกู้คืนรูปภาพ (images) และประวัติ (history) ของสินค้าที่โหลดมาแล้ว
  const sourceProducts = isGlobalActionActive && allProductsCache 
    ? allProductsCache.map(cacheProduct => {
        // หาว่าสินค้านี้เคยถูกโหลดมาจาก Firebase แบบเต็มๆ หรือยัง
        const fullProduct = products.find(p => p.sku === cacheProduct.sku);
        return fullProduct 
          ? { ...cacheProduct, ...fullProduct } // ถ้ามี ให้เอาข้อมูล Firebase ทับ เพื่อเอารูปและประวัติ
          : cacheProduct;
      })
    : products;

  let processedProducts = sourceProducts.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.sku.toLowerCase().includes(term) || 
                          (p.name && p.name.toLowerCase().includes(term)) ||
                          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(term)));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 🚀 เพิ่มระบบจัดเรียง (Sorting)
  if (sortConfig?.key) {
    processedProducts = [...processedProducts].sort((a, b) => {
      let valA, valB;
      
      switch (sortConfig.key) {
        case 'Price':
          valA = Number(a.Price || 0);
          valB = Number(b.Price || 0);
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
        default:
          valA = 0;
          valB = 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ✨ In-Memory Pagination (Virtualization for Cache)
  const [displayLimit, setDisplayLimit] = useState(50);
  
  // รีเซ็ตจำนวนที่แสดงผลเมื่อเงื่อนไขการค้นหาเปลี่ยน
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm, filterCategory, sortConfig?.key, sortConfig?.direction]);

  const loadMoreCache = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const hasMoreCache = isGlobalActionActive ? displayLimit < processedProducts.length : false;
  
  // ตัดข้อมูลมาแสดงผลแค่เท่ากับ limit ปัจจุบัน
  const paginatedProducts = isGlobalActionActive ? processedProducts.slice(0, displayLimit) : processedProducts;

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
    hasMoreCache,
    loadMoreCache,
    updateCache,
    clearCache
  };
}
