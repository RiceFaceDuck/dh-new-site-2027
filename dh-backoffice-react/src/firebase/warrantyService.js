import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, addDoc, limit } from 'firebase/firestore';
import { db } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

const SETTINGS_DOC = 'warranty';

import { normalizeCategoryName } from 'dh-shared/src/utils/warrantyUtils.js';
export { normalizeCategoryName };

// 💡 ค่าเริ่มต้น หากเพิ่งรันระบบครั้งแรก
const DEFAULT_WARRANTY = {
  categories: {
    'Panel': { claimDays: 180, returnDays: 7 },
    'Keyboard': { claimDays: 90, returnDays: 7 },
    'Battery': { claimDays: 180, returnDays: 7 },
    'Adapter': { claimDays: 180, returnDays: 7 },
    'General': { claimDays: 30, returnDays: 7 } // หมวดหมู่อื่นๆ
  },
  skus: {} // เก็บ SKU พิเศษ เช่น "SKU-999": { claimDays: 365, returnDays: 15 }
};

let cachedWarrantyConfig = null;

export const warrantyService = {
  // ==========================================
  // 📥 ดึงข้อมูลกติกาประกัน + ตรวจสอบหมวดสินค้าที่มีจริงใน DB (พร้อม Deduplication)
  // ==========================================
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

      // 🔍 1. ตั้งต้นด้วย DEFAULT_WARRANTY (ผ่าน Normalization)
      const mergedCategories = {};

      Object.entries(DEFAULT_WARRANTY.categories).forEach(([catKey, val]) => {
        const normKey = normalizeCategoryName(catKey);
        mergedCategories[normKey] = { ...val, isUnconfigured: false };
      });

      // 🔍 2. รวมกับข้อมูลที่เคยบันทึกไว้ใน Firestore (พร้อม Deduplication & Smart Merging)
      Object.entries(savedCategories).forEach(([catKey, val]) => {
        const normKey = normalizeCategoryName(catKey);
        const existing = mergedCategories[normKey];
        const claimDays = val.claimDays ?? 30;
        const returnDays = val.returnDays ?? 7;

        if (!existing || existing.isUnconfigured) {
          mergedCategories[normKey] = {
            claimDays,
            returnDays,
            isUnconfigured: false
          };
        } else {
          // หากมีค่าอยู่แล้ว และรายการนี้ได้รับการตั้งค่าพิเศษ (ไม่ใช่ default 30/7) ให้อัปเดต
          if (claimDays !== 30 || returnDays !== 7) {
            mergedCategories[normKey] = {
              claimDays,
              returnDays,
              isUnconfigured: false
            };
          }
        }
      });

      // 🔍 3. ตรวจสอบหมวดสินค้าที่มีจริงใน /settings/product_categories
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

  // ==========================================
  // 🔔 ตรวจสอบหมวดสินค้าใหม่ (แบบ Batch ประหยัด Reads ป้องกัน Quota Spike)
  // ==========================================
  checkAndTriggerWarrantyTasksForBatch: async (categoryNames) => {
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) return;

    try {
      // 1. โหลดการตั้งค่าปัจจุบันเพียงครั้งเดียว (ประหยัด Reads)
      const currentSettings = await warrantyService.getWarrantySettings(true);
      const configuredCategories = currentSettings.categories || {};

      // สกัดเฉพาะหมวดหมู่ที่ยังไม่ได้ตั้งค่า
      const unconfiguredNormKeys = new Set();
      categoryNames.forEach(rawName => {
        if (!rawName || typeof rawName !== 'string') return;
        const normKey = normalizeCategoryName(rawName);
        const existingData = configuredCategories[normKey];
        if (!existingData || existingData.isUnconfigured) {
          unconfiguredNormKeys.add(normKey);
        }
      });

      if (unconfiguredNormKeys.size === 0) {
        return; // ทุกหมวดหมู่ได้รับการตั้งค่าเรียบร้อยแล้ว
      }

      // 2. ดึงรายการ To-Do ที่ค้างอยู่เพียงครั้งเดียว (1 Query)
      const todosRef = collection(db, getCollectionPath('todos'));
      const q = query(
        todosRef,
        where('type', '==', 'WARRANTY_SETUP'),
        where('status', 'in', ['todo', 'pending', 'in_progress']),
        limit(100)
      );
      const snap = await getDocs(q);
      const existingTaskCategories = new Set(
        snap.docs
          .map(d => d.data().categoryName)
          .filter(Boolean)
          .map(c => normalizeCategoryName(c))
      );

      // 3. สร้างงานเฉพาะหมวดที่ยังไม่มี To-Do
      const creationPromises = [];
      for (const normKey of unconfiguredNormKeys) {
        if (!existingTaskCategories.has(normKey)) {
          existingTaskCategories.add(normKey); // ป้องกัน duplicate ในรอบเดียวกัน
          creationPromises.push(
            addDoc(todosRef, {
              taskType: 'WARRANTY_SETUP',
              type: 'WARRANTY_SETUP',
              title: `ตั้งค่าระยะเวลารับประกันหมวดใหม่: ${normKey}`,
              description: `พบสินค้าประเภทใหม่ (${normKey}) ในระบบ กรุณาเข้าไปตั้งค่าวันรับประกันเคลมและคืนเงิน`,
              categoryName: normKey,
              status: 'todo',
              priority: 'High',
              createdAt: serverTimestamp(),
              targetUrl: '/managers/warranty'
            }).then(() => {
              console.log(`🔔 [WarrantyService] สร้างงาน To-Do ผู้จัดการให้ตั้งค่าประกันหมวด "${normKey}" สำเร็จ`);
            })
          );
        }
      }

      await Promise.allSettled(creationPromises);
    } catch (err) {
      console.error("🔥 Error triggering warranty tasks batch:", err);
    }
  },

  checkAndTriggerWarrantyTaskForNewCategory: async (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') return;
    await warrantyService.checkAndTriggerWarrantyTasksForBatch([categoryName]);
  },

  // ==========================================
  // 📤 บันทึกข้อมูลกติกาประกัน + เคลียร์ To-Do ผู้จัดการที่เกี่ยวข้อง
  // ==========================================
  updateWarrantySettings: async (newData, managerUid, diffSummary = '') => {
    try {
      const docRef = doc(db, getCollectionPath('settings'), SETTINGS_DOC);
      
      // ทำความสะอาดและสกัดหมวดหมู่เป็น Canonical Keys เพื่อล้างหมวดซ้ำเดิม
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
      
      // Update cache
      cachedWarrantyConfig = { categories: cleanCategories, skus: newData.skus || {} };
      
      // 🚀 เคลียร์งาน To-Do ผู้จัดการที่เกี่ยวข้องกับการตั้งค่าประกันหมวดหมู่
      try {
        const todosRef = collection(db, getCollectionPath('todos'));
        const q = query(
          todosRef,
          where('type', '==', 'WARRANTY_SETUP'),
          where('status', 'in', ['todo', 'pending', 'in_progress']),
          limit(100)
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

      // บันทึก History ของผู้จัดการ (จุดเดียว Single Source of Truth)
      const logDetails = diffSummary ? `อัปเดตกติกาประกัน | ${diffSummary}` : 'อัปเดตตั้งค่าระยะเวลาประกันสินค้าและเคลียร์งาน To-Do';
      await historyService.addLog('SystemConfig', 'Update', 'warranty', logDetails, managerUid);
      
      return true;
    } catch (error) {
      console.error("🔥 Error updating warranty settings:", error);
      throw error;
    }
  }
};