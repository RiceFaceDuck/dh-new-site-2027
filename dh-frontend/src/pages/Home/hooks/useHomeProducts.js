import { useState, useEffect } from 'react';
import { featuredQueryService } from '../../../firebase/featuredQueryService';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

export const useHomeProducts = (defaultLimit = 12) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const { isSlowConnection } = useNetworkStatus();

  // 🌐 ปรับลดจำนวนข้อมูลที่ต้องโหลดหากผู้ใช้ใช้อินเทอร์เน็ตช้า (เช่น 3G / Data Saver)
  const adaptiveLimit = isSlowConnection ? Math.min(defaultLimit, 4) : defaultLimit;

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
          const finalLimit = isSlowConnection ? Math.min(config.displayLimit || adaptiveLimit, 4) : (config.displayLimit || adaptiveLimit);
          const fetchedProducts = await featuredQueryService.getRandomFeaturedProducts(finalLimit);
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
  }, [adaptiveLimit, isSlowConnection]);

  return { products, loading, error, isActive, isSlowConnection };
};
