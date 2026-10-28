import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const DEFAULT_STORE_DATA = {
  storeImage: '',
  galleryImages: [],
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

export const normalizeStoreData = (data = {}) => {
  const normalized = {};
  for (const key of Object.keys(DEFAULT_STORE_DATA)) {
    if (key === 'galleryImages') {
      normalized[key] = Array.isArray(data[key]) ? data[key] : [];
    } else {
      normalized[key] = data[key] !== undefined && data[key] !== null ? data[key] : DEFAULT_STORE_DATA[key];
    }
  }
  return normalized;
};

const getDraftStorageKey = (uid) => `dh_store_profile_draft_${uid}`;

export const useStoreProfileData = (user) => {
  const [storeData, setStoreData] = useState(DEFAULT_STORE_DATA);
  const [serverStoreData, setServerStoreData] = useState(DEFAULT_STORE_DATA);
  const [loading, setLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  const isInitialized = useRef(false);
  const debounceTimerRef = useRef(null);
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  const clearDraft = useCallback(() => {
    if (user?.uid) {
      try {
        localStorage.removeItem(getDraftStorageKey(user.uid));
      } catch (err) {
        console.warn('Failed to remove draft from localStorage:', err);
      }
    }
    setHasDraft(false);
  }, [user?.uid]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setStoreData(serverStoreData);
  }, [clearDraft, serverStoreData]);

  const commitSavedData = useCallback((newData) => {
    const normalized = normalizeStoreData(newData);
    clearDraft();
    setServerStoreData(normalized);
    setStoreData(normalized);
  }, [clearDraft]);

  const fetchStoreData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // 🚀 SSOT: อ่านจาก users/{uid}/storeProfile/main เป็นหลัก
      const rootStoreRef = doc(db, getCollectionPath('users'), user.uid, 'storeProfile', 'main');
      const rootSnap = await getDoc(rootStoreRef);

      let fetchedData = DEFAULT_STORE_DATA;
      if (rootSnap.exists()) {
        fetchedData = normalizeStoreData(rootSnap.data());
      } else {
        // 🛡️ Fallback: ดึงข้อมูลเดิมจาก artifacts ให้ลูกค้า/พาร์ทเนอร์ทันที ข้อมูลไม่หายแน่นอน 100%
        const legacyStoreRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
        const legacySnap = await getDoc(legacyStoreRef);
        if (legacySnap.exists()) {
          fetchedData = normalizeStoreData(legacySnap.data());
        }
      }

      setServerStoreData(fetchedData);

      // 🔍 ตรวจสอบข้อมูลร่างชั่วคราว (Draft Cache) ใน LocalStorage
      let draftData = null;
      try {
        const rawDraft = localStorage.getItem(getDraftStorageKey(user.uid));
        if (rawDraft) {
          draftData = JSON.parse(rawDraft);
        }
      } catch (err) {
        console.warn('Failed to parse store profile draft:', err);
      }

      if (draftData) {
        const normalizedDraft = normalizeStoreData({ ...fetchedData, ...draftData });
        const isDifferent = JSON.stringify(normalizedDraft) !== JSON.stringify(fetchedData);
        if (isDifferent) {
          setStoreData(normalizedDraft);
          setHasDraft(true);
        } else {
          setStoreData(fetchedData);
          setHasDraft(false);
          localStorage.removeItem(getDraftStorageKey(user.uid));
        }
      } else {
        setStoreData(fetchedData);
        setHasDraft(false);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
      isInitialized.current = true;
    }
  };

  useEffect(() => {
    if (user) {
      fetchStoreData();
    } else {
      setStoreData(DEFAULT_STORE_DATA);
      setServerStoreData(DEFAULT_STORE_DATA);
      setLoading(false);
      isInitialized.current = false;
      setHasDraft(false);
    }
  }, [user?.uid]);

  // 💾 Auto-save Draft to LocalStorage with 400ms debounce
  useEffect(() => {
    if (!isInitialized.current || loading || !user?.uid) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const normalizedCurrent = normalizeStoreData(storeData);
        const normalizedServer = normalizeStoreData(serverStoreData);
        const isDifferent = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedServer);

        if (isDifferent) {
          localStorage.setItem(getDraftStorageKey(user.uid), JSON.stringify(normalizedCurrent));
          setHasDraft(true);
        } else {
          localStorage.removeItem(getDraftStorageKey(user.uid));
          setHasDraft(false);
        }
      } catch (err) {
        console.warn('Unable to auto-save store profile draft:', err);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [storeData, serverStoreData, user?.uid, loading]);

  return { 
    storeData, 
    setStoreData, 
    fetchStoreData, 
    loading, 
    hasDraft, 
    clearDraft, 
    discardDraft, 
    commitSavedData 
  };
};
