/**
 * Retail Pricing Engine (SSOT)
 * Centralized business logic for Retail Pricing calculation, psychological rounding, and category normalization.
 */

// ข้อมูลเริ่มต้นโครงสร้างราคาขายปลีกและปัดเศษจิตวิทยา
export const defaultPricingConfig = {
  rounding: {
    type: 'custom', // 'custom' หรือ 'none'
    primaryTarget: '90', // ค่าที่ต้องการให้ลงท้าย เช่น 90
    enableFallback: true, // เปิดใช้เงื่อนไข 2
    fallbackTarget: '9' // ค่าสำรอง หากเงื่อนไขแรกผิดพลาด/ไม่ได้กำหนด
  },
  rules: [
    { id: '1', category: 'Panel', operator: '<=', threshold: 1100, action: '/', value: 0.65, isActive: true },
    { id: '2', category: 'Panel', operator: '<=', threshold: 2000, action: '/', value: 0.68, isActive: true },
    { id: '3', category: 'Panel', operator: '<=', threshold: 2800, action: '/', value: 0.70, isActive: true },
    { id: '4', category: 'Panel', operator: '<=', threshold: 3500, action: '/', value: 0.75, isActive: true },
    { id: '5', category: 'Panel', operator: '>', threshold: 3500, action: '/', value: 0.78, isActive: true },
    
    { id: '6', category: 'Adapter', operator: 'all', threshold: 0, action: '*', value: 1.3, isActive: true },
    
    { id: '7', category: 'Cooling Fan', operator: '<', threshold: 160, action: '/', value: 0.60, isActive: true },
    { id: '8', category: 'Cooling Fan', operator: '>=', threshold: 160, action: '/', value: 0.70, isActive: true },
    
    { id: '9', category: 'Keyboard', operator: '<', threshold: 200, action: '*', value: 1.50, isActive: true },
    { id: '10', category: 'Keyboard', operator: '<', threshold: 250, action: '*', value: 1.35, isActive: true },
    { id: '11', category: 'Keyboard', operator: '>=', threshold: 250, action: '*', value: 1.25, isActive: true },
    
    { id: '12', category: 'Cable', operator: '<', threshold: 160, action: '/', value: 0.60, isActive: true },
    { id: '13', category: 'Cable', operator: '>=', threshold: 160, action: '/', value: 0.70, isActive: true },
    
    { id: '14', category: 'Hinge', operator: '<', threshold: 160, action: '/', value: 0.60, isActive: true },
    { id: '15', category: 'Hinge', operator: '>=', threshold: 160, action: '/', value: 0.80, isActive: true },
  ]
};

/**
 * ทำความสะอาดและแปลงต้นทุน (Sanitize Cost)
 * แก้ปัญหาตัวเลขติดลูกน้ำ เช่น "1,500" ซึ่ง parseFloat เดิมจะตัดเหลือ 1
 */
export const sanitizeCost = (cost) => {
  if (cost === null || cost === undefined) return 0;
  if (typeof cost === 'number') {
    return isNaN(cost) || cost <= 0 ? 0 : cost;
  }
  // แปลง String ตัด comma และช่องว่าง
  const cleanStr = String(cost).replace(/,/g, '').trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
};

/**
 * ระบบแปลงชื่อหมวดหมู่ให้แมตช์ได้แม่นยำ (Normalized Category Matching)
 * จุดอ้างอิงศูนย์กลาง (Single Source of Truth)
 */
export const normalizeCategory = (name) => {
  if (!name || typeof name !== 'string') return 'General';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (!clean) return 'General';
  if (['panel', 'screen', 'display', 'หน้าจอ', 'จอคอม', 'จอ'].some(e => lower === e || lower.includes(e))) return 'Panel';
  if (['keyboard', 'คีย์บอร์ด'].some(e => lower === e || lower.includes(e))) return 'Keyboard';
  if (['battery', 'แบตเตอรี่', 'แบต'].some(e => lower === e || lower.includes(e))) return 'Battery';
  if (['adapter', 'charger', 'อแดปเตอร์', 'อะแดปเตอร์', 'สายชาร์จ'].some(e => lower === e || lower.includes(e))) return 'Adapter';
  if (['speaker', 'ลำโพง', 'built in audio', 'audio', 'sound'].some(e => lower === e || lower.includes(e))) return 'Speaker';
  if (['cooling fan', 'fan', 'พัดลม'].some(e => lower === e || lower.includes(e))) return 'FAN';
  if (['cooling', 'ชุดระบายความร้อน', 'heatsink', 'ฮีตซิงค์'].some(e => lower === e || lower.includes(e))) return 'Cooling';
  if (['cable', 'สายไฟ', 'สายแพ', 'สายสัญญาณ'].some(e => lower === e || lower.includes(e))) return 'Cable';
  if (['hinge', 'บานพับ'].some(e => lower === e || lower.includes(e))) return 'Hinge';
  if (['ram', 'แรม', 'หน่วยความจำ'].some(e => lower === e || lower.includes(e))) return 'RAM';
  if (['ssd', 'harddisk', 'ฮาร์ดดิสก์'].some(e => lower === e || lower.includes(e))) return 'SSD';
  return clean;
};

/**
 * ฟังก์ชันคณิตศาสตร์ หาตัวเลขที่ลงท้ายด้วยเป้าหมาย และต้องมากกว่าหรือเท่ากับราคาตั้งต้น
 */
export const calculateNextEnding = (price, targetStr) => {
  if (!targetStr && targetStr !== '0') return null;
  const targetNum = parseInt(targetStr, 10);
  if (isNaN(targetNum)) return null;

  const mod = Math.pow(10, targetStr.length);
  const baseFloor = price - (price % mod);
  let candidate = baseFloor + targetNum;

  if (candidate < price) {
    candidate += mod;
  }
  return candidate;
};

/**
 * Core Engine: คำนวณราคาปลีกสุทธิ (เคารพลำดับ Top-Down ตามจริง)
 */
export const calculateRetailPrice = (cost, category, config) => {
  const numCost = sanitizeCost(cost);
  if (numCost <= 0) {
    return {
      cost: 0,
      calculatedPrice: 0,
      rawPrice: 0,
      appliedRule: null,
      appliedRoundingType: 'ไม่มีข้อมูลทุน',
      margin: 0,
      marginPercent: 0
    };
  }

  let baseRetail = numCost;
  let matchedRule = null;
  const rules = config?.rules || defaultPricingConfig.rules;
  const lowerCategory = (category || '').trim().toLowerCase();
  const normalizedCat = normalizeCategory(category);

  // กรองเงื่อนไขที่ตรงกับหมวดหมู่ โดยคงลำดับเดิมไว้ (Top-Down Order)
  // กฎเหล็ก: rCat ว่าง จะต้องไม่ถูกตีความเป็น all เด็ดขาด! (ป้องกัน Empty Category Wildcard Bug)
  const matchingRules = rules.filter(r => {
    if (!r || !r.isActive) return false;
    const rCat = (r.category || '').trim().toLowerCase();
    
    // หากกฎไม่มีการระบุหมวดหมู่ ให้ข้ามไป (ห้ามแมตช์เป็น Wildcard)
    if (!rCat) return false;

    return (
      rCat === 'all' ||
      rCat === 'ทั้งหมด' ||
      normalizeCategory(r.category) === normalizedCat ||
      rCat === lowerCategory ||
      (lowerCategory && lowerCategory !== 'other' && (rCat.includes(lowerCategory) || lowerCategory.includes(rCat)))
    );
  });

  for (const rule of matchingRules) {
    let isMatch = false;
    const th = parseFloat(rule.threshold);
    
    switch (rule.operator) {
      case '<': isMatch = numCost < th; break;
      case '<=': isMatch = numCost <= th; break;
      case '>': isMatch = numCost > th; break;
      case '>=': isMatch = numCost >= th; break;
      case 'all': isMatch = true; break;
      default: isMatch = false;
    }

    if (isMatch) {
      matchedRule = rule;
      break; 
    }
  }

  if (matchedRule) {
    const val = parseFloat(matchedRule.value);
    if (matchedRule.action === '*') {
      baseRetail = numCost * (isNaN(val) ? 1 : val);
    } else if (matchedRule.action === '/') {
      // Guard ป้องกัน division by zero หรือติดลบ
      baseRetail = !isNaN(val) && val > 0 ? numCost / val : numCost;
    }
  }

  // ระบบปัดเศษ (Smart Psychological Pricing)
  let finalPrice = Math.ceil(baseRetail); 
  const rounding = config?.rounding || defaultPricingConfig.rounding;
  let appliedRounding = 'ไม่มีการปัดเศษ (ตรงตัว)';

  if (rounding?.type === 'custom') {
    const primaryTargetStr = rounding.primaryTarget?.toString().trim();
    const fallbackTargetStr = rounding.fallbackTarget?.toString().trim();
    let primaryResult = null;

    if (primaryTargetStr !== '' && !isNaN(parseInt(primaryTargetStr, 10))) {
      primaryResult = calculateNextEnding(finalPrice, primaryTargetStr);
    }

    if (primaryResult !== null) {
      finalPrice = primaryResult;
      appliedRounding = `ลงท้ายด้วย ${primaryTargetStr}`;
    } else if (rounding.enableFallback && fallbackTargetStr !== '' && !isNaN(parseInt(fallbackTargetStr, 10))) {
      const fallbackResult = calculateNextEnding(finalPrice, fallbackTargetStr);
      if (fallbackResult !== null) {
        finalPrice = fallbackResult;
        appliedRounding = `ลงท้ายด้วย ${fallbackTargetStr} (เงื่อนไขสำรอง)`;
      }
    }
  }

  // Protection: ป้องกันกรณีปัดเศษแล้วขาดทุนหรือเท่าทุน
  if (finalPrice <= numCost) {
    finalPrice = numCost + 100;
    appliedRounding = 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)';
  }

  const margin = finalPrice - numCost;
  const marginPercent = finalPrice > 0 ? (margin / finalPrice) * 100 : 0;

  return {
    cost: numCost,
    calculatedPrice: finalPrice,
    rawPrice: baseRetail,
    appliedRule: matchedRule,
    appliedRoundingType: appliedRounding,
    margin: margin,
    marginPercent: marginPercent
  };
};
