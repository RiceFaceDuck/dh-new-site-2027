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
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      const rootStoreRef = doc(db, getCollectionPath('users'), user.uid, 'storeProfile', 'main');

      const [storeSnap, rootSnap] = await Promise.all([
        getDoc(storeRef),
        getDoc(rootStoreRef)
      ]);

      let mergedData = { ...DEFAULT_STORE_DATA };

      if (rootSnap.exists()) {
        mergedData = { ...mergedData, ...rootSnap.data() };
      }

      if (storeSnap.exists()) {
        const artifactsData = storeSnap.data();
        if (artifactsData.storeName || !mergedData.storeName) {
          mergedData = { ...mergedData, ...artifactsData };
        }
      }

      setStoreData(mergedData);
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
