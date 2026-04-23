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
      
      {/* 1. Hero Banner - ออกแบบใหม่ให้มีแสง สี เงา ขอบ ที่ดูมืออาชีพ */}
      <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 flex items-center group shadow-xl shadow-emerald-900/10 border border-emerald-900/5">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 z-10 opacity-100"></div>
        {/* แสง/เงา ประดับ */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full z-10"></div>
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full z-10"></div>
        
        <div className="relative z-20 px-6 sm:px-8 md:px-12 w-full">
          <span className="inline-block px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-white/95 text-[10px] md:text-xs font-bold tracking-widest mb-3 uppercase border border-white/10 shadow-sm">
            Partner Program 2026
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 leading-tight tracking-tight drop-shadow-md">
            ศูนย์รวมอะไหล่ไอที ราคาส่ง
          </h1>
          <p className="text-emerald-100/80 text-xs md:text-sm max-w-md hidden sm:block font-medium drop-shadow-sm">
            สมัครพาร์ทเนอร์วันนี้ รับส่วนลดพิเศษและระบบบริหารจัดการร้านค้าฟรี
          </p>
        </div>
      </div>

      {/* 2. Categories - ปรับให้โค้งมนขึ้น มีเงาเล็กน้อย */}
      <div className="mb-10 md:mb-14">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mb-5 px-1 drop-shadow-sm">หมวดหมู่หลัก</h2>
        <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center cursor-pointer group">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:-translate-y-1.5 shadow-sm group-hover:shadow-md border border-slate-100/80 ${cat.color}`}>
                {React.cloneElement(cat.icon, { className: 'w-6 h-6 md:w-8 md:h-8' })}
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-slate-600 group-hover:text-emerald-700 text-center tracking-wide transition-colors">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recommended Products - ยกระดับ UI โชว์สถานะสินค้า */}
      <div className="mb-10 md:mb-14">
        <div className="flex items-end justify-between mb-5 px-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight drop-shadow-sm">สินค้าแนะนำ</h2>
          <button className="text-[10px] md:text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center transition-colors bg-emerald-50 px-2 py-1 rounded-md">
            ดูทั้งหมด <ChevronRight size={14} className="ml-0.5" />
          </button>
        </div>

        {loading ? (
          // Skeleton Loading
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
                <div className="w-full aspect-square bg-slate-50 rounded-xl mb-3"></div>
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
              
              // Stock Status Logic
              const stock = product.stock || 0;
              let stockStatus = 'หมด';
              let stockColor = 'text-red-600 bg-red-50 border-red-100';
              if (stock > 10) {
                stockStatus = 'มีสินค้า';
                stockColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
              } else if (stock > 0) {
                stockStatus = 'เหลือน้อย';
                stockColor = 'text-amber-600 bg-amber-50 border-amber-100';
              }

              return (
                <div 
                  key={product.id} 
                  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                  className="group bg-white rounded-2xl p-3 md:p-4 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col relative h-full cursor-pointer overflow-hidden"
                >
                  {/* Badge & Stock Status */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
                    {product.isPartnerOnly ? (
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider">
                        PARTNER
                      </span>
                    ) : <span></span>}

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${stockColor}`}>
                      {stockStatus}
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="aspect-square mb-3 bg-white flex items-center justify-center relative mix-blend-multiply pt-4">
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-110 transition duration-500 drop-shadow-sm"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error' }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col">
                    <p className="text-[9px] text-slate-400 mb-1 font-medium tracking-wide uppercase">{product.sku || 'SKU: N/A'}</p>
                    <h3 className="text-xs md:text-sm font-semibold text-slate-700 line-clamp-2 leading-relaxed mb-3 flex-1 group-hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between relative">
                      <div className="flex flex-col">
                        {product.regularPrice && (
                          <span className="text-[10px] text-slate-400 line-through mb-0.5">
                            ฿{product.regularPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-base md:text-lg font-black text-slate-900 leading-none">
                          ฿{product.retailPrice?.toLocaleString() || '0'}
                        </span>
                      </div>
                      
                      {/* ปุ่ม Add to cart */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('เพิ่มลงตะกร้าแล้ว');
                        }}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart size={16} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
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