import { db } from './config';
import { sharedCategoryService } from 'dh-shared/src/firebase/categoryService';

export const categoryService = {
  getActiveCategories: async () => {
    const rawCategories = await sharedCategoryService.getActiveCategories(db);
    // Deduplicate by name to prevent dirty data from displaying multiple times on the storefront
    const uniqueData = Array.from(new Map(rawCategories.map(item => [
      (item.name || '').trim().toLowerCase(), 
      item
    ])).values());
    return uniqueData;
  }
};