import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';

import { categoryService } from '../firebase/categoryService';
import ProductList from '../components/ProductList';
import { memoryCache } from '../utils/memoryCache';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const CategoryPage = () => {
  const { type } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const [products, setProducts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🛡️ Fixed 50 items per page as specified
  const itemsPerPage = 50;

  // In-memory page cache and cursor tracking for zero-quota re-visits
  const pageCacheRef = useRef({});
  const pageCursorsRef = useRef({ 1: null });
  const totalCountRef = useRef(0);

  // 🛡️ Sort in-stock products first for better customer shopping experience
  const sortInStockFirst = useCallback((list) => {
    return [...list].sort((a, b) => {
      const aInStock = (a.availableStock > 0 || (!a.isOutOfStock && a.stockQuantity > 0)) ? 1 : 0;
      const bInStock = (b.availableStock > 0 || (!b.isOutOfStock && b.stockQuantity > 0)) ? 1 : 0;
      return bInStock - aInStock;
    });
  }, []);

  // Reset page cache when category type changes
  useEffect(() => {
    pageCacheRef.current = {};
    pageCursorsRef.current = { 1: null };
    totalCountRef.current = 0;
    setTotalCount(0);
  }, [type]);

  // Fetch page data with 2-Tier Caching & Cursor Pagination
  useEffect(() => {
    let isMounted = true;
    const fetchPageData = async () => {
      if (!type || type.trim().toLowerCase() === 'all') return;
      
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch category info for UI with alias resolution (0 Reads from LocalStorage)
        const currentCat = await categoryService.getCategoryByType(type);
        if (!isMounted) return;
        setCategoryInfo(currentCat || null);

        // 2. Check in-memory page cache first (0ms, 0 Reads)
        if (pageCacheRef.current[currentPage]) {
          if (isMounted) {
            setProducts(pageCacheRef.current[currentPage]);
            if (totalCountRef.current > 0) {
              setTotalCount(totalCountRef.current);
            }
            setLoading(false);
          }
          return;
        }

        const { productService } = await import('../firebase/productService');
        const lowerCaseType = type.trim().toLowerCase();

        // 3. For page 1, fetch Tier 1 Chunk / Query
        if (currentPage === 1) {
          const cacheKey = `category_${lowerCaseType}_p1`;
          const fetchFn = async () => {
            return await productService.getProductsByCategory(lowerCaseType, null, itemsPerPage);
          };

          const cachedResult = await memoryCache.getOrFetch(cacheKey, fetchFn, 3 * 60 * 1000);
          const fetchedProducts = cachedResult?.docs || [];
          const sorted = sortInStockFirst(fetchedProducts);
          const count = cachedResult?.totalItems || (cachedResult?.hasMore ? fetchedProducts.length + 1 : fetchedProducts.length);
          
          pageCacheRef.current[1] = sorted;
          if (cachedResult?.lastDoc) {
            pageCursorsRef.current[2] = cachedResult.lastDoc;
          }
          totalCountRef.current = count;

          if (isMounted) {
            setProducts(sorted);
            setTotalCount(count);
          }
        } else {
          // For currentPage > 1:
          let cursor = pageCursorsRef.current[currentPage];

          // If cursor is not yet known (e.g. direct URL navigation to ?page=2 without loading page 1):
          if (!cursor) {
            const p1Result = await productService.getProductsByCategory(lowerCaseType, null, itemsPerPage);
            const p1Docs = sortInStockFirst(p1Result?.docs || []);
            pageCacheRef.current[1] = p1Docs;
            if (p1Result?.lastDoc) {
              pageCursorsRef.current[2] = p1Result.lastDoc;
            }
            if (p1Result?.totalItems) {
              totalCountRef.current = p1Result.totalItems;
              if (isMounted) setTotalCount(p1Result.totalItems);
            }
            cursor = pageCursorsRef.current[currentPage];
          }

          if (cursor) {
            const cacheKey = `category_${lowerCaseType}_p${currentPage}`;
            const fetchFn = async () => {
              return await productService.getProductsByCategory(lowerCaseType, cursor, itemsPerPage);
            };

            const result = await memoryCache.getOrFetch(cacheKey, fetchFn, 3 * 60 * 1000);
            const fetchedProducts = result?.docs || [];
            const sorted = sortInStockFirst(fetchedProducts);
            
            pageCacheRef.current[currentPage] = sorted;
            if (result?.lastDoc) {
              pageCursorsRef.current[currentPage + 1] = result.lastDoc;
            }

            if (isMounted) {
              setProducts(sorted);
              if (result?.totalItems) {
                totalCountRef.current = result.totalItems;
                setTotalCount(result.totalItems);
              }
            }
          } else {
            // Fallback if cursor still couldn't be resolved: reset to page 1
            if (isMounted) {
              setSearchParams({});
            }
          }
        }
      } catch (err) {
        console.error("Error fetching category data:", err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPageData();
    return () => { isMounted = false; };
  }, [type, currentPage, sortInStockFirst, setSearchParams]);

  // Page Change Handler with Smooth Scroll
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage === currentPage) return;
    if (totalPages && newPage > totalPages) return;

    if (newPage === 1) {
      setSearchParams({});
    } else {
      setSearchParams({ page: newPage.toString() });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🛡️ Route Alias & Parity Guard: If type is 'all', auto-redirect to canonical /categories hub
  if (type && type.trim().toLowerCase() === 'all') {
    return <Navigate to="/categories" replace />;
  }

  // Calculate pagination boundaries
  const effectiveTotalCount = totalCount || products.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / itemsPerPage));
  const startItem = effectiveTotalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, effectiveTotalCount);

  // Helper to generate smart pagination list with ellipses
  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  };

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
                {effectiveTotalCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-brand border border-blue-100">
                    {effectiveTotalCount} รายการ
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
              
              {/* Pagination Controls (Calm UI) */}
              {totalPages > 1 && (
                <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-100">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1 text-center sm:text-left">
                    แสดงรายการที่ <span className="font-bold text-slate-800">{startItem} - {endItem}</span> จากทั้งหมด <span className="font-bold text-slate-800">{effectiveTotalCount}</span> รายการ
                    <span className="ml-2 text-slate-400 font-normal">(หน้า {currentPage}/{totalPages})</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
                    {/* Previous Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      aria-label="หน้าก่อนหน้า"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden xs:inline">ก่อนหน้า</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="w-7 sm:w-8 text-center text-slate-400 font-bold text-xs select-none">
                              ...
                            </span>
                          );
                        }
                        const pageNum = p;
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center ${
                              isActive
                                ? 'bg-brand text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                            aria-label={`ไปที่หน้า ${pageNum}`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      aria-label="หน้าถัดไป"
                    >
                      <span className="hidden xs:inline">ถัดไป</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
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
