import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { unwrapCreditConfig } from 'dh-shared/src/utils/creditUtils';
import { creditCacheManager, CREDIT_CACHE_KEYS, CREDIT_CACHE_TTL } from '../../../../../firebase/credit/creditCacheManager';
import toast from 'react-hot-toast';

export const useCreditSettingsState = () => {
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    autoSuspendNegative: true,
    maxTransactionLimit: 50000,
    notifyLargeTransactions: true,
    largeTransactionThreshold: 20000,
    pointsEarningRate: 100,
    adImpressionCost: 5,
    adImpressionCount: 100,
    adClickCost: 2,
    partnerRankingCost: 50,
    skuBonusRules: '',
    compatibleCreditReward: 2
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const cached = creditCacheManager.get(CREDIT_CACHE_KEYS.CREDIT_CONFIG, CREDIT_CACHE_TTL.CREDIT_CONFIG);
        if (cached) {
          setSettings(prev => ({ ...prev, adImpressionCount: 100, ...cached }));
          setIsLoading(false);
          return;
        }

        const creditRef = doc(db, getCollectionPath('settings'), 'credit_config');
        const knowledgeRef = doc(db, getCollectionPath('settings'), 'knowledge_config');

        const [creditSnap, knowledgeSnap] = await Promise.all([
          getDoc(creditRef),
          getDoc(knowledgeRef)
        ]);

        let merged = {};
        if (creditSnap.exists()) {
          const unwrapped = unwrapCreditConfig(creditSnap.data());
          if (unwrapped) merged = { ...merged, ...unwrapped };
        }
        if (knowledgeSnap.exists()) {
          const kd = knowledgeSnap.data();
          if (kd.compatibleCreditReward !== undefined) {
            merged.compatibleCreditReward = kd.compatibleCreditReward;
          }
        }

        creditCacheManager.set(CREDIT_CACHE_KEYS.CREDIT_CONFIG, merged);
        setSettings(prev => ({ ...prev, adImpressionCount: 100, ...merged }));
      } catch (err) {
        console.error("🔥 DH-Core System Error [Fetch Settings]:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(false);
  };

  const handleChange = (e, key) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setSettings(prev => ({ ...prev, [key]: parseInt(val || '0', 10) }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { compatibleCreditReward, ...configData } = settings;

      const creditRef = doc(db, getCollectionPath('settings'), 'credit_config');
      await setDoc(creditRef, { 
        config: configData,
        updatedAt: serverTimestamp() 
      }, { merge: true });

      const knowledgeRef = doc(db, getCollectionPath('settings'), 'knowledge_config');
      await setDoc(knowledgeRef, {
        compatibleCreditReward: compatibleCreditReward || 2,
        updatedAt: serverTimestamp()
      }, { merge: true });

      creditCacheManager.invalidate(CREDIT_CACHE_KEYS.CREDIT_CONFIG);
      setSaveSuccess(true);
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("🔥 DH-Core System Error [Save Settings]:", err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    saveSuccess,
    handleToggle,
    handleChange,
    handleSaveSettings
  };
};
