/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { ChevronRight, ShoppingCart, CheckCircle2, Loader2, Cpu, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { cartService } from '../firebase/cartService';

import ProductAdCard from './ads/ProductAdCard';
// 🚀 HOTFIX: แก้ไขการ Import ให้ถูกต้อง (Default Import)
import useAdInjection from '../hooks/useAdInjection';
import LazyImage from './common/LazyImage';

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
  
  // 🧠 1. เรียกใช้งานสมองกลแทรกโฆษณา (จะดึงสินค้าโปรโมทและนามบัตรมาให้)
  const { productsWithAds, loadingAds } = useAdInjection(products || []);

  // 🧠 2. ผสานสถานะ Loading ทั้งจากฝั่งสินค้าและฝั่งโฆษณา
  const isLoading = loading || loadingAds;
  
  // 🧠 3. ป้องกันกรณีโฆษณาโหลดไม่ขึ้น ให้มี fallback ไปแสดงสินค้าเพียวๆ ได้
  const displayProducts = productsWithAds && productsWithAds.length > 0 ? productsWithAds : (products || []);

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
              <span className="w-1.5 h-5 bg-brand rounded-sm mr-3 inline-block shadow-glow-brand"></span>
              {title}
            </h2>
          </div>
        )}
        <div className="w-full bg-slate-50 border border-red-200 rounded-xl p-6 md:p-10 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
           <div className="relative z-10 flex flex-col items-center text-center w-full">
              <div className="w-16 h-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center mb-4">
                 <ShieldAlert size={32} className="text-red-500" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg md:text-xl mb-2 tracking-wide">Database Connection Failed</h3>
              <p className="text-slate-500 text-xs md:text-sm font-medium max-w-lg leading-relaxed mb-6">
                 ระบบไม่สามารถเชื่อมต่อและดึงข้อมูลสินค้าได้: <br/>
                 <span className="text-red-500 break-all">{error}</span>
              </p>
           </div>
        </div>
      </div>
    );
  }

  // 🧠 Core Display Engine: ลูปจาก Array ที่ถูกผสมโฆษณามาแล้ว
  const renderMixedGrid = () => {
    return displayProducts.map((item, index) => {
      // 🟢 ตรวจจับโฆษณา: หากเป็นโฆษณา ให้โยนเข้า Component ProductAdCard
      if (item.isSponsoredAd) {
        return (
          <div key={`ad-inject-${item.id || index}-${index}`} className="col-span-1 h-full animate-in fade-in zoom-in duration-500">
            <ProductAdCard ad={item} />
          </div>
        );
      }

      // 🔵 หากไม่ใช่โฆษณา ให้แสดงเป็นสินค้าปกติ (คงโครงสร้างเดิมของท่านไว้ 100%)
      const product = item;
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

      return (
        <div 
          key={`product-${product.id}-${index}`} 
          onClick={() => navigate(`/product/${product.id}`, { state: { product: mappedProduct } })} 
          className="group cursor-pointer bg-slate-100 p-2 md:p-3 rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-brand-light hover:shadow-premium-hover transition-all duration-300 relative animate-in fade-in"
        >
          <div className="relative aspect-square w-full bg-white rounded-lg flex items-center justify-center p-4 overflow-hidden mb-2">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-light/20 to-transparent opacity-50 pointer-events-none"></div>
            <LazyImage 
              src={imageUrl} 
              alt={name} 
              className="w-full h-full group-hover:scale-105 transition-transform duration-500 mix-blend-multiply relative z-10"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
            
            <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200/50 shadow-sm z-20">
              <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase">
                {hasStock ? 'READY' : 'OUT OF STOCK'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col flex-grow px-1">
            <h3 className="text-sm md:text-base font-bold text-slate-800 line-clamp-1 group-hover:text-brand transition-colors leading-relaxed">
              {name}
            </h3>
            <div className="text-[10px] md:text-xs text-slate-600 line-clamp-1 mb-2">
              SKU: {sku}
            </div>
            <div className="mt-auto flex flex-col pt-1">
              <span className="text-base md:text-lg font-bold text-slate-800 leading-none mb-3">
                ฿{price ? price.toLocaleString() : '0'}
              </span>
              <button 
                onClick={(e) => handleAddToCart(e, mappedProduct)}
                disabled={!hasStock || addingState[product.id] === 'loading' || addingState[product.id] === 'success'}
                className={`w-full py-1.5 md:py-2 rounded-md flex items-center justify-center transition-all duration-300 shadow-sm z-20 text-xs font-bold uppercase tracking-widest ${
                  addingState[product.id] === 'success'
                    ? 'bg-green-500 text-white'
                    : !hasStock 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 hover:shadow-md'
                }`}
                aria-label="Add to cart"
              >
                {addingState[product.id] === 'loading' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : addingState[product.id] === 'success' ? (
                    <span className="flex items-center gap-1"><CheckCircle2 size={16} strokeWidth={2.5} /> ADDED</span>
                ) : (
                    "ADD TO CART"
                )}
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="mb-12 md:mb-20">
      {(showTitle || title) && (
        <div className="flex justify-between items-end mb-5 px-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand rounded-sm mr-2 inline-block shadow-glow-brand"></span>
            {title || 'สินค้าแนะนำ / มาใหม่'}
          </h2>
          <button className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center group transition-colors">
            ดูทั้งหมด 
            <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 px-1">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayProducts.length === 0 ? ( 
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center shadow-inner">
           <Cpu size={32} className="text-slate-300 mb-3" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Products Found</p>
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