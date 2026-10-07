import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { productService } from '../../firebase/productService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 Memory Cache for Related Products (10 Min TTL per category)
const relatedProductsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

export const useRelatedProducts = (currentProductId, category, inView = false) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🛡️ Viewport Lazy Fetch: ไม่โหลดถ้าไม่มีหมวดหมู่ หรือยังไม่เลื่อนหน้าจอลงมาถึง
    if (!category || !inView) {
      if (!category) {
        setProducts([]);
        setLoading(false);
      }
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

        // 🛡️ TIER 1: Low-Quota Shield from catalogs/cat_* (1 Read)
        const catKey = String(category || '').toLowerCase().trim();
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const catRef = doc(db, getCollectionPath('catalogs'), `cat_${catKey}`);
          const catSnap = await getDoc(catRef);
          if (catSnap.exists()) {
            const catData = catSnap.data();
            if (catData && Array.isArray(catData.items) && catData.items.length > 0) {
              const mapped = catData.items.map(p => productService.normalizeProductData({ id: p.sku, ...p }));
              relatedProductsCache.set(category, { data: mapped, timestamp: Date.now() });
              if (isMounted) {
                const related = mapped.filter(doc => doc.id !== currentProductId).slice(0, 4);
                setProducts(related);
                setError(null);
                setLoading(false);
              }
              return;
            }
          }
        } catch (catErr) {
          console.warn("Category chunk read failed for related products, falling back:", catErr);
        }

        // 🛡️ TIER 2: Direct products fallback
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
  }, [category, currentProductId, inView]);

  return { products, loading, error };
};
