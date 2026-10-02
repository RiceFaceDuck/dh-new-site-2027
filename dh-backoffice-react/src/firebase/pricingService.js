import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';
import { 
  defaultPricingConfig, 
  normalizeCategory, 
  calculateNextEnding, 
  calculateRetailPrice,
  sanitizeCost 
} from 'dh-shared/src/utils/pricingEngine';

export { 
  defaultPricingConfig, 
  normalizeCategory, 
  calculateNextEnding, 
  calculateRetailPrice,
  sanitizeCost 
};

const SETTINGS_DOC_ID = 'pricing';
const COLLECTION_NAME = 'settings';

export const pricingService = {
  defaultPricingConfig,
  normalizeCategory,
  calculateNextEnding,
  calculateRetailPrice,
  sanitizeCost,

  // ดึงข้อมูลการตั้งค่า (ประหยัด Reads: ใช้แค่ 1 Document)
  getPricingConfig: async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // รองรับระบบเก่า (Migration) กรณีเปลี่ยนผ่านโครงสร้าง
        if (!data.rounding) {
          data.rounding = defaultPricingConfig.rounding;
        }
        return data;
      } else {
        return defaultPricingConfig;
      }
    } catch (error) {
      console.error("Error fetching pricing config:", error);
      return defaultPricingConfig;
    }
  },

  // บันทึกข้อมูลและลง Log ประวัติการทำงาน พร้อม Data Sanitization และ Audit Metadata
  savePricingConfig: async (newConfig) => {
    try {
      if (!newConfig || !Array.isArray(newConfig.rules)) {
        throw new Error('โครงสร้างกฎราคาไม่ถูกต้อง');
      }

      // ป้องกัน Empty Category Wildcard: ห้ามเซฟกฎที่ไม่มีหมวดหมู่
      const hasEmptyCategory = newConfig.rules.some(r => !r.category || !r.category.trim());
      if (hasEmptyCategory) {
        throw new Error('พบเงื่อนไขราคาที่ยังไม่ได้เลือกหมวดหมู่ โปรดระบุหมวดหมู่ให้ครบถ้วนก่อนบันทึก');
      }

      // Sanitization ข้อมูลตัวเลขใน Rules
      const sanitizedRules = newConfig.rules.map(r => ({
        ...r,
        category: (r.category || '').trim(),
        threshold: Math.max(0, Number(r.threshold) || 0),
        value: Number(r.value) || 0,
        action: r.action === '/' ? '/' : '*',
        operator: ['<', '<=', '>', '>=', 'all'].includes(r.operator) ? r.operator : '<=',
        isActive: Boolean(r.isActive)
      }));

      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      
      // Optimistic Concurrency Guard: ป้องกันแอดมินเซฟทับซ้อน
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists()) {
        const serverData = currentSnap.data();
        const serverVersion = Number(serverData.version) || 0;
        const clientVersion = Number(newConfig.version) || 0;
        if (clientVersion > 0 && serverVersion > clientVersion) {
          throw new Error(`ตรวจพบการเปลี่ยนแปลงโครงสร้างราคาโดยผู้อื่น (เวอร์ชันเซิร์ฟเวอร์: v${serverVersion} | เครื่องนี้: v${clientVersion}) โปรดรีเฟรชหน้าจอเพื่อดึงข้อมูลล่าสุดก่อนบันทึก`);
        }
      }

      const nextVersion = (Number(newConfig.version) || 0) + 1;

      await setDoc(docRef, {
        ...newConfig,
        rules: sanitizedRules,
        version: nextVersion,
        updatedBy: auth.currentUser?.uid || 'system',
        updatedByEmail: auth.currentUser?.email || '',
        updatedAt: serverTimestamp()
      });
      
      const rText = newConfig.rounding?.type === 'custom' 
        ? `เป้าหมายลงท้าย ${newConfig.rounding.primaryTarget} ${newConfig.rounding.enableFallback ? '(สำรอง ' + newConfig.rounding.fallbackTarget + ')' : ''}`
        : 'ปิดการปัดเศษ';

      await historyService.addLog(
        'PricingConfig', 
        'Update', 
        'System_Pricing', 
        `ปรับปรุงโครงสร้างราคาและตัวคูณ (${rText})`, 
        auth.currentUser?.uid
      );
      return true;
    } catch (error) {
      console.error("Error saving pricing config:", error);
      throw error;
    }
  }
};