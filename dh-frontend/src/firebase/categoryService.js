import { db } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { sharedCategoryService } from 'dh-shared/src/firebase/categoryService';

const LOCAL_STORAGE_KEY = 'dh_categories_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง (0 Reads สำหรับผู้ใช้ที่เคยเข้าแล้ว)

// 🛡️ Category Aliases: แปลงคำค้น/หมวดที่เรียกไม่เหมือนกันให้ชี้ไปยังหมวดสินค้าจริง
export const CATEGORY_ALIASES = {
  fan: 'cooling',
  พัดลม: 'cooling',
  speaker: 'built in audio',
  speakers: 'built in audio',
  ลำโพง: 'built in audio',
  audio: 'built in audio',
  screen: 'panel',
  หน้าจอ: 'panel'
};

/**
 * ทำความสะอาดและปรับข้อมูลหมวดหมู่ให้สมบูรณ์ (Defense-in-Depth Sanitizer)
 */
const sanitizeAndNormalizeCategories = (rawCategories = []) => {
  return rawCategories
    .filter(cat => cat && cat.isActive !== false && (cat.status === 'active' || cat.isActive === true))
    .map(cat => {
      const name = (cat.name || '').trim();
      let type = (cat.type || '').trim();

      // ซ่อมแซมหมวดหมู่ที่มีปัญหาใน DB โดยอัตโนมัติ
      if (name === 'ลำโพง' && (!type || type === 'undefined')) {
        type = 'built in audio';
      }
      if (name.toLowerCase() === 'fan' || type.toLowerCase() === 'fan') {
        type = 'cooling';
      }

      return {
        ...cat,
        name: name || type || 'General',
        type: type || name,
        order: typeof cat.order === 'number' ? cat.order : 99
      };
    });
};

export const categoryService = {
  /**
   * ดึงหมวดหมู่ที่เปิดใช้งานทั้งหมด ด้วยกลยุทธ์ 3-Tier Quota Shield:
   * Tier 0: LocalStorage ในเครื่องลูกค้า (0 Reads, 0ms)
   * Tier 1: catalogs/categories_index (1 Read)
   * Tier 2: homepage_categories fallback (13 Reads)
   */
  getActiveCategories: async (forceRefresh = false) => {
    const now = Date.now();

    // 🛡️ TIER 0: LocalStorage Cache (ประหยัดโควต้า 100% สำหรับการเปิดใช้งานทั่วไป)
    if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
      try {
        const cachedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedRaw) {
          const { data, timestamp } = JSON.parse(cachedRaw);
          if (Array.isArray(data) && data.length > 0 && (now - timestamp < CACHE_TTL_MS)) {
            return data;
          }
        }
      } catch (err) {
        console.warn('⚠️ LocalStorage read error:', err);
      }
    }

    let finalCategories = [];

    // 🛡️ TIER 1: Low-Quota Shield (อ่าน 1 Read จาก catalogs/categories_index)
    try {
      const catIndexRef = doc(db, getCollectionPath('catalogs'), 'categories_index');
      const catIndexSnap = await getDoc(catIndexRef);
      if (catIndexSnap.exists()) {
        const catData = catIndexSnap.data();
        if (catData && Array.isArray(catData.items) && catData.items.length > 0) {
          finalCategories = sanitizeAndNormalizeCategories(catData.items);
        }
      }
    } catch (chunkErr) {
      console.warn('⚠️ categories_index read failed, fallback to collection query:', chunkErr);
    }

    // 🛡️ TIER 2: Fallback อ่านจาก homepage_categories collection ตรง
    if (!finalCategories || finalCategories.length === 0) {
      try {
        const rawCategories = await sharedCategoryService.getActiveCategories(db, 'homepage_categories', false);
        const sanitized = sanitizeAndNormalizeCategories(rawCategories);
        
        // Deduplicate by name to prevent duplicate cards
        finalCategories = Array.from(new Map(sanitized.map(item => [
          item.name.toLowerCase().trim(),
          item
        ])).values());

        finalCategories.sort((a, b) => a.order - b.order);
      } catch (dbErr) {
        console.error('❌ Failed to fetch active categories from DB:', dbErr);
        throw dbErr;
      }
    }

    // บันทึกลง LocalStorage สำหรับครั้งถัดไป
    if (finalCategories.length > 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          data: finalCategories,
          timestamp: now
        }));
      } catch (saveErr) {
        console.warn('⚠️ Failed to save categories to LocalStorage:', saveErr);
      }
    }

    return finalCategories;
  },

  /**
   * ค้นหาข้อมูลหมวดหมู่จาก type พร้อมระบบแก้ Alias อัจฉริยะ (เช่น fan -> cooling)
   */
  getCategoryByType: async (type) => {
    if (!type) return null;
    const cleanType = String(type).trim().toLowerCase();
    const resolvedType = CATEGORY_ALIASES[cleanType] || cleanType;

    const categories = await categoryService.getActiveCategories();
    return categories.find(c => 
      (c.type || '').trim().toLowerCase() === resolvedType ||
      (c.name || '').trim().toLowerCase() === resolvedType ||
      (c.type || '').trim().toLowerCase() === cleanType ||
      (c.name || '').trim().toLowerCase() === cleanType
    ) || null;
  },

  /**
   * เคลียร์แคชเครื่อง
   */
  clearLocalCache: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
};