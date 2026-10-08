import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../../../firebase/categoryService';

export const useCategories = () => {
  const { 
    data: categories = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getActiveCategories(),
    staleTime: 60 * 60 * 1000, // 1 ชั่วโมงใน RAM
    cacheTime: 24 * 60 * 60 * 1000, // เก็บใน Memory 24 ชั่วโมง
  });

  const errorMessage = error ? "ไม่สามารถดึงข้อมูลหมวดหมู่ได้ในขณะนี้" : null;

  return { 
    categories, 
    loading, 
    error: errorMessage,
    refetch: () => {
      categoryService.clearLocalCache();
      return refetch();
    }
  };
};
