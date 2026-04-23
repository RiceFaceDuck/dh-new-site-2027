import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './config';

export const marketingService = {
  /**
   * 🎁 1. ดึงข้อมูลกฎของแถม (Freebies) ที่เปิดใช้งานอยู่
   * (เชื่อมต่อกับข้อมูลจาก freebieService.js ของระบบหลังบ้าน)
   */
  getActiveFreebies: async () => {
    try {
      const q = query(
        collection(db, 'freebies'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const freebies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 🧠 In-memory Sort: เรียงลำดับจากยอดสั่งซื้อขั้นต่ำมากไปน้อย
      // ป้องกันปัญหา Firestore Missing Index Error
      return freebies.sort((a, b) => (b.minSpend || 0) - (a.minSpend || 0));
    } catch (error) {
      console.error("🔥 Error fetching active freebies:", error);
      return [];
    }
  },

  /**
   * 📢 2. ดึงข้อมูลโปรโมชันส่วนลด (Promotions) ที่เปิดใช้งานอยู่
   * (เชื่อมต่อกับข้อมูลจาก promotionService.js ของระบบหลังบ้าน)
   */
  getActivePromotions: async () => {
    try {
      const q = query(
        collection(db, 'promotions'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // เรียงจากโปรโมชันที่สร้างล่าสุดขึ้นก่อน (ถ้ามี Timestamp)
      return promotions.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("🔥 Error fetching active promotions:", error);
      return [];
    }
  }
};