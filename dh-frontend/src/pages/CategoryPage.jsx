import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, Navigate } from 'react-router-dom';

import { categoryService } from '../firebase/categoryService';
import ProductList from '../components/ProductList';
import { memoryCache } from '../utils/memoryCache';
import { ArrowLeft, Loader2 } from 'lucide-react';

const CategoryPage = () => {
  const { type } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Server-side Pagination state
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 40;

  const loadProducts = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setLoadingMore(true);

      const { productService } = await import('../firebase/productService');

      let fetchedProducts = [];
      let isFromChunk = false;
      const lowerCaseType = type.trim().toLowerCase();

      // 🛡️ Sort in-stock products first for better customer shopping experience
      const sortInStockFirst = (list) => {
        return [...list].sort((a, b) => {
          const aInStock = (a.availableStock > 0 || (!a.isOutOfStock && a.stockQuantity > 0)) ? 1 : 0;
          const bInStock = (b.availableStock > 0 || (!b.isOutOfStock && b.stockQuantity > 0)) ? 1 : 0;
          return bInStock - aInStock;
        });
      };

      if (isInitial) {
        const cacheKey = `category_${lowerCaseType}`;
        const fetchFn = async () => {
          return await productService.getProductsByCategory(lowerCaseType, null, itemsPerPage);
        };

        const cachedResult = await memoryCache.getOrFetch(cacheKey, fetchFn, 3 * 60 * 1000);
        fetchedProducts = cachedResult?.docs || [];
        isFromChunk = Boolean(cachedResult?.fromChunk);
        if (cachedResult?.lastDoc) setLastVisible(cachedResult.lastDoc);

        // 🛡️ 2-Tier Pagination Shield: If chunk has more items than 50 (e.g. 722 items), allow infinite scroll
        if (cachedResult?.hasMore !== undefined) {
          setHasMore(Boolean(cachedResult.hasMore));
        } else {
          setHasMore(fetchedProducts.length >= itemsPerPage);
        }

        setProducts(sortInStockFirst(fetchedProducts));
      } else {
        const result = await productService.getProductsByCategory(lowerCaseType, lastVisible, itemsPerPage);
        fetchedProducts = result?.docs || [];
        isFromChunk = Boolean(result?.fromChunk);
        if (result?.lastDoc) {
          setLastVisible(result.lastDoc);
        }
        
        if (fetchedProducts.length < itemsPerPage) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUnique = fetchedProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...sortInStockFirst(newUnique)];
        });
      }

    } catch (error) {
      console.error("Error loading products:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการโหลดสินค้า");
    } finally {
      if (!isInitial) setLoadingMore(false);
    }
  }, [type, lastVisible]);

  // Infinite Scroll setup
  const observer = useRef();
  const lastProductElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadProducts(false);
      }
    }, { rootMargin: '400px' });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadProducts]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (!type || type.trim().toLowerCase() === 'all') return;
      
      try {
        setLoading(true);
        setError(null);
        setProducts([]);
        setHasMore(true);
        setLastVisible(null);
        
        // 1. Fetch category info for UI with alias resolution (0 Reads from LocalStorage)
        const currentCat = await categoryService.getCategoryByType(type);
        if (!isMounted) return;
        setCategoryInfo(currentCat || null);

        // 2. Fetch first batch of products (Server-side limit)
        await loadProducts(true);
      } catch (err) {
        console.error("Error fetching category data:", err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, [type, loadProducts]);

  // 🛡️ Route Alias & Parity Guard: If type is 'all', auto-redirect to canonical /categories hub
  if (type && type.trim().toLowerCase() === 'all') {
    return <Navigate to="/categories" replace />;
  }

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <Helmet>
        <title>{type} | หมวดหมู่สินค้า DH Notebook</title>
        <meta name="description" content={`เลือกซื้อ ${type} คุณภาพสูงจาก DH Notebook จัดส่งทั่วประเทศ`} />
      </Helmet>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 md:pt-4 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3 md:gap-4">
            <Link 
              to="/categories" 
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-800 shadow-2xs group"
              aria-label="กลับสู่หมวดหมู่ทั้งหมด"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  หมวดหมู่: <span className="text-brand">{categoryInfo?.name || type}</span>
                </h1>
                {products.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-brand border border-blue-100">
                    {products.length} รายการ
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                เลือกซื้ออะไหล่แท้และอะไหล่เทียบคุณภาพสูง จัดส่งรวดเร็วทั่วประเทศ
              </p>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div>
          {error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 shadow-xs">
              <p className="font-semibold text-lg mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : loading ? (
            <ProductList isLoading={true} showTitle={false} />
          ) : products.length > 0 ? (
            <>
              <ProductList products={products} />
              
              {/* Infinite Scroll Trigger / Loader */}
              {hasMore && (
                <div ref={lastProductElementRef} className="mt-8 flex justify-center items-center py-6">
                  {loadingMore ? (
                    <div className="flex flex-col items-center text-slate-400">
                      <Loader2 className="animate-spin w-8 h-8 mb-2" /> 
                      <span className="text-sm">กำลังโหลดสินค้าเพิ่มเติม...</span>
                    </div>
                  ) : (
                    <div className="h-10"></div> // Spacer to ensure observer triggers smoothly
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-100 shadow-xs">
              <p className="text-lg font-medium">ไม่พบสินค้าในหมวดหมู่นี้</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryPage;
