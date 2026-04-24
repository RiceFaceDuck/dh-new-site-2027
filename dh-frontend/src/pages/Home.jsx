import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import HeroBanner from '../components/HeroBanner';
import CategoryList from '../components/CategoryList';
import ProductList from '../components/ProductList';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 🚀 เพิ่ม State จับ Error การเชื่อมต่อ

  // --- LOGIC: โครงสร้างหลักดึงข้อมูล 100% คงเดิม เพิ่มการเซ็ต Error ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, "products"), limit(8));
        const querySnapshot = await getDocs(q);
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message); // 🚀 เก็บข้อความ Error ไว้ส่งไปหน้า UI
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  // ------------------------------------------

  return (
    <div className="w-full animate-in fade-in duration-500">
      <HeroBanner />
      <CategoryList />
      {/* 🚀 ส่ง error เป็น props เพื่อให้หน้า ProductList จัดการแสดงผลอย่างชาญฉลาด */}
      <ProductList products={products} loading={loading} error={error} />
    </div>
  );
};

export default Home;