/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ChevronRight, ShoppingCart, CheckCircle2, Loader2, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { cartService } from '../firebase/cartService';

import ProductAdCard from './ads/ProductAdCard';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

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

const ProductList = ({ products, loading, error, title = "", showTitle = false }) => {
  const navigate = useNavigate();
  const [addingState, setAddingState] = useState({}); 
  
  // 📢 Ad System States
  const [ads, setAds] = useState([]); 
  const [displayRatio, setDisplayRatio] = useState(10); // ค่าเริ่มต้น 10:1

  useEffect(() => {
    const fetchAdsAndSettings = async () => {
      try {
        // 1. ดึงการตั้งค่าพื้นที่โฆษณา (Global Settings)
        const settingsSnap = await getDoc(doc(db, 'settings', 'marketing'));
        if (settingsSnap.exists() && settingsSnap.data().displayRatio) {
           setDisplayRatio(Number(settingsSnap.data().displayRatio));
        }

        // 2. ดึงโฆษณาที่กำลัง Active
        const adsQuery = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(adsQuery);
        const fetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. 🎯 กรองเฉพาะโฆษณาที่ "งบยังไม่หมด" (Smart Pre-filtering)
        const validAds = fetchedAds.filter(ad => {
           const cost = Number(ad.costPerImpression) || 1;
           const maxImp = Math.floor((Number(ad.creditLimit) || 0) / cost);
           return (ad.impressions || 0) < maxImp;
        });

        // 4. สลับลำดับโฆษณา (Shuffle) เพื่อความยุติธรรมในการแสดงผล
        const shuffledAds = validAds.sort(() => 0.5 - Math.random());
        setAds(shuffledAds);

      } catch (err) {
        console.error("🔥 Failed to load ads and settings for list:", err);
      }
    };

    // โหลดโฆษณาเฉพาะเมื่อมีสินค้ากำลังจะแสดงผล เพื่อประหยัด Reads
    if (!loading && products?.length > 0) {
       fetchAdsAndSettings();
    }
  }, [loading, products?.length]);

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
        {showTitle && title && (
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center">
              <span className="w-1.5 h-5 bg-cyber-blue rounded-sm mr-3 inline-block shadow-glow-blue"></span>
              {title}
            </h2>
          </div>
        )}
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

  // 🧠 Core Display Engine: ผสมสินค้า + โฆษณา
  const renderMixedGrid = () => {
    if (!products || products.length === 0) return [];
    
    const displayElements = [];
    let adIndex = 0;
    
    products.forEach((product, index) => {
      // --- 1. เรนเดอร์สินค้าหลักของบริษัท (ของเดิม) ---
      const rawImage = getVal(product, ['imageurl', 'image', 'images', 'img', 'picture', 'photo', 'url', 'รูปภาพ']);
      const imageUrl = Array.isArray(rawImage) && rawImage.length > 0 ? rawImage[0] : (typeof rawImage === 'string' ? rawImage : '/logo.png');
      
      const rawPrice = getVal(product, ['retailprice', 'regularprice', 'ราคาปลีก', 'price', 'saleprice', 'ราคา', 'sellprice']);
      const price = (rawPrice !== null && rawPrice !== undefined) ? Number(String(rawPrice).replace(/[^0-9.-]+/g,"")) : 0;
      
      const rawStock = getVal(product, ['stock', 'quantity', 'qty', 'amount', 'คงเหลือ', 'สต๊อก', 'inventory', 'instock', 'available', 'จำนวน', 'จำนวนสินค้า', 'stockquantity']);
      let stock = 0;
      if (typeof rawStock === 'object' && rawStock !== null) {
        stock = rawStock.quantity || 0;
      } else {
        stock = (rawStock !== null && rawStock !== undefined) ? Number(String(rawStock).replace(/[^0-9.-]+/g,"")) : 0;
      }
      const hasStock = stock > 0;

      const name = getVal(product, ['name', 'title', 'productname', 'ชื่อสินค้า']) || 'Unknown Product Data';
      const brand = getVal(product, ['brand', 'manufacturer', 'ยี่ห้อ', 'category']) || 'OEM';
      const sku = getVal(product, ['sku', 'code', 'productcode', 'รหัสสินค้า', 'barcode']) || product.id?.substring(0, 8);
      
      const mappedProduct = { ...product, id: product.id, name, price, stock, imageUrl, brand, sku };

      displayElements.push(
        <div 
          key={`product-${product.id}-${index}`} 
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
      
      // --- 2. แทรกป้ายโฆษณา (Ad Injection) ---
      // แทรกโฆษณาเมื่อจำนวนสินค้าครบตาม displayRatio ที่ตั้งไว้ และยังมีโฆษณาที่งบเหลืออยู่
      if (displayRatio > 0 && (index + 1) % displayRatio === 0 && ads.length > 0) {
        const adToDisplay = ads[adIndex % ads.length];
        displayElements.push(
           <ProductAdCard 
              key={`ad-inject-${adToDisplay.id}-${index}`} 
              ad={adToDisplay} 
              wrapperClassName="col-span-1 h-full animate-in fade-in zoom-in duration-500" 
           />
        );
        adIndex++;
      }
    });

    // ✨ Smart Fallback: ถ้าร้านมีสินค้าน้อยกว่าอัตราส่วน แต่เรามีโฆษณาที่พร้อมแสดง ให้ยัดโฆษณาปิดท้ายให้ 1 ตัว
    // เพื่อให้คนที่จ่ายค่าโฆษณามีโอกาสได้แสดงผล แม้หน้านั้นจะมีสินค้าน้อย
    if (products.length > 0 && displayRatio > 0 && products.length < displayRatio && ads.length > 0) {
        const adToDisplay = ads[adIndex % ads.length];
        displayElements.push(
           <ProductAdCard 
              key={`ad-fallback-${adToDisplay.id}`} 
              ad={adToDisplay} 
              wrapperClassName="col-span-1 h-full animate-in fade-in zoom-in duration-500" 
           />
        );
    }
    
    return displayElements;
  };

  return (
    <div className="mb-12 md:mb-20">
      {(showTitle || title) && (
        <div className="flex justify-between items-end mb-5 px-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyber-blue rounded-sm mr-2 inline-block shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
            {title || 'สินค้าแนะนำ / มาใหม่'}
          </h2>
          <button className="text-sm font-semibold text-cyber-blue hover:text-sky-600 flex items-center group transition-colors">
            ดูทั้งหมด 
            <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 px-1">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? ( 
        <div className="w-full bg-slate-50 border border-slate-200 rounded-sm p-10 flex flex-col items-center justify-center shadow-inner">
           <Cpu size={32} className="text-slate-300 mb-3" />
           <p className="text-slate-500 font-tech uppercase tracking-widest text-xs font-bold">No Products Found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 px-1">
          {renderMixedGrid()}
        </div>
      )}
    </div>
  );
};

export default ProductList;