import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ProductList from '../components/ProductList';
import { Search, Sparkles, ChevronLeft, Database } from 'lucide-react';
import { filterProductsByQuery, findRelatedProducts } from '../utils/searchMatcher';
import { getStorefrontCatalog, subscribeStorefrontCatalogUpdates } from '../services/storefrontCatalogService';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalogMeta, setCatalogMeta] = useState(null);

  // สเตตสำหรับเก็บค่าคำที่กำลังพิมพ์ค้นหา
  const [typedQuery, setTypedQuery] = useState(queryParam);
  const currentQueryRef = useRef(queryParam);

  // ซิงค์สเตตที่พิมพ์เมื่อพารามิเตอร์ของ URL เปลี่ยนแปลง
  useEffect(() => {
    setTypedQuery(queryParam);
    currentQueryRef.current = queryParam;
  }, [queryParam]);

  // ฟังก์ชันย้อนกลับอัจฉริยะ (Smart Back Navigation)
  const handleSmartBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/categories');
    }
  };

  // ฟังก์ชันยิงพารามิเตอร์ค้นหาใหม่ลง URL
  const handleLocalSearchSubmit = (e) => {
    e.preventDefault();
    if (typedQuery.trim()) {
      setSearchParams({ q: typedQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  // 🚀 Enterprise Client-Side Hydration & Search Flow
  useEffect(() => {
    if (!queryParam.trim()) {
      setLoading(false);
      setProducts([]);
      setFilteredProducts([]);
      setRelatedProducts([]);
      return;
    }

    let isSubscribed = true;

    const performSearch = (catalogItems, meta) => {
      if (!isSubscribed) return;
      const q = currentQueryRef.current;
      setProducts(catalogItems);
      setCatalogMeta(meta);

      // 1. ผลลัพธ์ตรงเป๊ะ (All Tokens AND + Typo Tolerance)
      const matched = filterProductsByQuery(catalogItems, q);
      setFilteredProducts(matched);

      // 2. หากผลลัพธ์ตรงเป๊ะมีน้อยกว่า 4 รายการ ➔ แนะนำสินค้าใกล้เคียง (Related Products)
      const matchedIds = matched.map(m => m.id || m.sku);
      const related = findRelatedProducts(catalogItems, q, matchedIds);
      setRelatedProducts(related);
      setLoading(false);
    };

    const initSearchCatalog = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงจาก storefrontCatalogService (Memory / IndexedDB / Chunks)
        const result = await getStorefrontCatalog();
        if (result && Array.isArray(result.products)) {
          performSearch(result.products, result.meta);
        }
      } catch (err) {
        console.error("Error fetching products for search:", err);
        setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้");
        setLoading(false);
      }
    };

    initSearchCatalog();

    // สมัครรับข้อมูลเมื่อเบื้องหลังโหลด Chunks ครบทั้ง 2,400+ รายการ
    const unsubscribe = subscribeStorefrontCatalogUpdates((fullItems, meta) => {
      if (isSubscribed && fullItems && fullItems.length > 0) {
        performSearch(fullItems, meta);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [queryParam]);

  // ซิงค์การกรองเมื่อคำค้นหาเปลี่ยนแปลงแต่สินค้าเดิมยังมีอยู่ในสเตต
  useEffect(() => {
    if (!loading && products.length > 0) {
      if (!queryParam.trim()) {
        setFilteredProducts([]);
        setRelatedProducts([]);
        return;
      }
      
      const matched = filterProductsByQuery(products, queryParam);
      setFilteredProducts(matched);

      const matchedIds = matched.map(m => m.id || m.sku);
      const related = findRelatedProducts(products, queryParam, matchedIds);
      setRelatedProducts(related);
    }
  }, [queryParam]);

  // Tags ยอดนิยม สำหรับให้กดค้นหาเร็วๆ
  const popularTags = ["แบตเตอรี่", "อะแดปเตอร์", "คีย์บอร์ด", "หน้าจอ", "พัดลม", "บานพับ", "สายแพร", "Dell", "HP", "Lenovo", "Acer", "Asus", "Apple"];

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleSmartBack} 
              aria-label="ย้อนกลับไปหน้าก่อนหน้า"
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500 cursor-pointer active:scale-95 border border-slate-200/60 shadow-2xs"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Search className="text-brand" size={28} strokeWidth={2.5} />
              ผลการค้นหา
            </h1>
          </div>
        </div>

        {/* 🔍 แถบค้นหา + แท็กยอดนิยม (วางเคียงคู่กันทางขวา ไม่ต้องซ่อน) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
          {/* กล่องค้นหา (ฝั่งซ้าย) */}
          <div className="w-full lg:w-[420px] shrink-0 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
            <form onSubmit={handleLocalSearchSubmit} className="relative w-full group">
              <input 
                type="text" 
                value={typedQuery}
                onChange={(e) => setTypedQuery(e.target.value)}
                placeholder="ค้นหาอะไหล่, รหัสสินค้า, หรือรุ่นโน๊ตบุ๊ค..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-5 py-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand/50 focus:border-brand focus:bg-white transition-all duration-300 text-sm placeholder-slate-400 group-hover:border-slate-300"
              />
              <button type="submit" disabled={loading} aria-label="ค้นหาสินค้า" title="ค้นหาสินค้า" className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-white p-2 rounded-lg transition-colors shadow-xs active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark'}`}>
                <Search size={16} strokeWidth={2.5} />
              </button>
            </form>
          </div>

          {/* แท็กยอดนิยม (ฝั่งขวา - แสดงตลอดเวลา ไม่ซ่อน) */}
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1 shrink-0">
              <Sparkles size={14} className="text-amber-400" /> แท็กด่วน:
            </span>
            {popularTags.map(tag => {
              const isActive = queryParam === tag;
              return (
                <Link 
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className={`px-3 py-1.5 border font-medium rounded-full text-xs transition-all shadow-2xs active:scale-95 ${
                    isActive 
                      ? 'bg-brand text-white border-brand shadow-xs font-bold' 
                      : 'bg-white border-slate-200 hover:border-brand-light hover:bg-brand-light/10 text-slate-700 hover:shadow-xs'
                  }`}
                >
                  #{tag}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search Query Display & Notice Banner */}
        {queryParam && (
          <div className="bg-brand-light/20 border border-brand-light/50 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-medium text-sm">คำค้นหา:</span>
              <span className="text-brand font-bold text-base sm:text-lg px-3 py-0.5 bg-white rounded-lg shadow-2xs border border-brand-light/30">
                "{queryParam}"
              </span>
              
              {/* ข้อความแจ้งสถานะเมื่อไม่พบสินค้าตรงเป๊ะ */}
              {!loading && filteredProducts.length === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold animate-fade-in">
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span>ไม่พบสินค้าที่ตรงกับคำนี้</span>
                  {relatedProducts.length > 0 && (
                    <span className="text-amber-700 font-normal hidden sm:inline">— แนะนำสินค้าใกล้เคียงในหมวดเดียวกันด้านล่างนี้ค่ะ</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium shrink-0 ml-auto md:ml-0">
              {loading ? (
                <span>กำลังค้นหา...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md font-bold ${
                    filteredProducts.length > 0 ? 'bg-white text-slate-700 border border-slate-200/60 shadow-2xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    พบ {filteredProducts.length} รายการ
                  </span>
                  {catalogMeta?.isPartial && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white/70 px-2 py-0.5 rounded border border-slate-200/50" title="กำลังซิงค์คลังสินค้าฉบับเต็มในเบื้องหลัง">
                      <Database size={11} className="text-brand animate-pulse" /> ซิงค์คลังเบื้องหลัง...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          {error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 shadow-xs">
              <p className="font-semibold text-lg mb-1">เกิดข้อผิดพลาด</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : loading && filteredProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded-md w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4"></div>
                  <div className="mt-auto h-5 bg-slate-100 rounded-md w-1/3"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-4">
              <ProductList products={filteredProducts} />
            </div>
          ) : queryParam ? (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  ไม่พบสินค้าตรงเป๊ะสำหรับ "{queryParam}"
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  ลองตรวจสอบตัวสะกด หรือใช้คำค้นหาที่สั้นลง เช่น ชื่อแบรนด์ หรือรหัสอะไหล่
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-slate-400 font-medium mr-1">ลองค้นหาด้วยคำเหล่านี้:</span>
                  {["อะแดปเตอร์", "พัดลม", "คีย์บอร์ด", "แบตเตอรี่", "หน้าจอ"].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setTypedQuery(term);
                        setSearchParams({ q: term });
                      }}
                      className="px-3 py-1 bg-slate-50 hover:bg-brand-light/20 hover:text-brand border border-slate-200 hover:border-brand-light/50 rounded-lg text-xs font-semibold text-slate-600 transition-all cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🌟 รายการสินค้าใกล้เคียง / สินค้าในหมวดหมู่เดียวกัน (Zero Dead-End) */}
              {relatedProducts.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">
                          สินค้าใกล้เคียงที่น่าสนใจ
                        </h2>
                        <p className="text-xs text-slate-500">
                          สินค้าในหมวดหมู่ที่เกี่ยวข้องที่อาจตรงกับความต้องการของคุณ
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {relatedProducts.length} รายการ
                    </span>
                  </div>

                  <ProductList products={relatedProducts} />
                </div>
              )}
            </div>
          ) : (
            /* กรณีไม่ได้พิมพ์คำค้นหา (หน้าเปล่า) ให้แสดงหมวดหมู่แนะนำ */
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto my-6">
              <div className="w-20 h-20 bg-brand-light/30 text-brand rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xs">
                <Search size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                ค้นหาอะไหล่โน๊ตบุ๊คที่คุณต้องการ
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                พิมพ์ชื่ออะไหล่ แบรนด์ รหัสสินค้า หรือเลือกค้นหาตามหมวดหมู่ด้านล่างนี้ได้ทันที
              </p>

              {/* ป้ายหมวดหมู่ด่วน */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                {[
                  { name: "อะแดปเตอร์ชาร์จ", query: "อะแดปเตอร์", desc: "ทุกแบรนด์ แท้/เทียบ" },
                  { name: "หน้าจอ LCD/LED", query: "หน้าจอ", desc: "14.0, 15.6, ทุกขนาด" },
                  { name: "แบตเตอรี่โน๊ตบุ๊ค", query: "แบตเตอรี่", desc: "ตรงรุ่น รับประกันคุณภาพ" },
                  { name: "คีย์บอร์ด", query: "คีย์บอร์ด", desc: "ปุ่มไฟ/ธรรมดา ทุกรุ่น" },
                  { name: "พัดลมระบายความร้อน", query: "พัดลม", desc: "ตรงรุ่น ระบายความร้อนดี" },
                  { name: "บานพับและสายแพร", query: "บานพับ", desc: "แข็งแรง ทนทาน" }
                ].map((item) => (
                  <button
                    key={item.query}
                    onClick={() => {
                      setTypedQuery(item.query);
                      setSearchParams({ q: item.query });
                    }}
                    className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-light hover:bg-brand-light/10 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                  >
                    <div className="font-bold text-sm text-slate-800 group-hover:text-brand flex items-center justify-between">
                      {item.name}
                      <Sparkles size={14} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchPage;
