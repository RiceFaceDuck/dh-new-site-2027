import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, limit, startAfter } from 'firebase/firestore'; 
import { db } from '../firebase/config';
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

  // Infinite Scroll setup
  const observer = useRef();
  const lastProductElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadProducts(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!type) return;
      
      try {
        setLoading(true);
        setError(null);
        setProducts([]);
        setHasMore(true);
        setLastVisible(null);
        
        // 1. Fetch category info for UI
        const activeCategories = await categoryService.getActiveCategories();
        const currentCat = activeCategories.find(c => c.type === type);
        setCategoryInfo(currentCat || null);

        // 2. Fetch first batch of products (Server-side limit)
        await loadProducts(true);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const loadProducts = async (isInitial = false) => {
    try {
      if (!isInitial) setLoadingMore(true);

      const productsRef = collection(db, "products");
      const lowerCaseType = type.trim().toLowerCase();
      
      let q;
      if (isInitial || !lastVisible) {
        q = query(
          productsRef, 
          where("category_lower", "==", lowerCaseType), 
          limit(itemsPerPage)
        );
      } else {
        q = query(
          productsRef, 
          where("category_lower", "==", lowerCaseType), 
          startAfter(lastVisible),
          limit(itemsPerPage)
        );
      }

      let fetchedProducts = [];

      if (isInitial) {
        const cacheKey = `category_${lowerCaseType}`;
        const fetchFn = async () => {
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
          return { docs, lastDoc };
        };

        const cachedResult = await memoryCache.getOrFetch(cacheKey, fetchFn, 3 * 60 * 1000);
        fetchedProducts = cachedResult.docs;
        if (cachedResult.lastDoc) setLastVisible(cachedResult.lastDoc);
      } else {
        const querySnapshot = await getDocs(q);
        fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }
      }
      
      if (fetchedProducts.length < itemsPerPage) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isInitial) {
        setProducts(fetchedProducts);
      } else {
        setProducts(prev => [...prev, ...fetchedProducts]);
      }

    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      if (!isInitial) setLoadingMore(false);
    }
  };

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 md:pt-4 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Link to="/categories" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              หมวดหมู่สินค้า: <span className="text-dh-blue">{type}</span>
            </h1>
          </div>
        </div>

        {/* Product List */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-[350px] flex flex-col">
                  <div className="w-full aspect-square bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-auto"></div>
                  <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 shadow-sm">
              <p className="font-semibold text-lg mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
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
            <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-100 shadow-sm">
              <p className="text-lg font-medium">ไม่พบสินค้าในหมวดหมู่นี้</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryPage;
