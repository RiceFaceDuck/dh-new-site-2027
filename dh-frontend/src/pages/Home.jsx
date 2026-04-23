import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import HeroBanner from '../components/HeroBanner';
import CategoryList from '../components/CategoryList';
import ProductList from '../components/ProductList';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="w-full animate-in fade-in duration-500">
      <HeroBanner />
      <CategoryList />
      <ProductList products={products} loading={loading} />
    </div>
  );
};

export default Home;