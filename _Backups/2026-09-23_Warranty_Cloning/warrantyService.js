// Backup of warrantyService.js before quota alignment
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

const SETTINGS_DOC = 'warranty';

export function normalizeCategoryName(catName) {
  if (!catName || typeof catName !== 'string') return 'General';
  const clean = catName.trim();
  const lower = clean.toLowerCase();
  if (!clean) return 'General';

  if (['panel', 'screen', 'display', 'หน้าจอ', 'จอคอม', 'จอ'].includes(lower)) return 'Panel';
  if (['keyboard', 'คีย์บอร์ด'].includes(lower)) return 'Keyboard';
  if (['battery', 'แบตเตอรี่', 'แบต'].includes(lower)) return 'Battery';
  if (['adapter', 'charger', 'อแดปเตอร์', 'อะแดปเตอร์', 'สายชาร์จ'].includes(lower)) return 'Adapter';
  if (['general', 'other', 'misc', 'miscellaneous', 'อื่นๆ', 'ทั่วไป'].includes(lower)) return 'General';

  return clean;
}

const DEFAULT_WARRANTY = {
  categories: {
    'Panel': { claimDays: 180, returnDays: 7 },
    'Keyboard': { claimDays: 90, returnDays: 7 },
    'Battery': { claimDays: 180, returnDays: 7 },
    'Adapter': { claimDays: 180, returnDays: 7 },
    'General': { claimDays: 30, returnDays: 7 }
  },
  skus: {}
};

let cachedWarrantyConfig = null;

export const warrantyService = {
  getWarrantySettings: async (forceRefresh = false) => {
    if (!forceRefresh && cachedWarrantyConfig) {
      return cachedWarrantyConfig;
    }

    try {
      const docRef = doc(db, getCollectionPath('settings'), SETTINGS_DOC);
      const snap = await getDoc(docRef);
      
      let savedCategories = {};
      let savedSkus = {};

      if (snap.exists()) {
        const data = snap.data();
        savedCategories = data.categories || {};
        savedSkus = data.skus || {};
      }

      const mergedCategories = {};

      Object.entries(DEFAULT_WARRANTY.categories).forEach(([catKey, val]) => {
        const normKey = normalizeCategoryName(catKey);
        mergedCategories[normKey] = { ...val, isUnconfigured: false };
      });

      Object.entries(savedCategories).forEach(([catKey, val]) => {
        const normKey = normalizeCategoryName(catKey);
        mergedCategories[normKey] = {
          claimDays: val.claimDays ?? 30,
          returnDays: val.returnDays ?? 7,
          isUnconfigured: false
        };
      });

      try {
        const catSettingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
        const catSnap = await getDoc(catSettingsRef);
        if (catSnap.exists()) {
          const rawCategories = catSnap.data().categories;
          const list = Array.isArray(rawCategories) ? rawCategories : [];
          list.forEach(cName => {
            if (cName && typeof cName === 'string') {
              const normKey = normalizeCategoryName(cName);
              if (!mergedCategories[normKey]) {
                mergedCategories[normKey] = { claimDays: 30, returnDays: 7, isUnconfigured: true };
              }
            }
          });
        }
      } catch (err) {
        console.warn("⚠️ Warning fetching product_categories for warranty sync:", err);
      }

      cachedWarrantyConfig = {
        categories: mergedCategories,
        skus: savedSkus
      };
      return cachedWarrantyConfig;
    } catch (error) {
      console.error("🔥 Error fetching warranty settings:", error);
      return DEFAULT_WARRANTY;
    }
  },

  checkAndTriggerWarrantyTaskForNewCategory: async (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') return;
    const normKey = normalizeCategoryName(categoryName);

    try {
      const currentSettings = await warrantyService.getWarrantySettings(true);
      const existingCatData = currentSettings.categories[normKey];

      if (existingCatData && !existingCatData.isUnconfigured) {
        return;
      }

      const todosRef = collection(db, getCollectionPath('todos'));
      const q = query(
        todosRef,
        where('type', '==', 'WARRANTY_SETUP'),
        where('status', 'in', ['todo', 'pending', 'in_progress'])
      );
      const snap = await getDocs(q);
      const alreadyHasTask = snap.docs.some(d => {
        const cat = d.data().categoryName;
        return cat && normalizeCategoryName(cat) === normKey;
      });

      if (!alreadyHasTask) {
        await addDoc(todosRef, {
          taskType: 'WARRANTY_SETUP',
          type: 'WARRANTY_SETUP',
          title: `ตั้งค่าระยะเวลารับประกันหมวดใหม่: ${normKey}`,
          description: `พบสินค้าประเภทใหม่ (${normKey}) ในระบบ กรุณาเข้าไปตั้งค่าวันรับประกันเคลมและคืนเงิน`,
          categoryName: normKey,
          status: 'todo',
          priority: 'High',
          createdAt: serverTimestamp(),
          targetUrl: '/managers/warranty'
        });
        console.log(`🔔 [WarrantyService] สร้างงาน To-Do ผู้จัดการให้ตั้งค่าประกันหมวด "${normKey}" สำเร็จ`);
      }
    } catch (err) {
      console.error("🔥 Error triggering warranty task for category:", err);
    }
  },

  updateWarrantySettings: async (newData, managerUid) => {
    try {
      const docRef = doc(db, getCollectionPath('settings'), SETTINGS_DOC);
      
      const cleanCategories = {};
      if (newData.categories) {
        Object.entries(newData.categories).forEach(([k, v]) => {
          const normKey = normalizeCategoryName(k);
          const { isUnconfigured, ...rest } = v;
          cleanCategories[normKey] = rest;
        });
      }

      const payloadToSave = {
        ...newData,
        categories: cleanCategories,
        updatedAt: serverTimestamp(),
        updatedBy: managerUid || 'Admin'
      };

      await setDoc(docRef, payloadToSave);
      
      cachedWarrantyConfig = { categories: cleanCategories, skus: newData.skus || {} };
      
      try {
        const todosRef = collection(db, getCollectionPath('todos'));
        const q = query(
          todosRef,
          where('type', '==', 'WARRANTY_SETUP'),
          where('status', 'in', ['todo', 'pending', 'in_progress'])
        );
        const snap = await getDocs(q);
        const updatePromises = snap.docs.map(docSnap => {
          const tData = docSnap.data();
          const taskNormKey = tData.categoryName ? normalizeCategoryName(tData.categoryName) : null;
          if (!taskNormKey || cleanCategories[taskNormKey]) {
            return updateDoc(docSnap.ref, {
              status: 'completed',
              completedAt: serverTimestamp(),
              completedBy: managerUid || 'Admin'
            });
          }
          return null;
        }).filter(Boolean);

        await Promise.all(updatePromises);
      } catch (todoErr) {
        console.warn("⚠️ Warning auto-completing warranty todo tasks:", todoErr);
      }

      await historyService.addLog('Manager', 'UpdateWarranty', 'System', 'อัปเดตตั้งค่าระยะเวลาประกันสินค้าและเคลียร์งาน To-Do', managerUid);
      
      return true;
    } catch (error) {
      console.error("🔥 Error updating warranty settings:", error);
      throw error;
    }
  }
};
