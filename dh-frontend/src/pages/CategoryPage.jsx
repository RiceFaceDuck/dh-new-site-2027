import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore'; 
import { db } from '../firebase/config';
import { categoryService } from '../firebase/categoryService';
import ProductList from '../components/ProductList';
import { ArrowLeft, X } from 'lucide-react';

const CategoryPage = () => {
  const { type } = useParams();
  const [allProducts, setAllProducts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  useEffect(() => {
    const fetchData = async () => {
      if (!type) return;
      
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setSelectedFilter('');
        
        // 1. Fetch category info for filters
        const activeCategories = await categoryService.getActiveCategories();
        const currentCat = activeCategories.find(c => c.type === type);
        setCategoryInfo(currentCat || null);

        // 2. Fetch all products for this category (up to 500 items for local filtering & pagination)
        const productsRef = collection(db, "products");
        const exact = type.trim();
        const lowerCase = exact.toLowerCase();
        const upperCase = exact.toUpperCase();
        const capitalized = exact.charAt(0).toUpperCase() + exact.slice(1).toLowerCase();
        const withSpace = exact + " "; 
        
        const q = query(
          productsRef, 
          where("category", "in", [exact, lowerCase, upperCase, capitalized, withSpace]), 
          limit(500)
        );

        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort newest first or leave as is
        setAllProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  // Derived state: Filtered products
  const filteredProducts = useMemo(() => {
    if (!selectedFilter) return allProducts;
    const lowerFilter = selectedFilter.toLowerCase();
    return allProducts.filter(p => {
      const nameMatch = p.name && p.name.toLowerCase().includes(lowerFilter);
      const tagsMatch = p.tags && Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(lowerFilter));
      return nameMatch || tagsMatch;
    });
  }, [allProducts, selectedFilter]);

  // Derived state: Paginated products
  const displayedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 md:pt-4 space-y-4 md:space-y-6">
        
        {/* ส่วนหัวแสดงการย้อนกลับ และชื่อหมวดหมู่ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Link to="/categories" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              หมวดหมู่สินค้า: <span className="text-dh-blue">{type}</span>
            </h1>
          </div>
          
          {/* แนะนำตัวกรอง (Filters) วางต่อท้าย */}
          {categoryInfo?.filters && categoryInfo.filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-4">
              {categoryInfo.filters.map(filterOption => (
                <button
                  key={filterOption}
                  onClick={() => {
                    setSelectedFilter(selectedFilter === filterOption ? '' : filterOption);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border ${
                    selectedFilter === filterOption 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
              {selectedFilter && (
                <button
                  onClick={() => {
                    setSelectedFilter('');
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X size={14} /> ล้างตัวกรอง
                </button>
              )}
            </div>
          )}
        </div>

        {/* ส่วนแสดงรายการสินค้า */}
        <div>
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <div>
              <p className="text-slate-500 text-sm md:text-base">
                {selectedFilter ? `พบสินค้าตามตัวกรอง "${selectedFilter}" ${filteredProducts.length} รายการ` : `พบสินค้า ${allProducts.length} รายการ`}
              </p>
            </div>
          </div>
          
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
          ) : displayedProducts.length > 0 ? (
            <>
              <ProductList products={displayedProducts} />
              
              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    &lt;
                  </button>
                  
                  {/* แสดงหมายเลขหน้า */}
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      // Show logic: first, last, current, current - 1, current + 1
                      if (
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                              currentPage === pageNum 
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        (pageNum === currentPage - 2 && pageNum > 1) || 
                        (pageNum === currentPage + 2 && pageNum < totalPages)
                      ) {
                        return <span key={pageNum} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-100 shadow-sm">
              <p className="text-lg font-medium">ไม่พบสินค้าในหมวดหมู่นี้ หรือตัวกรองที่เลือก</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryPage;
