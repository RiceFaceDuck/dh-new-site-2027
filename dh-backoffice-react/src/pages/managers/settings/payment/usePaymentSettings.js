import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { toast } from 'react-hot-toast';

export const DEFAULT_PAYMENT_CONFIG = {
  bankName: 'ธนาคารกรุงศรีอยุธยา (Krungsri)',
  bankCode: 'BAY',
  bankShort: 'กรุงศรี',
  accountName: 'นายเหว่ย ไห',
  accountNumber: '692-1-14458-6',
  promptPayNumber: '',
  promptPayName: '',
  cardImageUrl: '',
  enableBankTransfer: true,
  enablePromptPay: false,
  note: 'กรุณาตรวจสอบยอดเงินและชื่อบัญชีให้ถูกต้องก่อนโอนเงิน'
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState(DEFAULT_PAYMENT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, getCollectionPath('settings'), 'payment');
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          setSettings({ ...DEFAULT_PAYMENT_CONFIG, ...snap.data() });
        }
      } catch (err) {
        console.error("🔥 Error fetching payment settings:", err);
        toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าบัญชีได้");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const updateSettings = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const docRef = doc(db, getCollectionPath('settings'), 'payment');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success("บันทึกการตั้งค่าวิธีชำระเงินเรียบร้อยแล้ว");
    } catch (err) {
      console.error("🔥 Error saving payment settings:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    saveSettings
  };
}
