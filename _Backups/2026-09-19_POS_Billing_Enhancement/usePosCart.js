import { useState, useEffect, useMemo } from 'react';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';
import { catalogHydrationService } from '../../../../firebase/catalogHydrationService';
import useDebounce from '../../../../hooks/useDebounce';

export function usePosCart(products) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionBoxItem, setActionBoxItem] = useState(null);
    
    // ⚡ 3-Tier Local-First Chunked Catalog State (Zero-Read Warm Cache)
    const [hydratedProducts, setHydratedProducts] = useState([]);
    const [isCacheLoading, setIsCacheLoading] = useState(true);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // ✨ Load Catalog via 3-Tier Local-First Hydration (catalogs/search_index -> Chunks -> IDB -> GAS Fallback)
    useEffect(() => {
        let isMounted = true;
        const fetchCacheData = async () => {
            setIsCacheLoading(true);
            try {
                // If products are already provided via props, prioritize them
                if (Array.isArray(products) && products.length > 0) {
                    if (isMounted) {
                        setHydratedProducts(products);
                        setIsCacheLoading(false);
                    }
                    return;
                }

                // Hydrate via 3-Tier Local-First service (IndexedDB L2 + Chunked Catalog, GAS fallback)
                const result = await catalogHydrationService.hydrateCatalog();
                if (isMounted && Array.isArray(result?.products)) {
                    setHydratedProducts(result.products);
                }
            } catch (error) {
                console.error("🔥 Error hydrating chunked catalog in POS:", error);
            } finally {
                if (isMounted) {
                    setIsCacheLoading(false);
                }
            }
        };

        fetchCacheData();
        return () => { isMounted = false; };
    }, [products]);

    const mergedProducts = useMemo(() => {
        if (Array.isArray(products) && products.length > 0) {
            return products;
        }
        return hydratedProducts;
    }, [products, hydratedProducts]);

    const [searchResults, setSearchResults] = useState([]);

    // ✨ Local Filter & Fallback Search (0ms Latency for Cache, Fallback for new products)
    useEffect(() => {
        const fetchSearch = async () => {
            if (!debouncedSearch.trim()) {
                setSearchResults(mergedProducts.slice(0, 15));
                return;
            }
            
            const term = debouncedSearch.trim().toLowerCase();
            
            // 1. Exact SKU or Barcode Match in Cache
            const exactMatch = mergedProducts.find(p => 
                (p.sku && p.sku.toLowerCase() === term) ||
                (p.barcode && String(p.barcode).toLowerCase() === term)
            );
            if (exactMatch) {
                setSearchResults([{ ...exactMatch, matchType: 'exact' }]);
                return;
            }
            
            // 2. Similar Match in Cache (SKU, Barcode, Name, Brand, Category, Tags)
            const filtered = mergedProducts.filter(p => 
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.barcode && String(p.barcode).toLowerCase().includes(term)) ||
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.brand && p.brand.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term)) ||
                (p.tags && p.tags.some(t => String(t).toLowerCase().includes(term)))
            );
            
            if (filtered.length > 0) {
                setSearchResults(filtered.slice(0, 15).map(p => ({ ...p, matchType: 'similar' })));
                return;
            }

            // 3. Fallback to Firebase (Zero-Read bypassed for newly added items)
            try {
                const fbMatch = await inventoryQueryService.getProductBySku(debouncedSearch.trim().toUpperCase());
                if (fbMatch) {
                    setSearchResults([{ ...fbMatch, matchType: 'exact' }]);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                setSearchResults([]);
            }
        };

        fetchSearch();
    }, [debouncedSearch, mergedProducts]);

    return {
        searchQuery, setSearchQuery,
        showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem,
        searchResults, isCacheLoading,
        products: mergedProducts
    };
}
