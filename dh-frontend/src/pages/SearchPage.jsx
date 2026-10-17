import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ProductList from '../components/ProductList';
import LazyImage from '../components/common/LazyImage';
import { Search, Sparkles, ChevronLeft, Database, Wrench, Phone, MessageCircle, MapPin, X, ShieldCheck, Store, Clock } from 'lucide-react';
import { filterProductsByQuery, findRelatedProducts } from '../utils/searchMatcher';
import { getStorefrontCatalog, subscribeStorefrontCatalogUpdates } from '../services/storefrontCatalogService';
import { marketingService } from '../firebase/marketingService';

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
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [technicianAds, setTechnicianAds] = useState([]);

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

  // 🪪 โหลดข้อมูลนามบัตรช่าง/พาร์ทเนอร์
  useEffect(() => {
    let isMounted = true;
    marketingService.getActivePartnerAds('BUSINESS_CARD').then(ads => {
      if (isMounted && Array.isArray(ads) && ads.length > 0) {
        setTechnicianAds(ads);
      }
    }).catch(err => {
      console.warn('⚠️ [SearchPage] Could not load technician ads:', err?.message || err);
    });
    return () => { isMounted = false; };
  }, []);

  // 👁️ บันทึก Telemetry ยอดวิว (Impression) เมื่อเปิด Modal นามบัตรช่าง (พร้อม Anti-Fraud ในตัว)
  useEffect(() => {
    if (showTechnicianModal && Array.isArray(technicianAds) && technicianAds.length > 0) {
      technicianAds.forEach(ad => {
        if (ad?.id) {
          marketingService.trackAdView('partner_ads', ad.id, {
            type: ad.type || 'BUSINESS_CARD',
            ownerId: ad.ownerId || ''
          });
        }
      });
    }
  }, [showTechnicianModal, technicianAds]);

  // 🎯 บันทึก Telemetry ยอดคลิกติดต่อช่าง (Ad Click)
  const handleTechnicianContactClick = (ad, actionType, targetUrl) => {
    if (ad?.id) {
      marketingService.trackAdClick('partner_ads', ad.id, {
        type: ad.type || 'BUSINESS_CARD',
        ownerId: ad.ownerId || '',
        action: actionType,
        targetUrl: targetUrl
      });
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
          if (result.products.length === 0) {
            setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้ กรุณาตรวจสอบการเชื่อมต่อหรือรีเฟรชหน้าเว็บ");
            setLoading(false);
          } else {
            performSearch(result.products, result.meta);
          }
        } else {
          setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้ กรุณาลองใหม่อีกครั้ง");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching products for search:", err);
        setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้ กรุณาลองใหม่อีกครั้ง");
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
          {/* กล่องค้นหา (ฝั่งซ้าย) - ปรับเงา สี และมุมโค้งมล 0.1 */}
          <div className="w-full lg:w-[420px] shrink-0 bg-slate-50/90 p-2 rounded-[0.1rem] border border-slate-300/80 shadow-sm">
            <form onSubmit={handleLocalSearchSubmit} className="relative w-full group">
              <input 
                type="text" 
                value={typedQuery}
                onChange={(e) => setTypedQuery(e.target.value)}
                placeholder="ค้นหาอะไหล่, รหัสสินค้า, หรือรุ่นโน๊ตบุ๊ค..." 
                className="w-full bg-white border border-slate-200/90 text-slate-800 px-5 py-3 rounded-[0.1rem] focus:outline-hidden focus:ring-2 focus:ring-brand/50 focus:border-brand focus:bg-white transition-all duration-300 text-sm placeholder-slate-400 group-hover:border-slate-300 shadow-2xs"
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
                  className={`px-3 py-1.5 border font-medium rounded-md text-xs transition-all shadow-2xs active:scale-95 ${
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
          <div className="bg-gradient-to-r from-brand-light/30 via-slate-50 to-brand-light/20 border border-brand-light/60 p-3 sm:p-4 rounded-[0.1rem] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-medium text-sm">คำค้นหา:</span>
              <span className="text-brand font-bold text-base sm:text-lg px-3 py-0.5 bg-white rounded-lg shadow-2xs border border-brand-light/30">
                "{queryParam}"
              </span>
              
              {/* ข้อความแจ้งสถานะเมื่อไม่พบสินค้าตรงเป๊ะ */}
              {!loading && filteredProducts.length === 0 && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold animate-fade-in">
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span>ไม่พบสินค้าที่ตรงกับคำนี้</span>
                  {relatedProducts.length > 0 && (
                    <span className="text-amber-700 font-normal hidden sm:inline">— แนะนำสินค้าใกล้เคียงในหมวดเดียวกันด้านล่างนี้ค่ะ</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTechnicianModal(true)}
                    className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Wrench size={11} /> ติดต่อช่างทันที
                  </button>
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
            <div className="bg-red-50 text-red-600 p-6 rounded-md text-center border border-red-200/80 shadow-xs max-w-md mx-auto my-6 space-y-3">
              <p className="font-semibold text-base mb-1">เกิดข้อผิดพลาดในการโหลดสินค้า</p>
              <p className="text-xs text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getStorefrontCatalog({ forceRefresh: true }).then(res => {
                    if (res && res.products && res.products.length > 0) {
                      setProducts(res.products);
                      setCatalogMeta(res.meta);
                      const matched = filterProductsByQuery(res.products, queryParam);
                      setFilteredProducts(matched);
                      const matchedIds = matched.map(m => m.id || m.sku);
                      setRelatedProducts(findRelatedProducts(res.products, queryParam, matchedIds));
                      setLoading(false);
                    } else {
                      setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้ กรุณาตรวจสอบการเชื่อมต่อ");
                      setLoading(false);
                    }
                  }).catch(() => {
                    setError("ไม่สามารถโหลดข้อมูลสินค้าเพื่อค้นหาได้ กรุณาลองใหม่อีกครั้ง");
                    setLoading(false);
                  });
                }}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : loading && filteredProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-md p-3 border border-slate-200 shadow-xs flex flex-col">
                  <div className="w-full aspect-square bg-slate-100 rounded-md mb-3 flex items-center justify-center">
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
              <div className="text-center py-10 px-5 bg-gradient-to-b from-slate-50/95 via-white to-slate-50/80 rounded-[0.1rem] border border-slate-200/90 shadow-md shadow-slate-200/40 max-w-xl mx-auto">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  ไม่พบสินค้าตรงเป๊ะสำหรับ "{queryParam}"
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
                  ลองตรวจสอบตัวสะกด หรือใช้คำค้นหาที่สั้นลง เช่น ชื่อแบรนด์ หรือรหัสอะไหล่
                </p>

                {/* 🌟 การ์ดติดต่อช่างทันที (แสดงป้ายโฆษณานามบัตร) */}
                <div className="my-5 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-[0.1rem] flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                        หาอะไหล่ไม่เจอ หรือต้องการให้ช่างช่วยเช็ค?
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">ฟรี</span>
                      </div>
                      <div className="text-xs text-emerald-700">ส่งรูปโน๊ตบุ๊คหรืออาการเสียให้ช่างประจำร้านช่วยเทียบได้เลย</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTechnicianModal(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 inline-flex items-center justify-center gap-1.5"
                  >
                    <Phone size={13} /> ติดต่อช่างทันที
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="text-xs text-slate-400 font-medium mr-1">ลองค้นหาด้วยคำเหล่านี้:</span>
                  {["อะแดปเตอร์", "พัดลม", "คีย์บอร์ด", "แบตเตอรี่", "หน้าจอ"].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setTypedQuery(term);
                        setSearchParams({ q: term });
                      }}
                      className="px-3 py-1 bg-white hover:bg-brand-light/20 hover:text-brand border border-slate-200 hover:border-brand-light/50 rounded-lg text-xs font-semibold text-slate-600 transition-all cursor-pointer shadow-2xs"
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
            <div className="text-center py-12 px-5 bg-gradient-to-b from-slate-50/95 via-white to-slate-50/80 rounded-[0.1rem] border border-slate-200/90 shadow-md shadow-slate-200/40 max-w-2xl mx-auto my-6">
              <div className="w-16 h-16 bg-brand-light/30 text-brand rounded-[0.1rem] flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <Search size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                ค้นหาอะไหล่โน๊ตบุ๊คที่คุณต้องการ
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                พิมพ์ชื่ออะไหล่ แบรนด์ รหัสสินค้า หรือเลือกค้นหาตามหมวดหมู่ด้านล่างนี้ได้ทันที
              </p>

              {/* 🌟 ปุ่มติดต่อช่างทันที (แสดง ป้ายโฆษณานามบัตร) */}
              <div className="mb-7 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-[0.1rem] flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                      ต้องการปรึกษาช่างผู้เชี่ยวชาญโดยตรง?
                    </div>
                    <div className="text-xs text-emerald-700">สอบถามอาการเสีย เบอร์โทร หรือส่งข้อความคุยกับช่างได้ทันที</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTechnicianModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 inline-flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} /> ติดต่อช่างทันที
                </button>
              </div>

              {/* ป้ายหมวดหมู่ด่วน (ยังเอา shortcut ไว้ให้ลูกค้าใช้งานอยู่) */}
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
                    className="p-3.5 rounded-[0.1rem] bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-brand-light/60 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
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

        {/* 🪪 Modal ป้ายโฆษณานามบัตรช่าง */}
        {showTechnicianModal && (
          createPortal(
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setShowTechnicianModal(false)}
            >
              <div 
                className="bg-white rounded-[0.1rem] border border-slate-200/90 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight">ป้ายนามบัตรช่าง / พันธมิตร DH</h3>
                      <p className="text-[11px] text-slate-300">ปรึกษาปัญหาซ่อม เทียบสเปกอะไหล่โดยตรง</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTechnicianModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-4 bg-slate-50/50">
                  {technicianAds.length > 0 ? (
                    technicianAds.map((ad) => (
                      <div key={ad.id} className="bg-white rounded-[0.1rem] border border-slate-200/90 p-4 shadow-xs space-y-3">
                        {ad.imageUrl && (
                          <div className="w-full h-36 bg-slate-100 rounded-[0.1rem] overflow-hidden border border-slate-100 flex items-center justify-center">
                            <LazyImage 
                              src={ad.imageUrl} 
                              alt={ad.title || ad.partnerName || "นามบัตรช่าง"} 
                              className="w-full h-full object-contain" 
                              fallbackSrc="/logo.png"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck size={11} /> ช่างที่ผ่านการรับรอง
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-base">{ad.title || ad.partnerName || "ร้านช่างซ่อมโน๊ตบุ๊ค"}</h4>
                          </div>
                        </div>
                        {ad.description && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-[0.1rem] border border-slate-100 leading-relaxed">
                            {ad.description}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {ad.phone && (
                            <a
                              href={`tel:${ad.phone}`}
                              onClick={() => handleTechnicianContactClick(ad, 'phone_call', `tel:${ad.phone}`)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Phone size={13} /> โทร: {ad.phone}
                            </a>
                          )}
                          {ad.messengerUrl && (
                            <a
                              href={ad.messengerUrl.startsWith('http') ? ad.messengerUrl : `https://${ad.messengerUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => handleTechnicianContactClick(ad, 'facebook_chat', ad.messengerUrl)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <MessageCircle size={13} /> แชท Facebook
                            </a>
                          )}
                          {ad.lineUrl && (
                            <a
                              href={ad.lineUrl.startsWith('http') ? ad.lineUrl : `https://${ad.lineUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => handleTechnicianContactClick(ad, 'line_chat', ad.lineUrl)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <MessageCircle size={13} /> ทัก LINE ร้าน
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    /* บัตรมาตรฐานศูนย์ช่าง DH Notebook */
                    <div className="bg-white rounded-[0.1rem] border border-slate-200/90 p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[0.1rem] bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-black text-xl shadow-xs">
                          DH
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                              <ShieldCheck size={11} /> ช่างประจำศูนย์ใหญ่ DH Notebook
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base">ศูนย์บริการและอะไหล่โน๊ตบุ๊คครบวงจร</h4>
                          <p className="text-xs text-slate-500">เชี่ยวชาญเปลี่ยนจอ, คีย์บอร์ด, แบต, ชิปบอร์ด ทุกยี่ห้อ</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/70 rounded-[0.1rem] border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-emerald-600 shrink-0" />
                          <span>เปิดบริการทุกวัน: 09:00 - 19:00 น.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Store size={13} className="text-emerald-600 shrink-0" />
                          <span>บริการส่งพัสดุด่วนทั่วประเทศ / มีหน้าร้านรองรับ</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <a
                          href="tel:0832328988"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          <Phone size={14} /> โทรปรึกษาช่าง: 083-232-8988
                        </a>
                        <a
                          href="https://line.me"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-md text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          <MessageCircle size={14} /> ทักแชท LINE ช่าง
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer note */}
                <div className="p-3 bg-slate-100/90 border-t border-slate-200/80 text-center text-[11px] text-slate-500">
                  ส่งรูปถ่ายอาการเสีย หรือโค้ดรุ่นเครื่องให้ช่างช่วยเทียบอะไหล่ได้ฟรี ไม่มีค่าใช้จ่าย
                </div>
              </div>
            </div>,
            document.body
          )
        )}

      </div>
    </div>
  );
};

export default SearchPage;
