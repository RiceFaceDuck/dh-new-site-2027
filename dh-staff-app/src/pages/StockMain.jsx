import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryService } from '../firebase/inventoryService';
import ProductCard from '../components/stock/ProductCard';
import CategoryFilter from '../components/stock/CategoryFilter';
import BarcodeScanner from '../components/stock/BarcodeScanner';
import ProductDetailModal from '../components/stock/ProductDetailModal';

const StockMain = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Pagination (Client-side)
  const [displayedCount, setDisplayedCount] = useState(20);

  // Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 1. ดึงข้อมูลครั้งแรกครั้งเดียว (Categories & All Active Products)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          inventoryService.getUniqueProductCategories(),
          inventoryService.getAllActiveProducts()
        ]);
        setCategories(cats);
        setAllProducts(prods);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Filter Products locally (ประหยัดค่า Read อย่างมหาศาล และเร็วมาก)
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.sku && p.sku.toLowerCase().includes(queryLower)) || 
        (p.name && p.name.toLowerCase().includes(queryLower))
      );
    }

    return result;
  }, [allProducts, selectedCategory, searchQuery]);

  // 3. ปรับค่า Pagination ถ้ามีการเปลี่ยน Filter/Search
  useEffect(() => {
    setDisplayedCount(20);
  }, [selectedCategory, searchQuery]);

  const loadMore = () => {
    setDisplayedCount(prev => prev + 20);
  };

  // Handle Scan Success
  const handleScanSuccess = async (code) => {
    setIsScannerOpen(false);
    setSearchQuery(code); // เอาค่าที่แสกนได้มาใส่ในช่องค้นหา
  };

  const currentProducts = filteredProducts.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProducts.length;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      
      {/* 🔴 ส่วนหัวของ App (Sticky) */}
      <div className="bg-indigo-600 text-white pt-10 pb-4 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="px-5 mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tight">คลังสินค้า</h1>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-white/20 p-2.5 rounded-full backdrop-blur-md shadow-sm hover:bg-white/30 transition-all active:scale-95"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา SKU หรือชื่อสินค้า..."
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl text-gray-900 font-medium placeholder-gray-400 outline-none shadow-inner focus:ring-4 focus:ring-indigo-300/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔴 ส่วน Filter หมวดหมู่ */}
      <div className="px-4 mt-5">
        <CategoryFilter 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory} 
        />
      </div>

      {/* 🔴 พื้นที่แสดงสินค้า */}
      <div className="p-4 mt-2 space-y-3">
        {isLoading ? (
           <div className="flex flex-col justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลสินค้า...</p>
           </div>
        ) : filteredProducts.length === 0 ? (
           <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 mt-6">
             <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
             </div>
             <h2 className="text-lg font-bold text-gray-800 mb-1">ไม่พบสินค้าที่ค้นหา</h2>
             <p className="text-gray-500 text-sm">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่</p>
           </div>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-400 px-1 mb-2 uppercase tracking-wide flex justify-between">
              <span>ผลการค้นหา {filteredProducts.length} รายการ</span>
              {searchQuery && <span className="text-indigo-500 line-clamp-1 max-w-[150px] text-right">"{searchQuery}"</span>}
            </p>
            {currentProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => setSelectedProduct(product)}
              />
            ))}
            
            {hasMore && (
              <button 
                onClick={loadMore}
                className="w-full py-4 mt-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex justify-center items-center gap-2"
              >
                โหลดเพิ่มเติม
              </button>
            )}
          </>
        )}
      </div>

      {/* Barcode Scanner Overlay */}
      <BarcodeScanner 
        isActive={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

    </div>
  );
};

export default StockMain;
