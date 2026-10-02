import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import toast from 'react-hot-toast';
import { historyService } from '../../../../firebase/historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { settingsService } from '../../../../firebase/settingsService';
import { setCachedTiers } from '../../../../firebase/credit/creditFormatService';

/**
 * 🛡️ Validation Schema & Integrity Rules for Role & Tier Configuration
 */
export const validateRoleTierConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return { isValid: false, message: 'ข้อมูลการตั้งค่าไม่ถูกต้อง' };
  }

  // 1. Roles validation
  if (!Array.isArray(config.roles) || config.roles.length === 0) {
    return { isValid: false, message: 'ต้องมี Role อย่างน้อย 1 รายการ' };
  }

  const roleLevels = new Set();
  const roleIds = new Set();
  const validPriceTiers = ['retail', 'wholesale', 'partner', 'enterprise'];

  for (let i = 0; i < config.roles.length; i++) {
    const role = config.roles[i];
    if (!role.name || !role.name.trim()) {
      return { isValid: false, message: `Role ลำดับที่ ${i + 1} ต้องมีชื่อระบุ` };
    }
    if (!role.id || !role.id.trim()) {
      return { isValid: false, message: `Role "${role.name}" ต้องมีรหัส ID` };
    }
    if (roleIds.has(role.id)) {
      return { isValid: false, message: `พบ Role ID ซ้ำกัน: "${role.id}"` };
    }
    roleIds.add(role.id);

    const level = Number(role.level);
    if (!Number.isInteger(level) || level <= 0) {
      return { isValid: false, message: `Role "${role.name}" มีระดับ Level ไม่ถูกต้อง (ต้องเป็นเลขจำนวนเต็มบวก)` };
    }
    if (roleLevels.has(level)) {
      return { isValid: false, message: `พบระดับ Level ซ้ำกัน: Level ${level}` };
    }
    roleLevels.add(level);

    if (role.defaultPriceTier && !validPriceTiers.includes(role.defaultPriceTier)) {
      return { isValid: false, message: `Role "${role.name}" มีระดับราคาไม่ถูกต้อง (${role.defaultPriceTier})` };
    }
  }

  // 2. Tiers validation
  if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
    return { isValid: false, message: 'ต้องมี Tier อย่างน้อย 1 รายการ' };
  }

  const tierIds = new Set();
  let prevPoints = -1;

  for (let i = 0; i < config.tiers.length; i++) {
    const tier = config.tiers[i];
    if (!tier.name || !tier.name.trim()) {
      return { isValid: false, message: `Tier ลำดับที่ ${i + 1} ต้องมีชื่อระบุ` };
    }
    if (!tier.id || !tier.id.trim()) {
      return { isValid: false, message: `Tier "${tier.name}" ต้องมีรหัส ID` };
    }
    if (tierIds.has(tier.id)) {
      return { isValid: false, message: `พบ Tier ID ซ้ำกัน: "${tier.id}"` };
    }
    tierIds.add(tier.id);

    const points = Number(tier.minPoints);
    if (isNaN(points) || points < 0) {
      return { isValid: false, message: `Tier "${tier.name}" แต้มสะสมขั้นต่ำต้องไม่ติดลบ` };
    }
    if (points <= prevPoints && i > 0) {
      return { isValid: false, message: `แต้มสะสมขั้นต่ำของ Tier "${tier.name}" (${points}) ต้องมากกว่าระดับก่อนหน้า (${prevPoints})` };
    }
    prevPoints = points;

    const multiplier = Number(tier.multiplier);
    if (isNaN(multiplier) || multiplier < 1.0) {
      return { isValid: false, message: `Tier "${tier.name}" ต้องมีตัวคูณแต้ม (Multiplier) ตั้งแต่ 1.0 ขึ้นไป` };
    }
  }

  return { isValid: true };
};

export const DEFAULT_ROLE_TIER_SETTINGS = {
  roles: [
    { id: 'member', name: 'Member / General', level: 1, description: 'ลูกค้าทั่วไป / สมาชิกเริ่มต้น', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200', defaultPriceTier: 'retail' },
    { id: 'wholesale', name: 'Wholesale / Mechanic', level: 2, description: 'ช่างซ่อม / ราคาส่งทั่วไป', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', defaultPriceTier: 'wholesale' },
    { id: 'partner', name: 'VIP / Retail Partner', level: 3, description: 'ร้านค้าพันธมิตร / VIP', badgeColor: 'bg-slate-800 text-white border-slate-800', defaultPriceTier: 'partner' },
    { id: 'enterprise', name: 'Enterprise Partner', level: 4, description: 'คู่ค้าใหญ่ระดับองค์กร / สัญญารายปี', badgeColor: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', defaultPriceTier: 'enterprise' }
  ],
  tiers: [
    { id: 'member', name: 'Member', icon: '🌟', minPoints: 0, multiplier: 1.0, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'silver', name: 'Silver', icon: '🥈', minPoints: 1000, multiplier: 1.05, color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { id: 'gold', name: 'Gold', icon: '🥇', minPoints: 5000, multiplier: 1.10, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'platinum', name: 'Platinum', icon: '👑', minPoints: 10000, multiplier: 1.20, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'diamond', name: 'Diamond', icon: '💎', minPoints: 100000, multiplier: 1.50, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' }
  ],
  hierarchyPolicy: {
    allowManualRoleOverride: true,
    autoTierCalculation: true,
    inheritTierDiscount: true
  }
};

export const useRoleTierSettingsState = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings({ ...DEFAULT_ROLE_TIER_SETTINGS, ...snap.data() });
      } else {
        setSettings(DEFAULT_ROLE_TIER_SETTINGS);
      }
    } catch (error) {
      console.error("Error fetching Role/Tier settings:", error);
      toast.error('ไม่สามารถโหลดการตั้งค่า Role/Tier ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings) => {
    // 🛡️ Data Integrity Check before writing to Firestore
    const validation = validateRoleTierConfig(newSettings);
    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    try {
      const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
      await setDoc(docRef, { ...newSettings, updatedAt: serverTimestamp() }, { merge: true });
      setSettings(newSettings);

      // Invalidate and sync memory caches immediately
      if (settingsService.clearRoleTierCache) {
        settingsService.clearRoleTierCache();
      }
      if (Array.isArray(newSettings.tiers)) {
        setCachedTiers(newSettings.tiers);
      }

      historyService.addLog({
        module: 'SECURITY',
        action: 'UPDATE_ROLE_TIER_CONFIG',
        target: { id: 'role_tier_config' },
        details: { legacy_details: 'อัปเดตโครงสร้างการจัดลำดับชั้น Role/Tier' }
      });

      toast.success('บันทึกการตั้งค่า Role/Tier เรียบร้อยแล้ว');
      return true;
    } catch (error) {
      console.error("Error saving Role/Tier settings:", error);
      toast.error('บันทึกการตั้งค่าไม่สำเร็จ');
      return false;
    }
  };

  return { settings, loading, saveSettings };
};
