import { useState, useEffect } from 'react';
import useInView from '../../../hooks/useInView';
import { featuredQueryService } from '../../../firebase/featuredQueryService';

/**
 * Controller hook for fetching lazy-loaded recommended products in Store Profile.
 * Encapsulates viewport intersection detection and asynchronous product querying.
 * 
 * @param {number} [limit=4] Number of featured products to fetch
 * @returns {{
 *   inViewRef: (node: HTMLElement | null) => void,
 *   inView: boolean,
 *   products: Array,
 *   loading: boolean,
 *   error: string | null
 * }}
 */
export const useStoreRecommendedProducts = (limit = 4) => {
  const [inViewRef, inView] = useInView({ rootMargin: '300px 0px' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!inView) return;

    let isMounted = true;
    const fetchRandomProducts = async () => {
      try {
        setLoading(true);
        const items = await featuredQueryService.getRandomFeaturedProducts(limit);
        if (isMounted) {
          setProducts(items || []);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching recommended products for store profile:", err);
        if (isMounted) {
          setError("ไม่สามารถโหลดสินค้าแนะนำได้");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRandomProducts();

    return () => {
      isMounted = false;
    };
  }, [inView, limit]);

  return {
    inViewRef,
    inView,
    products,
    loading,
    error
  };
};

export default useStoreRecommendedProducts;
