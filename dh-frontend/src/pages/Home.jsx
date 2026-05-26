import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import CategoryList from '../components/CategoryList';
import ProductList from '../components/ProductList';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// 🚀 นำเข้า Component ป้ายแบนเนอร์โฆษณา (BILLBOARD)
import BannerAdWidget from '../components/ads/BannerAdWidget';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "products");
        // จำกัดแค่ 12 ตัวเพื่อให้หน้าแรกโหลดไว (สามารถทำ Pagination หรือ Load More เพิ่มได้ในอนาคต)
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
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-10 animate-fade-in">
      {/* 🚀 ส่วนที่ 1: แบนเนอร์หลักของร้านค้า (Hero Banner) */}
      <HeroBanner />
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-10">
        
        {/* 🚀 ส่วนที่ 2: ป้ายแบนเนอร์โฆษณาแบบ Unified (BILLBOARD Ads) */}
        {/* ถูกจัดวางให้อยู่ในจุดที่เด่นที่สุด รองจาก Hero Banner */}
        <div className="mt-2 mb-6">
          <BannerAdWidget />
        </div>

        {/* 🚀 ส่วนที่ 3: หมวดหมู่สินค้า */}
        <CategoryList />
        
        {/* 🚀 ส่วนที่ 4: รายการสินค้า (ที่มีการแทรกโฆษณานามบัตรและสินค้าโปรโมทแล้วผ่าน useAdInjection) */}
        <ProductList products={products} loading={loading} error={error} />
        
      </div>
    </div>
  );
};

export default Home;