/**
 * 🛡️ DH Notebook - Shared Warranty Domain Utilities
 * Centralized business logic for Category Normalization & Item Warranty Calculation
 * Path: dh-shared/src/utils/warrantyUtils.js
 */

export const DEFAULT_WARRANTY_DAYS = {
  claimDays: 30,
  returnDays: 7
};

/**
 * 🏷️ แปลงชื่อหมวดหมู่ให้เป็น Canonical Standard Name เพื่อแก้ปัญหาชื่อซ้ำ/คำคล้าย/ตัวพิมพ์เล็ก-ใหญ่
 * @param {string} catName - ชื่อหมวดหมู่เดิม
 * @returns {string} Canonical category name
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

/**
 * 🔍 อนุมานหมวดหมู่สินค้าจากรหัส SKU (กรณีข้อมูลสินค้าเดิมไม่มี category ระบุไว้)
 * @param {string} sku - รหัสสินค้า
 * @returns {string|null} หมวดหมู่ที่อนุมานได้ หรือ null
 */
export function resolveCategoryFromSku(sku) {
  if (!sku || typeof sku !== 'string') return null;
  const skuUpper = sku.trim().toUpperCase();

  if (skuUpper.startsWith('FADE') || skuUpper.startsWith('FAN')) return 'Fan';
  if (skuUpper.startsWith('SCR') || skuUpper.startsWith('PANEL') || skuUpper.startsWith('PN')) return 'Panel';
  if (skuUpper.startsWith('BAT') || skuUpper.startsWith('BT')) return 'Battery';
  if (skuUpper.startsWith('ADAP') || skuUpper.startsWith('CHARGER') || skuUpper.startsWith('AD')) return 'Adapter';
  if (skuUpper.startsWith('KEY') || skuUpper.startsWith('KB')) return 'Keyboard';
  if (skuUpper.startsWith('SPK') || skuUpper.startsWith('SPEAKER')) return 'Speaker';
  if (skuUpper.startsWith('CBL') || skuUpper.startsWith('CABLE')) return 'Cable';
  if (skuUpper.startsWith('HNG') || skuUpper.startsWith('HINGE')) return 'Hinge';
  if (skuUpper.startsWith('SW') || skuUpper.startsWith('SWITCH')) return 'Switching';
  if (skuUpper.startsWith('RAM')) return 'RAM';
  if (skuUpper.startsWith('SSD')) return 'SSD';
  if (skuUpper.startsWith('MB') || skuUpper.startsWith('MAIN')) return 'Mainboard';
  if (skuUpper.startsWith('CPU')) return 'CPU';

  return null;
}

/**
 * ⚡ คำนวณวันและสถานะการรับประกันของสินค้าแบบครบวงจร (Single Source of Truth)
 * @param {Object} item - อ็อบเจกต์สินค้า (ต้องมี category/category1 หรือ sku)
 * @param {Date|string|number|Object} orderDate - วันที่สั่งซื้อ (Date, ISO string, millis หรือ Firestore Timestamp)
 * @param {Object} warrantyConfig - อ็อบเจกต์การตั้งค่าประกัน { categories, skus }
 * @param {Date} [referenceDate=new Date()] - วันที่ใช้อ้างอิงการคำนวณ (Default วันนี้)
 * @returns {Object|null} ข้อมูลสถานะประกันแบบละเอียด
 */
export function calculateItemWarranty(item, orderDate, warrantyConfig, referenceDate = new Date()) {
  if (!item || !orderDate) return null;

  // 1. แปลงวันที่สั่งซื้อให้อยู่ในรูป Date
  let purchaseDate;
  if (orderDate instanceof Date) {
    purchaseDate = orderDate;
  } else if (orderDate && typeof orderDate.toDate === 'function') {
    purchaseDate = orderDate.toDate();
  } else {
    purchaseDate = new Date(orderDate);
  }

  if (isNaN(purchaseDate.getTime())) return null;

  // 2. คำนวณจำนวนวันที่ผ่านไป (แบบปฏิทินเที่ยงคืนชนเที่ยงคืน เพื่อป้องกันปัญหาชั่วโมงคลาดเคลื่อน)
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const pMidnight = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
  const rMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const passedDays = Math.max(0, Math.floor((rMidnight - pMidnight) / (1000 * 60 * 60 * 24)));

  // 3. กำหนดค่าเริ่มต้น
  let claimDays = DEFAULT_WARRANTY_DAYS.claimDays;
  let returnDays = DEFAULT_WARRANTY_DAYS.returnDays;
  let categoryKey = 'General';
  let isSkuOverride = false;

  const categories = warrantyConfig?.categories || {};
  const skus = warrantyConfig?.skus || {};

  // 4. ตรวจสอบการ Override ระดับ SKU ก่อนเป็นอันดับแรก (Priority สูงสุด)
  const itemSku = (item.sku || '').trim();
  if (itemSku && skus[itemSku]) {
    const skuConfig = skus[itemSku];
    claimDays = skuConfig.claimDays ?? claimDays;
    returnDays = skuConfig.returnDays ?? returnDays;
    isSkuOverride = true;
    categoryKey = 'SKU_OVERRIDE';
  } else {
    // 5. ค้นหาหมวดหมู่สินค้า
    let rawCat = (item.category || item.category1 || '').trim();

    // Fallback จากรหัส SKU หากไม่มีระบุหมวดหมู่
    if (!rawCat && itemSku) {
      const inferredCat = resolveCategoryFromSku(itemSku);
      if (inferredCat) rawCat = inferredCat;
    }

    const normCat = normalizeCategoryName(rawCat);

    // 5.1 ตรวจหาใน Categories แบบตรงเป๊ะ (Normalized Key)
    if (categories[normCat]) {
      claimDays = categories[normCat].claimDays ?? claimDays;
      returnDays = categories[normCat].returnDays ?? returnDays;
      categoryKey = normCat;
    } else {
      // 5.2 Substring match fallback ในกรณีที่มีชื่อหมวดหมู่ผสม
      let matchedKey = null;
      const lowerRaw = rawCat.toLowerCase();
      const lowerNorm = normCat.toLowerCase();

      for (const [key, config] of Object.entries(categories)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerRaw.includes(lowerKey) || 
          lowerKey.includes(lowerRaw) ||
          lowerNorm.includes(lowerKey) ||
          lowerKey.includes(lowerNorm)
        ) {
          matchedKey = key;
          claimDays = config.claimDays ?? claimDays;
          returnDays = config.returnDays ?? returnDays;
          categoryKey = key;
          break;
        }
      }

      if (!matchedKey && categories['General']) {
        claimDays = categories['General'].claimDays ?? claimDays;
        returnDays = categories['General'].returnDays ?? returnDays;
        categoryKey = 'General';
      }
    }
  }

  // 6. คำนวณวันคงเหลือ และสถานะหมดอายุ
  const remainingDays = claimDays - passedDays;
  const isExpired = remainingDays < 0;
  const percentUsed = Math.min(100, Math.max(0, Math.round((passedDays / Math.max(claimDays, 1)) * 100)));
  const percentRemaining = Math.max(0, 100 - percentUsed);

  // คำนวณวันหมดอายุประกัน (Expiry Date)
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + claimDays);

  return {
    claimDays,
    returnDays,
    passedDays,
    remainingDays,
    isExpired,
    categoryKey,
    isSkuOverride,
    percentUsed,
    percentRemaining,
    purchaseDate,
    expiryDate
  };
}
