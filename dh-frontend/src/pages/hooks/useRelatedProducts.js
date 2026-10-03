import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { productService } from '../../firebase/productService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 Memory Cache for Related Products (10 Min TTL per category)
const relatedProductsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export const useRelatedProducts = (currentProductId, category) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) {
      setProducts([]);
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

    let isMounted = true;

    const fetchRelated = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, getCollectionPath('products')),
          where('category', '==', category),
          limit(6)
        );
        
        const snapshot = await getDocs(q);
        const rawDocs = [];
        snapshot.forEach(docSnap => {
          const item = productService.normalizeProductData({ id: docSnap.id, ...docSnap.data() });
          if (item) rawDocs.push(item);
        });

        relatedProductsCache.set(category, { data: rawDocs, timestamp: Date.now() });

        if (isMounted) {
          const related = rawDocs
            .filter(doc => doc.id !== currentProductId)
            .slice(0, 4);
          setProducts(related);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
        if (isMounted) setError("ไม่สามารถโหลดสินค้าที่เกี่ยวข้องได้");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [category, currentProductId]);

  return { products, loading, error };
};
