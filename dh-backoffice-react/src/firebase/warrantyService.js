import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc, addDoc, limit } from 'firebase/firestore';
import { db } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

const SETTINGS_DOC = 'warranty';

/**
 * 🏷️ แปลงชื่อหมวดหมู่ให้เป็น Canonical Standard Name เพื่อแก้ปัญหาชื่อซ้ำ/คำคล้าย/ตัวพิมพ์เล็ก-ใหญ่
 */
export function normalizeCategoryName(catName) {
  if (!catName || typeof catName !== 'string') return 'General';
  const clean = catName.trim();
  const lower = clean.toLowerCase();
  if (!clean) return 'General';

  // 1. Core Hardware Types & Thai Synonyms
  if (['panel', 'screen', 'display', 'หน้าจอ', 'จอคอม', 'จอ', 'แผงจอ', 'จอภาพ'].includes(lower)) return 'Panel';
  if (['keyboard', 'คีย์บอร์ด', 'แป้นพิมพ์'].includes(lower)) return 'Keyboard';
  if (['battery', 'แบตเตอรี่', 'แบต'].includes(lower)) return 'Battery';
  if (['adapter', 'charger', 'อแดปเตอร์', 'อะแดปเตอร์', 'สายชาร์จ', 'หัวชาร์จ'].includes(lower)) return 'Adapter';
  if (['speaker', 'speakers', 'ลำโพง', 'สปีกเกอร์'].includes(lower)) return 'Speaker';
  if (['fan', 'พัดลม', 'พัดลมระบายความร้อน'].includes(lower)) return 'Fan';
  if (['cooling', 'heatsink', 'heat pipe', 'ชุดระบายความร้อน', 'ฮีตซิงค์', 'ซิงค์'].includes(lower)) return 'Cooling';
  if (['cable', 'flex cable', 'สายไฟ', 'สายแพ', 'สายสัญญาณ', 'สายต่อ'].includes(lower)) return 'Cable';
  if (['hinge', 'บานพับ', 'ข้อพับ'].includes(lower)) return 'Hinge';
  if (['switching', 'power supply', 'สวิตชิ่ง', 'พาวเวอร์ซัพพลาย'].includes(lower)) return 'Switching';
  
  // 2. Acronyms & Components
  if (['ram', 'memory', 'แรม'].includes(lower)) return 'RAM';
  if (['ssd', 'hdd', 'harddisk', 'hard disk', 'เอสเอสดี', 'ฮาร์ดดิสก์'].includes(lower)) return 'SSD';
  if (['mainboard', 'motherboard', 'เมนบอร์ด', 'มาเธอร์บอร์ด'].includes(lower)) return 'Mainboard';
  if (['cpu', 'processor', 'ซีพียู'].includes(lower)) return 'CPU';
  if (['case', 'housing', 'top case', 'bottom case', 'เคส', 'ฝาหลัง', 'บอดี้'].includes(lower)) return 'Case';

  if (['general', 'other', 'misc', 'miscellaneous', 'อื่นๆ', 'ทั่วไป'].includes(lower)) return 'General';

  // 3. Fallback for unlisted names: Canonical TitleCase formatting for Latin words
  if (/^[a-zA-Z]/.test(clean)) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

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
  // 🔔 ตรวจสอบหมวดสินค้าใหม่ และสร้าง To-Do ผู้จัดการ หากยังไม่เคยตั้งค่า
  // ==========================================
  checkAndTriggerWarrantyTaskForNewCategory: async (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') return;
    const normKey = normalizeCategoryName(categoryName);

    try {
      const currentSettings = await warrantyService.getWarrantySettings(true);
      const existingCatData = currentSettings.categories[normKey];

      // หากหมวดหมู่นี้ถูกตั้งค่าเรียบร้อยแล้ว ไม่ต้องสร้างงาน
      if (existingCatData && !existingCatData.isUnconfigured) {
        return;
      }

      // เช็คว่ามีงาน To-Do ผู้จัดการเรื่องประกันของหมวดนี้ค้างอยู่แล้วหรือไม่
      const todosRef = collection(db, getCollectionPath('todos'));
      const q = query(
        todosRef,
        where('type', '==', 'WARRANTY_SETUP'),
        where('status', 'in', ['todo', 'pending', 'in_progress']),
        limit(10)
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

  // ==========================================
  // 📤 บันทึกข้อมูลกติกาประกัน + เคลียร์ To-Do ผู้จัดการที่เกี่ยวข้อง
  // ==========================================
  updateWarrantySettings: async (newData, managerUid) => {
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

      // บันทึก History ของผู้จัดการ
      await historyService.addLog('Manager', 'UpdateWarranty', 'System', 'อัปเดตตั้งค่าระยะเวลาประกันสินค้าและเคลียร์งาน To-Do', managerUid);
      
      return true;
    } catch (error) {
      console.error("🔥 Error updating warranty settings:", error);
      throw error;
    }
  }
};