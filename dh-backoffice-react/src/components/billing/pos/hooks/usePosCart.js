import { useState, useEffect, useMemo } from 'react';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';
import { gasStockService } from '../../../../firebase/gasStockService';
import useDebounce from '../../../../hooks/useDebounce';

const SEARCH_CACHE_KEY = 'search_hybrid_cache';
const SEARCH_CACHE_EXPIRY = 'search_hybrid_cache_expiry';
const CACHE_TTL = 2 * 60 * 60 * 1000;

export function usePosCart(products) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionBoxItem, setActionBoxItem] = useState(null);
    
    // 🔥 Hybrid Cache State
    const [initialProducts, setInitialProducts] = useState([]);
    const [gasProductsCache, setGasProductsCache] = useState(null);
    const [isCacheLoading, setIsCacheLoading] = useState(true);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // ✨ Load Hybrid Cache (Zero-Reads Architecture)
    useEffect(() => {
        const fetchCacheData = async () => {
            setIsCacheLoading(true);
            try {
                // 1. ดึงข้อมูล 50 ชิ้นแรกจาก Firebase เพื่อให้มีรูปภาพและข้อมูลเบื้องต้น (1 Read Query)
                const { products: fbProducts } = await inventoryQueryService.getPaginatedProducts(50);
                setInitialProducts(fbProducts);

                // 2. ดึงข้อมูลเต็ม 5,000+ ชิ้นจาก Google Sheets Cache (0 Reads)
                const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
                const expiry = sessionStorage.getItem(SEARCH_CACHE_EXPIRY);
                
                if (cached && expiry && new Date().getTime() < Number(expiry)) {
                    setGasProductsCache(JSON.parse(cached));
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
                console.error("🔥 Error fetching hybrid cache in POS:", error);
            } finally {
                setIsCacheLoading(false);
            }
        };
        fetchCacheData();
    }, []);

    const mergedProducts = useMemo(() => {
        const base = gasProductsCache || initialProducts;
        return base.map(cacheProduct => {
            const fullProduct = initialProducts.find(p => p.sku === cacheProduct.sku);
            return fullProduct ? { ...cacheProduct, ...fullProduct } : { ...cacheProduct };
        });
    }, [gasProductsCache, initialProducts]);

    // ✨ Local Filter (0ms Latency)
    const searchResults = useMemo(() => {
        if (!debouncedSearch.trim()) {
            return mergedProducts.slice(0, 15);
        }
        
        const term = debouncedSearch.trim().toLowerCase();
        
        // Exact SKU Match
        const exactMatch = mergedProducts.find(p => p.sku && p.sku.toLowerCase() === term);
        if (exactMatch) return [{ ...exactMatch, matchType: 'exact' }];
        
        // Similar Match
        const filtered = mergedProducts.filter(p => 
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
        );
        
        return filtered.slice(0, 15).map(p => ({ ...p, matchType: 'similar' }));
    }, [debouncedSearch, mergedProducts]);

    return {
        searchQuery, setSearchQuery,
        showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem,
        searchResults, isCacheLoading
    };
}
