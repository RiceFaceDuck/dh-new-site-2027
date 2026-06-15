import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import CategoryList from '../components/CategoryList';
import ProductList from '../components/ProductList';
// 🚀 ใช้ where แบบครอบคลุม
import { collection, getDocs, query, limit, where } from 'firebase/firestore'; 
import { db } from '../firebase/config';

// นำเข้า Component ป้ายแบนเนอร์โฆษณา (BILLBOARD)
import BannerAdWidget from '../components/ads/BannerAdWidget';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, "products");
        // ดึงสินค้า 12 ชิ้นแรกมาเป็นสินค้าแนะนำ
        const q = query(productsRef, limit(12)); 

        const querySnapshot = await getDocs(q);
        
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // 🚀 โหลดแค่ตอนแรกเท่านั้น

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-8 md:space-y-12">
        
        {/* ========================================================
            โครงสร้าง 4 ป้าย (Grid Layout) - Hero + 3 BannerAds
            ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:gap-5">
          <div className="md:col-span-2 lg:row-span-2 h-full">
            <HeroBanner />
          </div>
          <div className="h-full">
            <BannerAdWidget />
          </div>
          <div className="hidden md:block h-full">
            <BannerAdWidget />
          </div>
          <div className="hidden lg:block lg:col-span-2 lg:row-span-1 h-full">
            <BannerAdWidget />
          </div>
        </div>
        {/* ======================================================== */}

        {/* หมวดหมู่ยอดนิยม */}
        <div>
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">หมวดหมู่ยอดนิยม</h2>
            <button className="text-dh-blue hover:text-blue-700 font-semibold text-sm md:text-base transition-colors">ดูทั้งหมด</button>
          </div>
          <div className="-mx-4 sm:mx-0">
            {/* 🚀 CategoryList จะดูแลตัวเองเรื่องการเปลี่ยนหน้าผ่าน React Router <Link> */}
            <CategoryList />
          </div>
        </div>

        {/* สินค้าใหม่ / แนะนำ */}
        <div>
          <div className="flex justify-between items-end mb-4 md:mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-1">
                สินค้าใหม่ล่าสุด
              </h2>
              <p className="text-slate-500 text-sm md:text-base">อะไหล่และอุปกรณ์ไอทีคุณภาพสูง คัดสรรมาเพื่อคุณ</p>
            </div>
            <button className="text-dh-blue hover:text-blue-700 font-semibold text-sm md:text-base transition-colors whitespace-nowrap">ดูสินค้าทั้งหมด</button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-[350px] flex flex-col">
                  <div className="w-full aspect-square bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-auto"></div>
                  <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl text-center border border-red-100 shadow-sm">
              <p className="font-semibold text-lg mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : products.length > 0 ? (
            <ProductList products={products} />
          ) : (
            <div className="bg-slate-50 text-slate-500 p-8 rounded-2xl text-center border border-slate-100 shadow-sm">
              <p className="text-lg font-medium">ยังไม่มีสินค้าในหมวดหมู่นี้</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;