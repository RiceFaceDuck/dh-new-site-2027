import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch, 
  serverTimestamp,
  where,
  limit,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'homepage_categories';

export const categoryService = {
  /**
   * A. ดึงข้อมูลหมวดหมู่ทั้งหมด (ทั้ง Active และ Inactive)
   * เรียงลำดับตาม order แบบ asc
   */
  getAllCategories: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw error;
    }
  },

  /**
   * B. อัปโหลดไฟล์รูปภาพไปยัง Storage (Fallback)
   */
  uploadIcon: async (file) => {
    if (!file) return null;
    try {
      const fileRef = ref(storage, `categories/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error in uploadIcon:', error);
      throw error;
    }
  },

  /**
   * Helper Internal: ลบไฟล์รูปภาพออกจาก Storage
   */
  deleteIconByUrl: async (url) => {
    if (!url) return;
    // ป้องกันการลบรูปลง Google Drive พลาด (เช็คว่าเป็น link ของ firebase เท่านั้น)
    if (!url.includes('firebasestorage')) return;
    
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn('Warning: Failed to delete old icon from storage:', error);
    }
  },

  /**
   * C. สร้างหมวดหมู่ใหม่ (รองรับ Type)
   */
  createCategory: async (categoryData, iconFile) => {
    try {
      let imageUrl = null;
      if (iconFile) {
        imageUrl = await categoryService.uploadIcon(iconFile);
      }

      const allCats = await categoryService.getAllCategories();
      const maxOrder = allCats.length > 0 ? Math.max(...allCats.map(c => c.order || 0)) : 0;

      const isActive = categoryData.isActive !== undefined ? categoryData.isActive : true;

      const newData = {
        name: categoryData.name,
        type: categoryData.type || '', // 🚀 ฟิลด์ Type
        buttonShape: categoryData.buttonShape || 'circle', // 🚀 ทรงของปุ่ม
        filters: categoryData.filters || [], // 🚀 ตัวกรองแนะนำ
        imageUrl: imageUrl, 
        isActive: isActive, 
        status: isActive ? 'active' : 'inactive', 
        order: maxOrder + 1,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newData);
      
      const uid = auth.currentUser?.uid;
      await historyService.addLog('Category', 'Create', 'category', `เพิ่มหมวดหมู่ใหม่: ${categoryData.name}`, uid);
      
      return { id: docRef.id, ...newData };
    } catch (error) {
      console.error('Error in createCategory:', error);
      throw error;
    }
  },

  /**
   * D. อัปเดตข้อมูลหมวดหมู่ (รองรับ Type)
   */
  updateCategory: async (id, categoryData, newIconFile, oldIconUrl) => {
    try {
      let imageUrl = categoryData.imageUrl !== undefined ? categoryData.imageUrl : oldIconUrl;

      if (newIconFile) {
        imageUrl = await categoryService.uploadIcon(newIconFile);
        if (oldIconUrl) {
          await categoryService.deleteIconByUrl(oldIconUrl);
        }
      }

      const updatePayload = {
        name: categoryData.name,
        type: categoryData.type || '', // 🚀 ฟิลด์ Type
        buttonShape: categoryData.buttonShape || 'circle', // 🚀 ทรงของปุ่ม
        filters: categoryData.filters || [], // 🚀 ตัวกรองแนะนำ
        imageUrl: imageUrl,
        updatedAt: serverTimestamp()
      };

      if (categoryData.isActive !== undefined) {
        updatePayload.isActive = categoryData.isActive;
        updatePayload.status = categoryData.isActive ? 'active' : 'inactive';
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updatePayload);
      
      const uid = auth.currentUser?.uid;
      await historyService.addLog('Category', 'Update', 'category', `แก้ไขหมวดหมู่: ${categoryData.name}`, uid);
      
      return { id, ...updatePayload };
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw error;
    }
  },

  /**
   * E. ลบหมวดหมู่และรูปภาพที่เกี่ยวข้อง
   */
  deleteCategory: async (categoryData) => {
    try {
      const id = categoryData.id;
      const type = categoryData.type;
      
      // 1. Relation Check (Cost: 1 Read)
      // เปลี่ยนจาก 'categoryId' เป็น 'category_lower' เพื่อให้สอดคล้องกับ products
      if (type) {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('category_lower', '==', type.trim().toLowerCase()), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          throw new Error('ไม่สามารถลบได้ เนื่องจากยังมีสินค้าเชื่อมโยงอยู่ในหมวดหมู่นี้');
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { isActive: false, deletedAt: serverTimestamp() });

      // 2. Clean up from settings/product_categories list
      try {
        const settingsRef = doc(db, 'settings', 'product_categories');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.categories && Array.isArray(data.categories)) {
            const filteredCategories = data.categories.filter(c => 
              c !== categoryData.name && 
              c !== categoryData.type && 
              c !== type
            );
            await updateDoc(settingsRef, { categories: filteredCategories });
          }
        }
      } catch (settingsError) {
        console.error('🔥 Error updating product_categories settings on category delete:', settingsError);
      }
      
      const uid = auth.currentUser?.uid;
      await historyService.addLog('Category', 'Delete', 'category', `ลบหมวดหมู่: ID=${id} และเคลียร์ชื่อหมวดหมู่ออกจากระบบตั้งค่าหลัก`, uid);
      
      return true;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      throw error;
    }
  },

  /**
   * F. จัดเรียงลำดับหมวดหมู่ใหม่
   */
  updateCategoryOrder: async (reorderedCategories) => {
    try {
      const batch = writeBatch(db);
      reorderedCategories.forEach(({ id, newOrder }) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.update(docRef, { order: newOrder });
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error in updateCategoryOrder:', error);
      throw error;
    }
  },

  /**
   * G. สลับสถานะการเปิด/ปิด ใช้งานหมวดหมู่
   */
  toggleCategoryStatus: async (id, currentStatus) => {
    try {
      const isCurrentlyActive = currentStatus === 'active' || currentStatus === true;
      const newStatus = isCurrentlyActive ? 'inactive' : 'active';
      const newIsActive = !isCurrentlyActive;

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { 
        status: newStatus,
        isActive: newIsActive,
        updatedAt: serverTimestamp()
      });

      const uid = auth.currentUser?.uid;
      await historyService.addLog('Category', 'Update', 'category', `เปลี่ยนสถานะหมวดหมู่ ID=${id} เป็น ${newStatus}`, uid);

      return { status: newStatus, isActive: newIsActive };
    } catch (error) {
      console.error('Error in toggleCategoryStatus:', error);
      throw error;
    }
  }
};