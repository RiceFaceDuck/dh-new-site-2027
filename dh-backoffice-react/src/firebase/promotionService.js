import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { todoService } from './todoService';

const COLLECTION_NAME = 'promotions';

// Helper for validating SKUs (max 30 per 'in' query)
const validateSkus = async (skusArray) => {
  if (!Array.isArray(skusArray) || skusArray.length === 0) return { validSkus: [], removedSkus: [] };
  
  const validSkus = new Set();
  for (let i = 0; i < skusArray.length; i += 30) {
    const chunk = skusArray.slice(i, i + 30);
    const q = query(collection(db, 'products'), where('sku', 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => validSkus.add(doc.data().sku));
  }
  
  const validSkusArray = Array.from(validSkus);
  const removedSkus = skusArray.filter(sku => !validSkus.has(sku));
  return { validSkus: validSkusArray, removedSkus };
};

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
      let finalSkus = promoData.applicableSkus || [];
      if (finalSkus.length > 0) {
        const { validSkus, removedSkus } = await validateSkus(finalSkus);
        finalSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Promotion', 'Validate', 'SYSTEM', 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากโปรโมชัน (${promoData.title}): ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      const payload = {
        ...promoData,
        applicableSkus: finalSkus,
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
      
      let finalUpdates = { ...updates };
      if (updates.applicableSkus) {
        const { validSkus, removedSkus } = await validateSkus(updates.applicableSkus);
        finalUpdates.applicableSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Promotion', 'Validate', promoId, 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากโปรโมชัน: ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      await updateDoc(docRef, {
        ...finalUpdates,
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

  // 🗑️ ลบโปรโมชัน (Soft Delete)
  deletePromotion: async (promoId, promoTitle, user) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, promoId), { isActive: false, deletedAt: serverTimestamp() });
      
      await historyService.addLog(
        'Promotion', 'Delete', promoId, 
        `ลบโปรโมชัน (Soft Delete): ${promoTitle}`, 
        user.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error deleting promotion:", error);
      throw error;
    }
  }
};