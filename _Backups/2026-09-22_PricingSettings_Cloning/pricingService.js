import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';

const SETTINGS_DOC_ID = 'pricing';
const COLLECTION_NAME = 'settings';

// ข้อมูลเริ่มต้นแบบใหม่ รองรับการตั้งค่าปัดเศษแบบอิสระ และเงื่อนไขสำรอง
const defaultPricingConfig = {
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
  ],
  updatedAt: serverTimestamp()
};

// ฟังก์ชันคณิตศาสตร์ หาตัวเลขที่ลงท้ายด้วยเป้าหมาย และต้องมากกว่าหรือเท่ากับราคาตั้งต้น
const calculateNextEnding = (price, targetStr) => {
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

export const pricingService = {
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

  // บันทึกข้อมูลและลง Log ประวัติการทำงาน
  savePricingConfig: async (newConfig) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      await setDoc(docRef, {
        ...newConfig,
        updatedAt: serverTimestamp()
      });
      
      const rText = newConfig.rounding.type === 'custom' 
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
  },

  // Core Engine: คำนวณราคาปลีกสุทธิ
  calculateRetailPrice: (cost, category, config) => {
    if (!cost || isNaN(cost)) return 0;
    let baseRetail = cost;
    let matchedRule = null;
    
    const numCost = parseFloat(cost);
    const rules = config?.rules || defaultPricingConfig.rules;

    // กรองและเรียงลำดับเงื่อนไข (Top-Down Priority)
    const categoryRules = rules.filter(r => r.category.toLowerCase() === category.toLowerCase() && r.isActive);
    const sortedRules = [...categoryRules].sort((a, b) => a.threshold - b.threshold);

    for (const rule of sortedRules) {
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
        baseRetail = numCost * val;
      } else if (matchedRule.action === '/') {
        baseRetail = numCost / val;
      }
    }

    // ระบบปัดเศษ (Smart Psychological Pricing)
    let finalPrice = Math.ceil(baseRetail); 
    const rounding = config?.rounding || defaultPricingConfig.rounding;
    let appliedRounding = 'ไม่มีการปัดเศษ (ตรงตัว)';

    if (rounding.type === 'custom') {
      const primaryTargetStr = rounding.primaryTarget?.toString().trim();
      const fallbackTargetStr = rounding.fallbackTarget?.toString().trim();
      
      const primaryResult = calculateNextEnding(finalPrice, primaryTargetStr);
      
      // เงื่อนไข 1: ลองปัดเศษตามเป้าหมายหลัก
      if (primaryResult !== null) {
        finalPrice = primaryResult;
        appliedRounding = `ลงท้ายด้วย ${primaryTargetStr}`;
      } 
      // เงื่อนไข 2 (สำรอง): ถ้าระบุค่าเงื่อนไขแรกไม่ได้ และเปิดใช้เงื่อนไขสำรอง
      else if (rounding.enableFallback && fallbackTargetStr) {
        const fallbackResult = calculateNextEnding(finalPrice, fallbackTargetStr);
        if (fallbackResult !== null) {
           finalPrice = fallbackResult;
           appliedRounding = `ลงท้ายด้วย ${fallbackTargetStr} (เงื่อนไขสำรอง)`;
        }
      }
    }

    // Protection: ป้องกันกรณีปัดเศษแล้วขาดทุนหรือเท่าทุน
    if (finalPrice <= numCost) {
       finalPrice = numCost + 100; // ขั้นต่ำต้องได้กำไร 100 บาทเสมอ
       appliedRounding = 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)';
    }

    return {
      cost: numCost,
      calculatedPrice: finalPrice,
      rawPrice: baseRetail,
      appliedRule: matchedRule,
      appliedRoundingType: appliedRounding,
      margin: finalPrice - numCost,
      marginPercent: ((finalPrice - numCost) / finalPrice) * 100
    };
  }
};