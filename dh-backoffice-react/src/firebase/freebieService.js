import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'freebies';

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
      const payload = {
        ...data,
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
      await updateDoc(doc(db, COLLECTION_NAME, id), { ...updates, updatedAt: serverTimestamp() });
      await historyService.addLog('Freebie', 'Update', id, `${actionName}กฎของแถม`, user.uid);
      return true;
    } catch (error) {
      throw error;
    }
  },

  deleteFreebie: async (id, title, user) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await historyService.addLog('Freebie', 'Delete', id, `ลบกฎของแถม: ${title}`, user.uid);
      return true;
    } catch (error) {
      throw error;
    }
  }
};