import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'freebies';

// Helper for validating SKUs (max 30 per 'in' query)
const validateSkus = async (skusArray) => {
  if (!Array.isArray(skusArray) || skusArray.length === 0) return { validSkus: [], removedSkus: [] };
  
  // 🚀 [Optimization] Bypass strict validation if SKUs exceed 500 to prevent massive Firebase Reads
  if (skusArray.length > 500) {
    console.warn('Skipping SKU validation for massive list (>500) to save Firebase Quota');
    return { validSkus: skusArray, removedSkus: [] };
  }

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

export const freebieService = {
  // 📥 ดึงกฎของแถมทั้งหมด
  getAllFreebies: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching freebies:", error);
      return [];
    }
  },

  // 🟢 ดึงเฉพาะของแถมที่เปิดใช้งาน (ส่งไป POS)
  getActiveFreebies: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return items.sort((a, b) => b.minSpend - a.minSpend); // เรียงจากยอดซื้อสูงสุดไปต่ำสุด
    } catch (error) {
      console.error("🔥 Error fetching active freebies:", error);
      return [];
    }
  },

  // ✨ สร้างกฎของแถมใหม่
  createFreebie: async (data, user) => {
    try {
      let finalSkus = data.applicableSkus || [];
      if (finalSkus.length > 0) {
        const { validSkus, removedSkus } = await validateSkus(finalSkus);
        finalSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Freebie', 'Validate', 'SYSTEM', 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากของแถม (${data.title}): ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      const payload = {
        ...data,
        applicableSkus: finalSkus,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      await historyService.addLog('Freebie', 'Create', docRef.id, `สร้างกฎของแถม: ${data.title}`, user.uid);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  updateFreebie: async (id, updates, user, actionName = 'แก้ไข') => {
    try {
      let finalUpdates = { ...updates };
      if (updates.applicableSkus) {
        const { validSkus, removedSkus } = await validateSkus(updates.applicableSkus);
        finalUpdates.applicableSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Freebie', 'Validate', id, 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากของแถม: ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), { ...finalUpdates, updatedAt: serverTimestamp() });
      await historyService.addLog('Freebie', 'Update', id, `${actionName}กฎของแถม`, user.uid);
      return true;
    } catch (error) {
      throw error;
    }
  },

  deleteFreebie: async (id, title, user) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), { isActive: false, deletedAt: serverTimestamp() });
      await historyService.addLog('Freebie', 'Delete', id, `ลบกฎของแถม (Soft Delete): ${title}`, user.uid);
      return true;
    } catch (error) {
      throw error;
    }
  },

  hardDeleteFreebie: async (id, title, user) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await historyService.addLog('Freebie', 'HardDelete', id, `ลบกฎของแถมถาวร: ${title}`, user.uid);
      return true;
    } catch (error) {
      throw error;
    }
  }
};