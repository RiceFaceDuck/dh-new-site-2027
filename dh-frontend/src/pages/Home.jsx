import React, { useState, useEffect } from 'react';
import { ChevronRight, Cpu, Wrench, PenTool, MonitorSmartphone, ShoppingCart } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  // --- LOGIC: คงเดิม 100% ห้ามแก้ไขส่วนนี้เด็ดขาด ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "products"), limit(8));
        const querySnapshot = await getDocs(q);
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  // ------------------------------------------

  // หมวดหมู่ที่ถูกคัดกรองใหม่ เรียบง่าย สีเบาบาง
  const categories = [
    { id: 1, name: 'อะไหล่ภายใน', icon: <Cpu size={24} strokeWidth={1.5} />, color: 'text-blue-600 bg-blue-50/50 hover:bg-blue-50' },
    { id: 2, name: 'อุปกรณ์ภายนอก', icon: <MonitorSmartphone size={24} strokeWidth={1.5} />, color: 'text-purple-600 bg-purple-50/50 hover:bg-purple-50' },
    { id: 3, name: 'เครื่องมือช่าง', icon: <PenTool size={24} strokeWidth={1.5} />, color: 'text-amber-600 bg-amber-50/50 hover:bg-amber-50' },
    { id: 4, name: 'บริการรับซ่อม', icon: <Wrench size={24} strokeWidth={1.5} />, color: 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50' },
  ];

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* 1. Hero Banner - ย่อขนาดลงให้กระชับ (h-32 ถึง h-56) และเรียบหรูที่สุด */}
      <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-56 bg-slate-900 rounded-[1rem] md:rounded-[1.5rem] overflow-hidden mb-8 md:mb-10 flex items-center group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-slate-900 z-10 opacity-95"></div>
        <div className="absolute -right-20 top-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full"></div>
        
        <div className="relative z-20 px-6 md:px-12 w-full">
          <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded text-white/90 text-[9px] md:text-[10px] font-bold tracking-widest mb-2 uppercase border border-white/5">
            Partner Program 2026
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-1.5 leading-tight tracking-tight">
            ศูนย์รวมอะไหล่ไอที ราคาส่ง
          </h1>
          <p className="text-slate-300 text-[10px] md:text-xs max-w-sm hidden sm:block font-medium">
            สมัครพาร์ทเนอร์วันนี้ รับส่วนลดพิเศษและระบบบริหารจัดการร้านค้าฟรี
          </p>
        </div>
      </div>

      {/* 2. Categories - ดีไซน์แบบธรรมดาที่สุด แต่ชัดเจน */}
      <div className="mb-10 md:mb-12">
        <h2 className="text-base md:text-lg font-bold text-gray-800 tracking-tight mb-4 px-1">หมวดหมู่หลัก</h2>
        <div className="grid grid-cols-4 gap-3 md:gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center cursor-pointer group">
              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[1rem] flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:-translate-y-1 border border-gray-100/50 ${cat.color}`}>
                {cat.icon}
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-gray-600 group-hover:text-gray-900 text-center tracking-wide">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recommended Products - สะอาดตา เส้นขอบบาง เน้นรูปและราคา */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-4 px-1">
          <h2 className="text-base md:text-lg font-bold text-gray-800 tracking-tight">สินค้าแนะนำ</h2>
          <button className="text-[10px] md:text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center transition-colors">
            ดูทั้งหมด <ChevronRight size={14} className="ml-0.5" />
          </button>
        </div>

        {loading ? (
          // Skeleton Loading
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white p-3 md:p-4 rounded-[1rem] border border-gray-100 animate-pulse">
                <div className="w-full aspect-square bg-slate-50 rounded-lg mb-3"></div>
                <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mt-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          // Product Grid
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {products.map((product) => {
              const imageUrl = product.images?.[0] || product.image || 'https://via.placeholder.com/400x400?text=DH';
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                  className="group bg-white rounded-[1rem] p-3 md:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col relative h-full cursor-pointer"
                >
                  {/* Badge */}
                  {product.isPartnerOnly && (
                    <span className="absolute top-3 left-3 z-10 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider border border-emerald-100/50">
                      PARTNER
                    </span>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square mb-3 bg-white flex items-center justify-center relative mix-blend-multiply">
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error' }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col">
                    <p className="text-[9px] text-gray-400 mb-1 font-medium tracking-wide uppercase">{product.sku || 'SKU: N/A'}</p>
                    <h3 className="text-[11px] md:text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed mb-3 flex-1 group-hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between relative">
                      <div className="flex flex-col">
                        {product.regularPrice && (
                          <span className="text-[9px] text-gray-400 line-through mb-0.5">
                            ฿{product.regularPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm md:text-base font-black text-gray-900 leading-none">
                          ฿{product.retailPrice?.toLocaleString() || '0'}
                        </span>
                      </div>
                      
                      {/* ปุ่ม Add to cart (Micro-interaction: โชว์เด่นขึ้นเมื่อ Hover) */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('เพิ่มลงตะกร้าแล้ว');
                        }}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart size={14} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;