import ProductList from '../ProductList';
import { useRelatedProducts } from '../../pages/hooks/useRelatedProducts';

export default function RelatedProducts({ currentProductId, category }) {
  const { products, loading, error } = useRelatedProducts(currentProductId, category);

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
