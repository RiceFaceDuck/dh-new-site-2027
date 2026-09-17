import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import toast from 'react-hot-toast';
import { historyService } from '../../../../firebase/historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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
    try {
      const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
      await setDoc(docRef, { ...newSettings, updatedAt: serverTimestamp() }, { merge: true });
      setSettings(newSettings);

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
