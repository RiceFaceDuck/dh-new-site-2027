import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'redirect_urls';

export const redirectURLsService = {
  // ดึงข้อมูลทั้งหมด
  getRedirects: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching redirects:", error);
      throw error;
    }
  },

  // เพิ่ม Redirect ใหม่
  addRedirect: async (data) => {
    try {
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      
      await historyService.addLog(
        'RedirectURLs', 
        'Add', 
        docRef.id, 
        `เพิ่ม Redirect ใหม่: ${data.oldUrl} -> ${data.newUrl}`, 
        auth.currentUser?.uid
      );
      
      return { id: docRef.id, ...payload };
    } catch (error) {
      console.error("🔥 Error adding redirect:", error);
      throw error;
    }
  },

  // อัปเดต Redirect
  updateRedirect: async (id, data) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const payload = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, payload);
      
      await historyService.addLog(
        'RedirectURLs', 
        'Update', 
        id, 
        `แก้ไข Redirect: ${data.oldUrl} -> ${data.newUrl}`, 
        auth.currentUser?.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error updating redirect:", error);
      throw error;
    }
  },

  // ลบ Redirect
  deleteRedirect: async (id, oldUrl) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      
      await historyService.addLog(
        'RedirectURLs', 
        'Delete', 
        id, 
        `ลบ Redirect ของ: ${oldUrl}`, 
        auth.currentUser?.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error deleting redirect:", error);
      throw error;
    }
  },

  // เปิด/ปิด สถานะ
  toggleStatus: async (id, isActive, oldUrl) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { 
        isActive, 
        updatedAt: serverTimestamp() 
      });
      
      const statusText = isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
      await historyService.addLog(
        'RedirectURLs', 
        'ToggleStatus', 
        id, 
        `${statusText} Redirect ของ: ${oldUrl}`, 
        auth.currentUser?.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error toggling status:", error);
      throw error;
    }
  }
};
