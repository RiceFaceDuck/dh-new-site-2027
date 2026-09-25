import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const DEFAULT_STORE_DATA = {
  storeImage: '',
  storeName: '',
  description: '',
  services: '',
  openHours: '',
  phone: '',
  messengerUrl: '',
  lineUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  shopeeUrl: '',
  lazadaUrl: '',
  websiteUrl: '',
  address: '',
  landmarks: '',
  googleMapLink: '',
  latitude: null,
  longitude: null,
  isSupportActive: false,
  pdpaConsent: false
};

export const useStoreProfileData = (user) => {
  const [storeData, setStoreData] = useState(DEFAULT_STORE_DATA);
  const [loading, setLoading] = useState(true);

  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  const fetchStoreData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // 🚀 SSOT: อ่านจาก users/{uid}/storeProfile/main เป็นหลัก
      const rootStoreRef = doc(db, getCollectionPath('users'), user.uid, 'storeProfile', 'main');
      const rootSnap = await getDoc(rootStoreRef);

      if (rootSnap.exists()) {
        setStoreData({ ...DEFAULT_STORE_DATA, ...rootSnap.data() });
      } else {
        // 🛡️ Fallback: ดึงข้อมูลเดิมจาก artifacts ให้ลูกค้า/พาร์ทเนอร์ทันที ข้อมูลไม่หายแน่นอน 100%
        const legacyStoreRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
        const legacySnap = await getDoc(legacyStoreRef);
        if (legacySnap.exists()) {
          setStoreData({ ...DEFAULT_STORE_DATA, ...legacySnap.data() });
        } else {
          setStoreData(DEFAULT_STORE_DATA);
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStoreData();
    } else {
      setStoreData(DEFAULT_STORE_DATA);
      setLoading(false);
    }
  }, [user?.uid]);

  return { storeData, setStoreData, fetchStoreData, loading };
};
