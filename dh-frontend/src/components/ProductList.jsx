import React, { useState, useEffect } from 'react';
import { ChevronRight, ShoppingCart, CheckCircle2, Loader2, Cpu, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { cartService } from '../firebase/cartService';

// 🚀 นำเข้า Component โฆษณา และ Service
import ProductAdCard from './ads/ProductAdCard';
import { marketingService } from '../firebase/marketingService';

// 🚀 ULTRA SMART FIELD MAPPER (V2): ค้นหาและแปลงข้อมูลครอบจักรวาล (กันกระสุน)
const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }
  return null;
};

const ProductList = ({ products, loading, error }) => {
  const navigate = useNavigate();
  const [addingState, setAddingState] = useState({}); 
  const [ads, setAds] = useState([]); // State สำหรับเก็บโฆษณาที่จะมาแทรก

  // 1. 📡 โหลดโฆษณาจาก Smart Cache เมื่อ Component ทำงาน
  useEffect(() => {
    const fetchAdsForList = async () => {
      try {
        const activeAds = await marketingService.getActiveAds();
        setAds(activeAds || []);
      } catch (err) {
        console.error("Failed to load ads for list:", err);
      }
    };
    fetchAdsForList();
  }, []);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation(); 
    
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนหยิบสินค้าใส่ตะกร้า");
      return;
    }

    setAddingState(prev => ({ ...prev, [product.id]: 'loading' }));
    
    try {
      await cartService.addToCart(user.uid, product, 1);
      
      setAddingState(prev => ({ ...prev, [product.id]: 'success' }));
      setTimeout(() => {
        setAddingState(prev => ({ ...prev, [product.id]: null }));
      }, 2000);
    } catch (err) {
      console.error("🔥 Error add to cart:", err);
      alert("เกิดข้อผิดพลาด: " + err.message);
      setAddingState(prev => ({ ...prev, [product.id]: null }));
    }
  };

  const SkeletonCard = () => (
    <div className="rounded-md border border-slate-200 bg-white p-3 flex flex-col h-[280px]">
      <div className="w-full h-36 bg-slate-100 rounded-sm animate-pulse mb-3"></div>
      <div className="w-1/3 h-3 bg-slate-100 rounded-sm animate-pulse mb-2"></div>
      <div className="w-full h-4 bg-slate-100 rounded-sm animate-pulse mb-1"></div>
      <div className="w-2/3 h-4 bg-slate-100 rounded-sm animate-pulse mb-auto"></div>
      <div className="flex justify-between items-end mt-4">
        <div className="w-1/2 h-6 bg-slate-100 rounded-sm animate-pulse"></div>
        <div className="w-9 h-9 bg-slate-100 rounded-sm animate-pulse"></div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="mb-12 md:mb-20 px-1">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center">
            <span className="w-1.5 h-5 bg-cyber-blue rounded-sm mr-3 inline-block shadow-glow-blue"></span>
            สินค้าแนะนำ / มาใหม่
          </h2>
        </div>
        <div className="w-full bg-slate-900 border border-red-500/50 rounded-sm p-6 md:p-10 flex flex-col items-center justify-center shadow-tech-card relative overflow-hidden">
           <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none"></div>
           <div className="relative z-10 flex flex-col items-center text-center w-full">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-sm flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                 <ShieldAlert size={32} className="text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg md:text-xl mb-2 font-tech uppercase tracking-wider">Database Connection Failed</h3>
              <p className="text-slate-400 text-xs md:text-sm font-medium max-w-lg leading-relaxed mb-6">
                 ระบบไม่สามารถเชื่อมต่อและดึงข้อมูลสินค้าได้: <br/>
                 <span className="text-red-400 font-tech break-all">{error}</span>
              </p>
           </div>
        </div>
      </div>
    );
  }

  // 2. 🎯 อัลกอริทึมผสมข้อมูล (Mix Data): แทรกโฆษณาเข้าไประหว่างสินค้า
  const mixProductsAndAds = () => {
    if (!products || products.length === 0) return [];
    
    const displayItems = [];
    let adIndex = 0;
    
    products.forEach((product, index) => {
      displayItems.push({ type: 'product', data: product });
      
      // แทรกโฆษณาทุกๆ 4 ชิ้นสินค้า (ปรับตัวเลขได้ตามต้องการ)
      if ((index + 1) % 4 === 0 && ads.length > 0) {
        displayItems.push({ type: 'ad', data: ads[adIndex % ads.length] });
        adIndex++;
      }
    });
    
    return displayItems;
  };

  const displayItems = mixProductsAndAds();

  return (
    <div className="mb-12 md:mb-20">
      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <span className="w-1.5 h-5 bg-cyber-blue rounded-sm mr-3 inline-block shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
          สินค้าแนะนำ / มาใหม่
        </h2>
        <button className="text-sm font-semibold text-cyber-blue hover:text-sky-600 flex items-center group transition-colors">
          ดูทั้งหมด 
          <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-1">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayItems.length === 0 ? ( 
        <div className="w-full bg-slate-50 border border-slate-200 rounded-sm p-10 flex flex-col items-center justify-center shadow-inner">
           <Cpu size={32} className="text-slate-300 mb-3" />
           <p className="text-slate-500 font-tech uppercase tracking-widest text-xs font-bold">No Products Found in Database</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-1">
          {displayItems.map((item, index) => {
            
            // =====================================
            // 🌟 กรณีเป็นป้ายโฆษณา (แทรกอัตโนมัติ)
            // =====================================
            if (item.type === 'ad') {
              return (
                <div key={`ad-${item.data.id}-${index}`} className="col-span-1 h-full animate-in fade-in duration-500">
                  <ProductAdCard ad={item.data} />
                </div>
              );
            }

            // =====================================
            // 🌟 กรณีเป็นสินค้าปกติ
            // =====================================
            const product = item.data;
            
            // 🚀 ULTRA SMART FIELD MAPPER
            const rawImage = getVal(product, ['imageurl', 'image', 'images', 'img', 'picture', 'photo', 'url', 'รูปภาพ']);
            const imageUrl = Array.isArray(rawImage) && rawImage.length > 0 ? rawImage[0] : (typeof rawImage === 'string' ? rawImage : '/logo.png');
            
            const rawPrice = getVal(product, ['retailprice', 'regularprice', 'ราคาปลีก', 'price', 'saleprice', 'ราคา', 'sellprice']);
            const price = (rawPrice !== null && rawPrice !== undefined) ? Number(String(rawPrice).replace(/[^0-9.-]+/g,"")) : 0;
            
            const rawStock = getVal(product, ['stock', 'quantity', 'qty', 'amount', 'คงเหลือ', 'สต๊อก', 'inventory', 'instock', 'available', 'จำนวน', 'จำนวนสินค้า', 'stockquantity']);
            let stock = 0;
            if (typeof rawStock === 'object' && rawStock !== null) {
              stock = rawStock.quantity || 0; // รองรับกรณีเก็บ stock เป็น object
            } else {
              stock = (rawStock !== null && rawStock !== undefined) ? Number(String(rawStock).replace(/[^0-9.-]+/g,"")) : 0;
            }
            const hasStock = stock > 0;

            const name = getVal(product, ['name', 'title', 'productname', 'ชื่อสินค้า']) || 'Unknown Product Data';
            const brand = getVal(product, ['brand', 'manufacturer', 'ยี่ห้อ', 'category']) || 'OEM';
            const sku = getVal(product, ['sku', 'code', 'productcode', 'รหัสสินค้า', 'barcode']) || product.id?.substring(0, 8);
            
            const mappedProduct = {
              ...product,
              id: product.id,
              name,
              price,
              stock,
              imageUrl,
              brand,
              sku
            };

            return (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`, { state: { product: mappedProduct } })} 
                className="group cursor-pointer bg-white rounded-md border border-slate-200 overflow-hidden flex flex-col hover:border-cyber-emerald hover:shadow-glow-emerald transition-all duration-300 relative animate-in fade-in"
              >
                <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden border-b border-slate-100">
                  <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>
                  <img 
                    src={imageUrl} 
                    alt={name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply relative z-10"
                    onError={(e) => { e.target.src = '/logo.png' }}
                  />
                  
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm border border-slate-200/50 shadow-sm z-20">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-cyber-emerald animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-600 font-tech uppercase">
                      {hasStock ? 'READY' : 'OUT OF STOCK'}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center p-4 text-center z-30">
                    <Cpu size={24} className="text-cyber-blue mb-2" strokeWidth={1.5} />
                    <span className="text-white text-[10px] font-tech mb-2 tracking-widest border-b border-slate-700 pb-1 w-full uppercase">QUICK SPECS</span>
                    <span className="text-slate-300 text-xs font-medium mt-1">Brand: <span className="text-white uppercase">{brand}</span></span>
                    <span className="text-slate-300 text-xs font-medium">Stock: <span className={hasStock ? 'text-cyber-emerald' : 'text-red-400'}>{stock} Units</span></span>
                    
                    <div className="mt-4 px-4 py-1.5 border border-cyber-emerald text-cyber-emerald text-[10px] rounded-sm font-bold uppercase tracking-wider bg-emerald-500/10">
                      View Details
                    </div>
                  </div>
                </div>
                
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <div className="text-[10px] md:text-xs text-slate-400 font-tech mb-1 uppercase tracking-wider">
                    SKU: {sku}
                  </div>
                  
                  <h3 className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-cyber-emerald transition-colors leading-relaxed">
                    {name}
                  </h3>
                  
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-none mb-1">Retail Price</span>
                      <span className="text-sm md:text-lg font-bold text-cyber-blue font-tech leading-none">
                        ฿{price ? price.toLocaleString() : '0'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => handleAddToCart(e, mappedProduct)}
                      disabled={!hasStock || addingState[product.id] === 'loading' || addingState[product.id] === 'success'}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-sm flex items-center justify-center transition-all duration-300 shadow-sm z-20 relative ${
                        addingState[product.id] === 'success'
                          ? 'bg-emerald-100 text-cyber-emerald border border-emerald-200'
                          : !hasStock 
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-cyber-emerald hover:text-white hover:border-cyber-emerald'
                      }`}
                      aria-label="Add to cart"
                    >
                      {addingState[product.id] === 'loading' ? (
                         <Loader2 size={16} className="animate-spin text-cyber-emerald" />
                      ) : addingState[product.id] === 'success' ? (
                         <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : (
                         <ShoppingCart size={16} strokeWidth={2} className={`${hasStock ? 'group-hover:scale-110' : ''} transition-transform`} />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductList;