import { useState, useEffect } from 'react';
import ProductList from '../../../components/ProductList';
import useInView from '../../../hooks/useInView';
import { featuredQueryService } from '../../../firebase/featuredQueryService';

export default function StoreRecommendedProducts() {
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
        const items = await featuredQueryService.getRandomFeaturedProducts(4);
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
  }, [inView]);

  if (inView && !loading && products.length === 0) return null;

  return (
    <div ref={inViewRef} className="mt-8 pt-4 min-h-[20px]">
      {(loading || products.length > 0) && (
        <ProductList 
          products={products} 
          loading={loading} 
          error={error} 
          title="สินค้าแนะนำ" 
          showTitle={true} 
        />
      )}
    </div>
  );
}
