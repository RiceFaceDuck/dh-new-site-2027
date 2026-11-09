import React from 'react';
import ProductList from '../../../components/ProductList';
import { useStoreRecommendedProducts } from '../hooks/useStoreRecommendedProducts';

/**
 * Pure presentation component for displaying store recommended products.
 * Logic and data fetching are decoupled into useStoreRecommendedProducts hook.
 */
export default function StoreRecommendedProducts() {
  const { inViewRef, inView, products, loading, error } = useStoreRecommendedProducts();

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
