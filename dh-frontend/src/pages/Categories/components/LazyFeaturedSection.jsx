import { useState, useEffect, useRef } from 'react';
import { useHomeProducts } from '../../Home/hooks/useHomeProducts';
import FeaturedSpares from '../../Home/components/FeaturedSpares';

const FeaturedSectionContent = () => {
  const { 
    products: featuredProducts, 
    loading: featuredLoading, 
    error: featuredError, 
    isActive: featuredIsActive 
  } = useHomeProducts(12);

  if (!featuredIsActive) return null;

  return (
    <div className="mt-12 md:mt-16 pt-8 border-t border-slate-200/80 animate-fade-in">
      <FeaturedSpares 
        products={featuredProducts} 
        loading={featuredLoading} 
        error={featuredError} 
      />
    </div>
  );
};

export const LazyFeaturedSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || isVisible) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={containerRef} className="min-h-[20px]">
      {isVisible ? <FeaturedSectionContent /> : null}
    </div>
  );
};

export default LazyFeaturedSection;
