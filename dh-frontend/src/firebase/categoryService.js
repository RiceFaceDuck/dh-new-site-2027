import { db } from './config';
import { sharedCategoryService } from 'dh-shared/src/firebase/categoryService';

export const categoryService = {
  getActiveCategories: async () => {
    return await sharedCategoryService.getActiveCategories(db);
  }
};