import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'manager_menus';

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
      menuIds: ["buffer", "regex", "warranty", "ads_config", "apikey", "privacy", "security", "maintenance"]
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

export const menuConfigService = {
  /**
   * ดึงข้อมูลโครงสร้างเลย์เอาต์เมนู
   */
  getMenuLayout: async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.zones && data.zones.length > 0) {
            // One-time migration: If zone-5 does not exist, replace with the new default layout
            if (!data.zones.some(z => z.id === "zone-5")) {
                await setDoc(docRef, DEFAULT_LAYOUT);
                return DEFAULT_LAYOUT;
            }
            
            const hasRoleTier = data.zones.some(z => z.menuIds.includes("role_tier"));
            if (!hasRoleTier) {
                const zone1 = data.zones.find(z => z.id === "zone-1");
                if (zone1) {
                    zone1.menuIds.splice(2, 0, "role_tier"); // แทรกหลัง staff
                    await setDoc(docRef, data);
                }
            }

            return data;
        }
      }
      // ถ้าไม่มีข้อมูล ให้สร้างขึ้นมาใหม่ (Default)
      await setDoc(docRef, DEFAULT_LAYOUT);
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
      return { success: true };
    } catch (error) {
      console.error("Error updating menu layout:", error);
      return { success: false, error: error.message };
    }
  }
};
