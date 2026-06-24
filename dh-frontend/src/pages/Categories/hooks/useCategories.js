import { useState, useEffect } from 'react';
import { categoryService } from '../../../firebase/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Check session storage first to save reads (Caching policy for cost optimization)
        const cached = sessionStorage.getItem('dh_homepage_categories_cache');
        if (cached) {
          setCategories(JSON.parse(cached));
          setLoading(false);
          // Optional: Fetch in background to update cache without blocking UI
          categoryService.getActiveCategories().then(data => {
            sessionStorage.setItem('dh_homepage_categories_cache', JSON.stringify(data));
            setCategories(data);
          });
          return;
        }

        const data = await categoryService.getActiveCategories();
        sessionStorage.setItem('dh_homepage_categories_cache', JSON.stringify(data));
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("ไม่สามารถดึงข้อมูลหมวดหมู่ได้ในขณะนี้");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
