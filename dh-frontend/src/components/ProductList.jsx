 
import React, { useState, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { ChevronRight, Cpu, ShieldAlert } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useCartDispatch } from '../context/CartProvider';
import { useToast } from '../context/ToastContext';

import ProductAdCard from './ads/ProductAdCard';
import ProductCard from './ProductCard';
// 🚀 HOTFIX: แก้ไขการ Import ให้ถูกต้อง (Default Import)
import useAdInjection from '../hooks/useAdInjection';
import { getRenderableImageUrl } from '../utils/imageUtils';

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
  const { addToCart } = useCartDispatch();
  const { showToast } = useToast();
  const [addingState, setAddingState] = useState({}); 
  
  // 🧠 1. เรียกใช้งานสมองกลแทรกโฆษณา (จะดึงสินค้าโปรโมทและนามบัตรมาให้)
  const { productsWithAds, loadingAds } = useAdInjection(products || []);

  // 🧠 2. ผสานสถานะ Loading ทั้งจากฝั่งสินค้าและฝั่งโฆษณา
  const isLoading = loading || loadingAds;
  
  // 🧠 3. ป้องกันกรณีโฆษณาโหลดไม่ขึ้น ให้มี fallback ไปแสดงสินค้าเพียวๆ ได้
  const displayProducts = useMemo(() => {
    return productsWithAds && productsWithAds.length > 0 ? productsWithAds : (products || []);
  }, [productsWithAds, products]);

  // ⚡ ประหยัด Performance: แปลงข้อมูลทั้งหมดล่วงหน้าผ่าน useMemo แทนการเรียก getVal นับร้อยครั้งใน Render
  const mappedDisplayProducts = useMemo(() => {
    return displayProducts.map((item) => {
      if (item.isSponsoredAd) return item; // ถ้าเป็นโฆษณา ไม่ต้องทำอะไร
      
      const product = item;
      const rawImage = getVal(product, ['imageurl', 'image', 'images', 'img', 'picture', 'photo', 'url', 'รูปภาพ']);
      let imageUrl = Array.isArray(rawImage) && rawImage.length > 0 ? rawImage[0] : (typeof rawImage === 'string' ? rawImage : '/logo.png');
      imageUrl = getRenderableImageUrl(imageUrl);
      
      const rawPrice = getVal(product, ['retailprice', 'regularprice', 'ราคาปลีก', 'price', 'saleprice', 'ราคา', 'sellprice']);
      const price = (rawPrice !== null && rawPrice !== undefined) ? Number(String(rawPrice).replace(/[^0-9.-]+/g,"")) : 0;
      
      const rawStock = getVal(product, ['stock', 'quantity', 'qty', 'amount', 'คงเหลือ', 'สต๊อก', 'inventory', 'instock', 'available', 'จำนวน', 'จำนวนสินค้า', 'stockquantity']);
      let stock = 0;
      if (typeof rawStock === 'object' && rawStock !== null) {
        stock = rawStock.quantity || 0;
      } else {
        stock = (rawStock !== null && rawStock !== undefined) ? Number(String(rawStock).replace(/[^0-9.-]+/g,"")) : 0;
      }
      
      const name = getVal(product, ['name', 'title', 'productname', 'ชื่อสินค้า']) || 'Unknown Product Data';
      const brand = getVal(product, ['brand', 'manufacturer', 'ยี่ห้อ', 'category']) || 'OEM';
      const sku = getVal(product, ['sku', 'code', 'productcode', 'รหัสสินค้า', 'barcode']) || product.id?.substring(0, 8);
      
      return { ...product, id: product.id, name, price, stock, imageUrl, brand, sku };
    });
  }, [displayProducts]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation(); 
    
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      showToast("กรุณาเข้าสู่ระบบก่อนหยิบสินค้าใส่ตะกร้า", "error");
      return;
    }

    try {
      // ⚡ Optimistic UI: หยิบใส่ตะกร้าและแสดงผลสำเร็จทันที 0 วินาที (ไม่ติด State Loading ให้กระพริบ)
      addToCart(product, 1); // ไม่ต้อง await เพราะ Context ทำงานใน Memory ทันที
      
      setAddingState(prev => ({ ...prev, [product.id]: 'success' }));
      setTimeout(() => {
        setAddingState(prev => ({ ...prev, [product.id]: null }));
      }, 2000);
    } catch (err) {
      console.error("🔥 Error add to cart:", err);
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
      setAddingState(prev => ({ ...prev, [product.id]: null }));
    }
  };

  const SkeletonCard = () => (
    <div className="rounded-md border border-slate-200 bg-slate-100 p-2 md:p-3 flex flex-col h-full shadow-xs animate-pulse">
      <div className="w-full aspect-square bg-white rounded-lg mb-3"></div>
      <div className="w-1/3 h-3 bg-white rounded-xs animate-pulse mb-2"></div>
      <div className="w-full h-4 bg-white rounded-xs animate-pulse mb-1"></div>
      <div className="w-2/3 h-4 bg-white rounded-xs animate-pulse mb-auto"></div>
      <div className="flex justify-between items-end mt-4">
        <div className="w-1/2 h-6 bg-white rounded-xs animate-pulse"></div>
        <div className="w-full h-8 bg-white rounded-md mt-3 animate-pulse"></div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="mb-12 md:mb-20 px-1">
        {showTitle && title && (
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center">
              <span className="w-1.5 h-5 bg-brand rounded-xs mr-3 inline-block shadow-glow-brand"></span>
              {title}
            </h2>
          </div>
        )}
        <div className="w-full bg-slate-50 border border-red-200 rounded-xl p-6 md:p-10 flex flex-col items-center justify-center shadow-xs relative overflow-hidden">
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



  const gridComponents = useMemo(() => ({
    List: React.forwardRef(({ style, children, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        style={{ ...style, width: '100%' }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 px-1"
      >
        {children}
      </div>
    )),
    Item: ({ children, ...props }) => (
      <div {...props} className="col-span-1 h-full animate-in fade-in duration-300">
        {children}
      </div>
    )
  }), []);

  const renderItem = (index, item) => {
    if (item.isSponsoredAd) {
      return <ProductAdCard ad={item} />;
    }
    const hasStock = item.stock > 0;
    return (
      <ProductCard 
        product={item} 
        hasStock={hasStock} 
        addingState={addingState[item.id]} 
        onAddToCart={handleAddToCart} 
      />
    );
  };

  return (
    <div className="mb-12 md:mb-20">
      {(showTitle || title) && (
        <div className="flex justify-between items-end mb-5 px-1">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand rounded-xs mr-2 inline-block shadow-glow-brand"></span>
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
      ) : mappedDisplayProducts.length === 0 ? ( 
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center shadow-inner">
           <Cpu size={32} className="text-slate-300 mb-3" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Products Found</p>
        </div>
      ) : (
        <VirtuosoGrid
          useWindowScroll
          data={mappedDisplayProducts}
          components={gridComponents}
          itemContent={renderItem}
          overscan={500}
        />
      )}
    </div>
  );
};

export default ProductList;