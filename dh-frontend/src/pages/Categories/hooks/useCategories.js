import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../../../firebase/categoryService';

export const useCategories = () => {
  const { 
    data: categories = [], 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getActiveCategories(),
    staleTime: 5 * 60 * 1000, // 5 นาที 
    cacheTime: 30 * 60 * 1000, // เก็บใน Memory 30 นาที
  });

  // แปลง error Object ของ React Query เป็น string message เพื่อให้ API เดิมยังคงใช้งานได้เหมือนเดิม
  const errorMessage = error ? "ไม่สามารถดึงข้อมูลหมวดหมู่ได้ในขณะนี้" : null;

  return { categories, loading, error: errorMessage };
};
