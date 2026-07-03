import { useState, useEffect } from 'react';
import { categoryService } from '../../../firebase/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        const CACHE_KEY = 'dh_homepage_categories_cache';
        const CACHE_TIME_KEY = 'dh_homepage_categories_time';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที
        
        const cachedStr = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        // ใช้ Cache ทันทีและไม่ต้องดึงเบื้องหลังซ้ำ หากเวลายังไม่เกิน 5 นาที (0 Reads & 0 Re-renders)
        if (cachedStr && cachedTime && (now - parseInt(cachedTime) < CACHE_DURATION)) {
          if (isMounted) {
            setCategories(JSON.parse(cachedStr));
            setLoading(false);
          }
          return;
        }

        const data = await categoryService.getActiveCategories();
        
        if (isMounted) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(CACHE_TIME_KEY, now.toString());
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        if (isMounted) {
          setError("ไม่สามารถดึงข้อมูลหมวดหมู่ได้ในขณะนี้");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    
    return () => { isMounted = false; };
  }, []);

  return { categories, loading, error };
};
