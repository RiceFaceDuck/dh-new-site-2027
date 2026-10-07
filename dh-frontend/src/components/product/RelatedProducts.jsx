import ProductList from '../ProductList';
import { useRelatedProducts } from '../../pages/hooks/useRelatedProducts';
import useInView from '../../hooks/useInView';

export default function RelatedProducts({ currentProductId, category }) {
  const [inViewRef, inView] = useInView({ rootMargin: '200px 0px' });
  const { products, loading, error } = useRelatedProducts(currentProductId, category, inView);

  if (!loading && products.length === 0) return null;

  return (
    <div ref={inViewRef} className="mt-8 pt-8">
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
