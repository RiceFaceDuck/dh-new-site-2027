import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { productService } from '../../firebase/productService';
import ProductList from '../ProductList';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 Quota Optimization: Local Memory Cache for Related Products (10 Min TTL)
const relatedProductsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export default function RelatedProducts({ currentProductId, category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    const cachedEntry = relatedProductsCache.get(category);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      const filtered = cachedEntry.data
        .filter(doc => doc.id !== currentProductId)
        .slice(0, 4);
      setProducts(filtered);
      setLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        setLoading(true);
        // Query products in the same category
        const q = query(
          collection(db, getCollectionPath('products')),
          where('category', '==', category),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        const rawDocs = [];
        snapshot.forEach(doc => {
          rawDocs.push(productService.normalizeProductData({ id: doc.id, ...doc.data() }));
        });

        // Store un-filtered in cache
        relatedProductsCache.set(category, { data: rawDocs, timestamp: Date.now() });

        const related = rawDocs
          .filter(doc => doc.id !== currentProductId)
          .slice(0, 4);

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
