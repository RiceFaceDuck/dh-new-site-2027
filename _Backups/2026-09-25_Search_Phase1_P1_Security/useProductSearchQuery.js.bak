import { useState, useEffect, useMemo, useRef } from 'react';
import { inventorySyncMetaService } from '../../firebase/inventory/inventorySyncMetaService';
import { inventoryQueryService } from '../../firebase/inventory/inventoryQueryService';

export function useProductSearchQuery(debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageCache, setImageCache] = useState({});
  const fetchedSkusRef = useRef(new Set());
  const [displayLimit, setDisplayLimit] = useState(21);

  // ==========================================
  // 1. Initial 3-Tier Catalog Hydration & Real-time Delta Sync
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const loadInitialCatalog = async () => {
      setLoading(true);
      try {
        const { catalog, products: fetchedList } = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false });
        const items = catalog || fetchedList || [];
        if (isMounted) {
          setProducts(items);
        }
      } catch (err) {
        console.error('🔥 Error loading initial catalog:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialCatalog();

    // ⚡ Subscribe to settings/inventory_meta for real-time delta updates
    const unsubscribeMeta = inventorySyncMetaService.subscribeInventoryMeta(async (meta) => {
      if (!isMounted || !meta) return;
      try {
        const recentSkus = meta.recentUpdatedSkus || [];
        const canDelta = !meta.fullSyncRequired && recentSkus.length > 0 && recentSkus.length <= 150;

        if (canDelta) {
          const deltaProducts = await inventorySyncMetaService.fetchDeltaProducts(recentSkus);
          if (deltaProducts.length > 0 && isMounted) {
            setProducts((prevList) => {
              const deltaMap = new Map(deltaProducts.map((p) => [p.sku, p]));
              const updatedList = prevList.map((p) =>
                deltaMap.has(p.sku) ? { ...p, ...deltaMap.get(p.sku) } : p
              );
              const existingSkus = new Set(updatedList.map((p) => p.sku));
              deltaProducts.forEach((p) => {
                if (!existingSkus.has(p.sku)) {
                  updatedList.unshift(p);
                  existingSkus.add(p.sku);
                }
              });
              return updatedList;
            });
          }
        } else if (meta.fullSyncRequired) {
          // Full re-sync when rebuild or large changes occurred
          const { catalog, products: freshList } = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: true });
          const items = catalog || freshList || [];
          if (isMounted && items.length > 0) {
            setProducts(items);
          }
        }
      } catch (syncErr) {
        console.warn('⚠️ [useProductSearchQuery] Real-time delta update error:', syncErr);
      }
    });

    // ⚡ Cross-tab sync subscription
    const unsubscribeChannel = inventorySyncMetaService.subscribeInventorySyncChannel(async (event) => {
      if (!isMounted || !event) return;
      try {
        if (event.skus && event.skus.length > 0 && event.skus.length <= 150) {
          const deltaProducts = await inventorySyncMetaService.fetchDeltaProducts(event.skus);
          if (deltaProducts.length > 0 && isMounted) {
            setProducts((prevList) => {
              const deltaMap = new Map(deltaProducts.map((p) => [p.sku, p]));
              const updatedList = prevList.map((p) =>
                deltaMap.has(p.sku) ? { ...p, ...deltaMap.get(p.sku) } : p
              );
              const existingSkus = new Set(updatedList.map((p) => p.sku));
              deltaProducts.forEach((p) => {
                if (!existingSkus.has(p.sku)) {
                  updatedList.unshift(p);
                  existingSkus.add(p.sku);
                }
              });
              return updatedList;
            });
          }
        } else {
          const { catalog, products: freshList } = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false });
          const items = catalog || freshList || [];
          if (isMounted && items.length > 0) {
            setProducts(items);
          }
        }
      } catch (err) {
        console.warn('⚠️ [useProductSearchQuery] Cross-tab sync event error:', err);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribeMeta === 'function') unsubscribeMeta();
      if (typeof unsubscribeChannel === 'function') unsubscribeChannel();
    };
  }, []);

  // ==========================================
  // 2. Manual Force Refresh
  // ==========================================
  const forceSync = async () => {
    setLoading(true);
    try {
      const { catalog, products: freshList } = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: true });
      const items = catalog || freshList || [];
      setProducts(items);
    } catch (err) {
      console.error('🔥 Force sync failed:', err);
      alert('ดึงข้อมูลล้มเหลว กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. Merged Products with Stock / Image normalizations
  // ==========================================
  const mergedProducts = useMemo(() => {
    return products.map((item) => {
      const parsedStock = parseInt(item.stockQuantity, 10);
      const stockQuantity = isNaN(parsedStock) ? 0 : parsedStock;

      const parsedBuffer = parseInt(item.bufferStock, 10);
      const bufferStock = isNaN(parsedBuffer) ? 2 : parsedBuffer;

      const images = imageCache[item.sku] || item.images || (item.imageUrl ? [item.imageUrl] : (item.image ? [item.image] : []));

      return {
        ...item,
        stockQuantity,
        bufferStock,
        images
      };
    });
  }, [products, imageCache]);

  // Reset display limit when search inputs change
  useEffect(() => {
    setDisplayLimit(21);
  }, [debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter]);

  // ==========================================
  // 4. Instant Multi-Keyword Local Filter (0ms, 0 Reads)
  // ==========================================
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
        (product.compatibleModels && product.compatibleModels?.some((m) => m.toLowerCase().includes(term))) ||
        (product.compatiblePartNumbers && product.compatiblePartNumbers?.some((pn) => pn.toLowerCase().includes(term))) ||
        (product.substituteSkus && product.substituteSkus?.some((sub) => sub.toLowerCase().includes(term))) ||
        (product.tags && product.tags?.some((t) => t.toLowerCase().includes(term)))
      );
    };

    return mergedProducts.filter((p) => {
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
      setDisplayLimit((prev) => Math.min(prev + 21, allFilteredProducts.length));
    }
  };

  const hasMore = displayLimit < allFilteredProducts.length;

  // ==========================================
  // 5. Lazy Image Fetching
  // ==========================================
  useEffect(() => {
    const fetchMissingImages = async () => {
      const missingImageSkus = filteredProducts
        .filter((p) => !p.images || p.images.length === 0)
        .map((p) => p.sku);

      if (missingImageSkus.length === 0) return;

      const skusToFetch = missingImageSkus.filter((sku) => !fetchedSkusRef.current.has(sku));
      if (skusToFetch.length === 0) return;

      const fetchedImages = await inventoryQueryService.getProductImagesBatch(skusToFetch);
      skusToFetch.forEach((sku) => fetchedSkusRef.current.add(sku));

      if (Object.keys(fetchedImages).length > 0) {
        setImageCache((prev) => ({ ...prev, ...fetchedImages }));
      }
    };

    const timer = setTimeout(() => {
      fetchMissingImages();
    }, 500);

    return () => clearTimeout(timer);
  }, [filteredProducts]);

  // ==========================================
  // 6. Direct In-Memory Product Updater
  // ==========================================
  const updateProductData = (updater) => {
    setProducts((prev) => (typeof updater === 'function' ? updater(prev) : updater));
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
