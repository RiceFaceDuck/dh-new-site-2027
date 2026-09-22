import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import toast from 'react-hot-toast';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const useCreditSettingsState = () => {
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    autoSuspendNegative: true,
    maxTransactionLimit: 50000,
    notifyLargeTransactions: true,
    largeTransactionThreshold: 20000,
    pointsEarningRate: 100,
    adImpressionCost: 5,
    adClickCost: 2,
    partnerRankingCost: 50,
    skuBonusRules: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, getCollectionPath('settings'), 'credit_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.config) {
            setSettings(prev => ({ ...prev, ...data.config }));
          }
        }
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
      const docRef = doc(db, getCollectionPath('settings'), 'credit_config');
      await setDoc(docRef, { 
        config: settings,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
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
