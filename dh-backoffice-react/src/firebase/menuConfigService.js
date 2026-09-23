import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'manager_menus';
const CACHE_KEY = 'dh_manager_menus_cache';
const CACHE_TTL = 3600000; // 1 hour

const DEFAULT_LAYOUT = {
  zones: [
    {
      id: "zone-1",
      title: "👥 จัดการบุคคลและทั่วไป",
      menuIds: ["vip", "staff", "role_tier", "history", "drive", "credit"]
    },
    {
      id: "zone-2",
      title: "⚙️ ตั้งค่าระบบส่วนกลาง",
      menuIds: ["buffer", "regex", "warranty", "ads_config", "apikey", "privacy", "security", "maintenance", "yearly_archive"]
    },
    {
      id: "zone-3",
      title: "📈 การตลาด & การขาย",
      menuIds: ["ads", "pricing", "email"]
    },
    {
      id: "zone-5",
      title: "🖥️ จัดการระบบหน้าบ้าน",
      menuIds: ["theme", "footer", "category", "banner", "seo", "error404", "script", "redirect"]
    }
  ]
};

const setCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to set menu layout cache:", e);
  }
};

export const menuConfigService = {
  /**
   * ดึงข้อมูลโครงสร้างเลย์เอาต์เมนู (พร้อมระบบ Local Session Caching)
   */
  getMenuLayout: async (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL) && parsed?.data) {
            return parsed.data;
          }
        }
      } catch (e) {
        console.warn("Failed to read menu layout cache:", e);
      }
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.zones && data.zones.length > 0) {
          // One-time migration: If zone-5 does not exist, replace with the new default layout
          if (!data.zones.some(z => z.id === "zone-5")) {
            await setDoc(docRef, DEFAULT_LAYOUT);
            setCache(DEFAULT_LAYOUT);
            return DEFAULT_LAYOUT;
          }
          
          let needsUpdate = false;
          const hasRoleTier = data.zones.some(z => z.menuIds.includes("role_tier"));
          if (!hasRoleTier) {
            const zone1 = data.zones.find(z => z.id === "zone-1");
            if (zone1) {
              zone1.menuIds.splice(2, 0, "role_tier"); // แทรกหลัง staff
              needsUpdate = true;
            }
          }

          const hasYearlyArchive = data.zones.some(z => z.menuIds.includes("yearly_archive"));
          if (!hasYearlyArchive) {
            const zone2 = data.zones.find(z => z.id === "zone-2") || data.zones[0];
            if (zone2) {
              zone2.menuIds.push("yearly_archive");
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            await setDoc(docRef, data);
          }

          setCache(data);
          return data;
        }
      }
      // ถ้าไม่มีข้อมูล ให้สร้างขึ้นมาใหม่ (Default)
      await setDoc(docRef, DEFAULT_LAYOUT);
      setCache(DEFAULT_LAYOUT);
      return DEFAULT_LAYOUT;
    } catch (error) {
      console.error("Error getting menu layout:", error);
      return DEFAULT_LAYOUT; 
    }
  },

  /**
   * อัปเดตโครงสร้างเลย์เอาต์เมนูใหม่ทั้งหมด
   */
  updateMenuLayout: async (layoutData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(docRef, layoutData, { merge: true });
      setCache(layoutData);
      return { success: true };
    } catch (error) {
      console.error("Error updating menu layout:", error);
      return { success: false, error: error.message };
    }
  }
};
