import ProductList from '../ProductList';
import { useRelatedProducts } from '../../pages/hooks/useRelatedProducts';
import useInView from '../../hooks/useInView';

export default function RelatedProducts({ currentProductId, category }) {
  const [inViewRef, inView] = useInView({ rootMargin: '300px 0px' });
  const { products, loading, error } = useRelatedProducts(currentProductId, category, inView);

  // ซ่อนเฉพาะเมื่อเลื่อนมาถึงและโหลดเสร็จแล้ว แต่ไม่มีสินค้าจริงๆ
  if (inView && !loading && products.length === 0) return null;

  return (
    <div ref={inViewRef} className="mt-8 pt-8 min-h-[20px]">
      {(loading || products.length > 0) && (
        <ProductList 
          products={products} 
          loading={loading} 
          error={error} 
          title="สินค้าที่เกี่ยวข้อง" 
          showTitle={true} 
        />
      )}
    </div>
  );
}
