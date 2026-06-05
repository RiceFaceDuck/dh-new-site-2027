import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'homepage_categories'; 

export const categoryService = {
  /**
   * ดึงข้อมูลหมวดหมู่ยอดนิยมเฉพาะที่เปิดใช้งาน (สำหรับแสดงผลหน้าเว็บ Frontend)
   * กรองและจัดเรียงด้วย JavaScript เพื่อป้องกันปัญหา Firebase Index
   * @returns {Promise<Array>} Array ของข้อมูลหมวดหมู่
   */
  getActiveCategories: async () => {
    try {
      const categoriesRef = collection(db, COLLECTION_NAME);
      
      // ดึงข้อมูลทั้งหมดใน Collection
      const snapshot = await getDocs(categoriesRef);
      
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 1. กรองเอาเฉพาะหมวดหมู่ที่เปิดใช้งาน (status === 'active' หรือ isActive === true)
      const activeCategories = categories.filter(cat => 
        cat.status === 'active' || cat.isActive === true
      );

      // 2. จัดเรียงลำดับตามค่า order จากน้อยไปมาก
      activeCategories.sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
      });

      return activeCategories;
    } catch (error) {
      console.error('Error fetching active categories:', error);
      // คืนค่าเป็น Array ว่างเพื่อให้ UI หน้าบ้านไม่พังหากเกิด Error
      return []; 
    }
  }
};