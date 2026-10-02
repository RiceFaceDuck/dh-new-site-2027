import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  writeBatch, 
  serverTimestamp,
  where,
  limit,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage, auth } from './config';
import { historyService } from './historyService';
import { warrantyService } from './warrantyService';
import { sharedCategoryService } from 'dh-shared/src/firebase/categoryService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = 'homepage_categories';

export const categoryService = {
  /**
   * A. ดึงข้อมูลหมวดหมู่ทั้งหมด (ทั้ง Active และ Inactive)
   * เรียงลำดับตาม order แบบ asc
   */
  getAllCategories: async () => {
    const categories = await sharedCategoryService.getAllCategories(db);
    const activeList = categories.filter(c => !c.deletedAt);

    try {
      const docRef = doc(db, getCollectionPath('settings'), 'product_categories');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const pCats = snap.data().categories || [];
        pCats.forEach(catStr => {
          if (catStr && typeof catStr === 'string' && catStr.trim()) {
            const cleanName = catStr.trim();
            const exists = activeList.some(c => 
              (c.name || '').trim().toLowerCase() === cleanName.toLowerCase() ||
              (c.type || '').trim().toLowerCase() === cleanName.toLowerCase()
            );
            if (!exists) {
              activeList.push({ id: `setting_${cleanName}`, name: cleanName, type: cleanName });
            }
          }
        });
      }
    } catch (err) {
      console.warn("⚠️ Warning merging product_categories into getAllCategories:", err);
    }

    return activeList;
  },

  /**
   * B. อัปโหลดไฟล์รูปภาพไปยัง Storage (พร้อมบีบอัดขนาด)
   */
  uploadIcon: async (file) => {
    if (!file) return null;
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2, // บีบอัดไอคอนหมวดหมู่ให้เล็กที่สุด ไม่เกิน 200KB
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/webp'
      });
      const newName = compressedFile.name.replace(/\.[^/.]+$/, "") + ".webp";
      const fileRef = ref(storage, `categories/${Date.now()}_${newName.replace(/\s+/g, '_')}`);
      await uploadBytes(fileRef, compressedFile);
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
    console.error("🔥 Error:", error);

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
      
      // 🚀 DUPLICATE CHECK
      const catName = categoryData.name.trim();
      const catType = (categoryData.type || categoryData.name).trim();
      const existingCat = allCats.find(c => 
        (c.name || '').trim().toLowerCase() === catName.toLowerCase() || 
        ((c.type || '').trim().toLowerCase() === catType.toLowerCase() && catType !== '')
      );

      if (existingCat) {
        try {
          const { arrayUnion, setDoc } = await import('firebase/firestore');
          const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
          await setDoc(settingsRef, {
            categories: arrayUnion(catType || catName)
          }, { merge: true });

          await warrantyService.checkAndTriggerWarrantyTaskForNewCategory(catType || catName);
        } catch (syncErr) {
          console.warn("⚠️ Warning syncing existing category to product_categories:", syncErr);
        }

        return { id: existingCat.id, name: existingCat.name || catName, type: existingCat.type || catType, isExisting: true };
      }

      // Safe order calculation avoiding NaN
      const maxOrder = allCats.reduce((max, c) => (typeof c.order === 'number' && !isNaN(c.order) ? Math.max(max, c.order) : max), 0);

      const isActive = categoryData.isActive !== undefined ? categoryData.isActive : true;

      const newData = {
        name: catName,
        type: catType, 
        buttonShape: categoryData.buttonShape || 'circle', 
        filters: categoryData.filters || [], 
        imageUrl: imageUrl, 
        isActive: isActive, 
        status: isActive ? 'active' : 'inactive', 
        order: maxOrder + 1,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newData);
      
      try {
        const { arrayUnion, setDoc } = await import('firebase/firestore');
        const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
        const targetCatName = catType || catName;
        await setDoc(settingsRef, {
          categories: arrayUnion(targetCatName)
        }, { merge: true });

        // 🔔 แจ้งเตือนผู้จัดการให้เข้าไปตั้งค่าประกันหมวดหมู่ใหม่
        await warrantyService.checkAndTriggerWarrantyTaskForNewCategory(targetCatName);
      } catch (syncErr) {
        console.error('Warning: Failed to sync category to settings:', syncErr);
      }
      
      const uid = auth.currentUser?.uid;
      await historyService.addLog('Category', 'Create', 'category', `เพิ่มหมวดหมู่ใหม่: ${catName}`, uid);
      
      sharedCategoryService.clearCache();
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

      // 🚀 DUPLICATE CHECK for Update
      if (categoryData.name || categoryData.type) {
        const allCats = await categoryService.getAllCategories();
        const catName = (categoryData.name || '').trim().toLowerCase();
        const catType = (categoryData.type || '').trim().toLowerCase();
        const isDuplicate = allCats.some(c => 
          c.id !== id && // Exclude itself
          ((c.name || '').trim().toLowerCase() === catName || 
           ((c.type || '').trim().toLowerCase() === catType && catType !== ''))
        );
        if (isDuplicate) {
          throw new Error('หมวดหมู่หรือ Type นี้ถูกใช้ไปแล้วโดยหมวดหมู่อื่น');
        }
      }

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
      
      sharedCategoryService.clearCache();
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
      // 🚀 ตรวจสอบทั้ง type และ name เผื่อว่าสินค้าผูกด้วยชื่อแทน type
      const checkVal = type ? type.trim().toLowerCase() : (categoryData.name || '').trim().toLowerCase();
      if (checkVal) {
        // ดึงหมวดหมู่ทั้งหมดเพื่อตรวจสอบว่ามีหมวดหมู่อื่นที่ Active และมี type/name ซ้ำเหลืออยู่หรือไม่
        const allCats = await categoryService.getAllCategories();
        const hasOtherActiveCat = allCats.some(c => 
          c.id !== id && 
          (c.status === 'active' || c.isActive === true) && 
          (type 
            ? (c.type || '').trim().toLowerCase() === type.trim().toLowerCase()
            : (c.name || '').trim().toLowerCase() === (categoryData.name || '').trim().toLowerCase()
          )
        );

        // ถ้าไม่มีหมวดหมู่อื่นที่ Active เหลือรองรับสินค้า และมีสินค้าผูกอยู่ ค่อยบล็อกการลบ
        if (!hasOtherActiveCat) {
          const productsRef = collection(db, getCollectionPath('products'));
          const q = query(productsRef, where('category_lower', '==', checkVal), limit(1));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            throw new Error('ไม่สามารถลบได้ เนื่องจากยังมีสินค้าเชื่อมโยงอยู่ในหมวดหมู่นี้');
          }
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { isActive: false, deletedAt: serverTimestamp() });

      // 2. Clean up from settings/product_categories list
      try {
        const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
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
      
      sharedCategoryService.clearCache();
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
  },

  /**
   * H. ดึงรายชื่อหมวดหมู่ที่ไม่ซ้ำจาก settings, homepage_categories, และ products
   */
  fetchUniqueCategories: async () => {
    const uniqueSet = new Set();
    try {
      const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && Array.isArray(settingsSnap.data().categories)) {
        settingsSnap.data().categories.forEach(item => {
          if (item && typeof item === 'string' && item.trim()) uniqueSet.add(item.trim());
        });
      }

      const homeSnap = await getDocs(query(collection(db, getCollectionPath('homepage_categories')), limit(100)));
      homeSnap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.name && d.name.trim()) uniqueSet.add(d.name.trim());
        if (d.type && d.type.trim()) uniqueSet.add(d.type.trim());
      });

      const prodSnap = await getDocs(query(collection(db, getCollectionPath('products')), limit(100)));
      prodSnap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.category && d.category.trim()) uniqueSet.add(d.category.trim());
      });
    } catch (err) {
      console.warn('⚠️ [Category Fetcher Warning]:', err);
    }
    return Array.from(uniqueSet).filter(Boolean);
  },

  /**
   * I. ซิงค์หมวดหมู่สินค้าอัตโนมัติ (Auto-Synced)
   */
  autoSyncCategories: async () => {
    try {
      const categories = await categoryService.fetchUniqueCategories();
      if (!categories || categories.length === 0) return [];

      const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
      await setDoc(settingsRef, {
        categories,
        lastAutoSyncedAt: new Date().toISOString()
      }, { merge: true });

      if (warrantyService?.checkAndTriggerWarrantyTasksForBatch) {
        await warrantyService.checkAndTriggerWarrantyTasksForBatch(categories);
      } else {
        const tasks = categories.map(cat => warrantyService.checkAndTriggerWarrantyTaskForNewCategory(cat).catch(() => {}));
        await Promise.allSettled(tasks);
      }
      console.info('⚡ [Auto-Sync] ซิงค์หมวดหมู่สินค้าอัตโนมัติสำเร็จแล้ว:', categories.length, 'หมวดหมู่');
      return categories;
    } catch (err) {
      console.warn('⚠️ [Auto-Sync Warning] ไม่สามารถซิงค์หมวดหมู่อัตโนมัติ:', err);
      throw err;
    }
  }
};