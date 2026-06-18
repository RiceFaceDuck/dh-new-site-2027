import { useState, useEffect } from 'react';
import { featuredQueryService } from '../../../firebase/featuredQueryService';

export const useHomeProducts = (defaultLimit = 12) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Config
        const config = await featuredQueryService.getConfig();
        
        if (isMounted) {
          setIsActive(config.isActive !== false);
        }

        // 2. Fetch Products only if active
        if (config.isActive !== false) {
          const limit = config.displayLimit || defaultLimit;
          const fetchedProducts = await featuredQueryService.getRandomFeaturedProducts(limit);
          if (isMounted) {
            setProducts(fetchedProducts);
          }
        }
        
      } catch (err) {
        console.error("Error fetching featured spares:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [defaultLimit]);

  return { products, loading, error, isActive };
};
