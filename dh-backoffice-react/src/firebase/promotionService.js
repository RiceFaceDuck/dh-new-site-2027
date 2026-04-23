import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { todoService } from './todoService';

const COLLECTION_NAME = 'promotions';

export const promotionService = {
  // 📥 ดึงโปรโมชันทั้งหมด (สำหรับหน้าจัดการของผู้จัดการ)
  getAllPromotions: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching promotions:", error);
      return [];
    }
  },

  // 🟢 ดึงเฉพาะโปรโมชันที่กำลังเปิดใช้งาน (ประหยัด Read ใช้หน้า POS)
  getActivePromotions: async () => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      // Sort in memory ประหยัด Index
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return promos.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    } catch (error) {
      console.error("🔥 Error fetching active promotions:", error);
      return [];
    }
  },

  // ✨ สร้างโปรโมชันใหม่
  createPromotion: async (promoData, user) => {
    try {
      const payload = {
        ...promoData,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      
      // 📝 บันทึกประวัติ
      await historyService.addLog(
        'Promotion', 'Create', docRef.id, 
        `สร้างโปรโมชันใหม่: ${promoData.title} (${promoData.type})`, 
        user.uid
      );

      // 🔔 สร้าง Todo แจ้งเตือนพนักงานทุกคน (Broadcast)
      await todoService.createManualTodo({
        title: `📣 แจ้งโปรโมชันใหม่: ${promoData.title}`,
        description: `มีโปรโมชันใหม่ถูกเพิ่มเข้าระบบ\nเงื่อนไข: ${promoData.description}\nสามารถเรียกใช้งานได้ที่หน้า เปิดบิล (POS)`,
        priority: 'Medium',
        assignedTo: 'all'
      }, user);

      return docRef.id;
    } catch (error) {
      console.error("🔥 Error creating promotion:", error);
      throw error;
    }
  },

  // 📝 แก้ไขโปรโมชัน / เปิด-ปิด สถานะ
  updatePromotion: async (promoId, updates, user, actionName = 'แก้ไข') => {
    try {
      const docRef = doc(db, COLLECTION_NAME, promoId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      await historyService.addLog(
        'Promotion', 'Update', promoId, 
        `${actionName}โปรโมชัน`, 
        user.uid
      );

      return true;
    } catch (error) {
      console.error("🔥 Error updating promotion:", error);
      throw error;
    }
  },

  // 🗑️ ลบโปรโมชัน
  deletePromotion: async (promoId, promoTitle, user) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, promoId));
      
      await historyService.addLog(
        'Promotion', 'Delete', promoId, 
        `ลบโปรโมชัน: ${promoTitle}`, 
        user.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error deleting promotion:", error);
      throw error;
    }
  }
};