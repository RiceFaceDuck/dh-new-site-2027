import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore'; 
import { db } from '../firebase/config';
import ProductList from '../components/ProductList';
import { memoryCache } from '../utils/memoryCache';
import { Search, Loader2, Sparkles, ChevronLeft } from 'lucide-react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // คำที่ถูกค้นหาล่าสุดเพื่อประหยัดการ Render
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        // ใช้ Memory Cache ดึงสินค้า (เพื่อทำ Client-side Filtering แบบรวดเร็วและประหยัด Reads)
        const cacheKey = `all_products_search_v2`;
        const fetchFn = async () => {
          // ⚠️ QUOTA PROTECTION: จำกัดการดึงข้อมูลสูงสุด 100 รายการต่อคน (100 Reads) 
          // เพื่อไม่ให้เกินโควต้าฟรี (50,000/วัน) หากมีผู้ใช้ 1,000 คน
          const productsRef = query(collection(db, "products"), limit(100));
          const snapshot = await getDocs(productsRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        const allProducts = await memoryCache.getOrFetch(cacheKey, fetchFn, 5 * 60 * 1000);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching products for search:", err);
        setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0) {
      if (!queryParam.trim()) {
        setFilteredProducts([]);
        setLastQuery('');
        return;
      }
      
      const qLower = queryParam.trim().toLowerCase();
      setLastQuery(qLower);
      
      // Client-side Filtering
      const results = products.filter(p => {
        const name = (p.name || p.productName || p.title || '').toLowerCase();
        const model = (p.model || p.modelNumber || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const sku = (p.sku || p.id || '').toLowerCase();
        
        return name.includes(qLower) || model.includes(qLower) || brand.includes(qLower) || sku.includes(qLower);
      });
      
      setFilteredProducts(results);
    }
  }, [queryParam, products, loading]);

  // Tags ยอดนิยม (จำลอง) สำหรับให้กดค้นหาเร็วๆ (ไม่ต้องจัดหมวดหมู่ แต่ใช้ tags ตาม Request)
  const popularTags = ["แบตเตอรี่", "อแดปเตอร์", "คีย์บอร์ด", "หน้าจอ", "พัดลม", "บานพับ", "สายแพร", "Dell", "HP", "Lenovo", "Acer", "Asus", "Apple"];

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Search className="text-brand" size={28} strokeWidth={2.5} />
              ผลการค้นหา
            </h1>
          </div>
        </div>

        {/* Search Query Display */}
        {queryParam && (
          <div className="bg-brand-light/20 border border-brand-light/50 p-4 rounded-xl flex items-center gap-3">
            <span className="text-slate-600 font-medium">คำค้นหา:</span>
            <span className="text-brand font-bold text-lg px-3 py-1 bg-white rounded-lg shadow-sm border border-brand-light/30">
              "{queryParam}"
            </span>
            <span className="text-sm text-slate-500 ml-auto">
              พบ {filteredProducts.length} รายการ
            </span>
          </div>
        )}

        {/* Popular Tags (พยายามติด tags เพื่อเรียกใช้งาน) */}
        {!queryParam && !loading && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> แท็กยอดนิยม (ค้นหาด่วน)
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <Link 
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-brand-light hover:bg-brand-light/10 text-slate-700 font-medium rounded-full text-sm transition-all shadow-sm hover:shadow active:scale-95"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin w-10 h-10 mb-4 text-brand" /> 
              <span className="text-sm font-medium animate-pulse">กำลังประมวลผลฐานข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 shadow-sm">
              <p className="font-semibold text-lg mb-1">เกิดข้อผิดพลาด</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : !queryParam ? (
            <div className="bg-slate-50 text-slate-500 p-12 rounded-3xl text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
              <Search size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-bold tracking-wide text-slate-700">ระบุคำค้นหาเพื่อหาสินค้า</p>
              <p className="text-sm mt-1">สามารถพิมพ์ชื่อรุ่น แบรนด์ หรือ รหัสสินค้าได้เลย</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <ProductList products={filteredProducts} />
          ) : (
            <div className="bg-slate-50 text-slate-500 p-12 rounded-3xl text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
              <Sparkles size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-bold tracking-wide text-slate-700">ไม่พบสินค้าที่ตรงกับ "{queryParam}"</p>
              <p className="text-sm mt-1">ลองใช้คำค้นหาที่กว้างขึ้น หรือค้นหาด้วยแบรนด์/แท็ก</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchPage;
