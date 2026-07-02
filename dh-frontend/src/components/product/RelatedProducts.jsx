import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { productService } from '../../firebase/productService';
import ProductList from '../ProductList';

export default function RelatedProducts({ currentProductId, category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        setLoading(true);
        // Query products in the same category
        const q = query(
          collection(db, 'products'),
          where('category', '==', category),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        const related = [];
        snapshot.forEach(doc => {
          if (doc.id !== currentProductId && related.length < 4) {
            related.push(productService.normalizeProductData({ id: doc.id, ...doc.data() }));
          }
        });
        
        setProducts(related);
      } catch (err) {
        console.error("Error fetching related products:", err);
        setError("ไม่สามารถโหลดสินค้าที่เกี่ยวข้องได้");
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [category, currentProductId]);

  if (!loading && products.length === 0) return null;

  return (
    <div className="mt-8 pt-8">
      <ProductList 
        products={products} 
        loading={loading} 
        error={error} 
        title="สินค้าที่เกี่ยวข้อง" 
        showTitle={true} 
      />
    </div>
  );
}
