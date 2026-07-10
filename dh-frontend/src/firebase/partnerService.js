import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 Smart Cache System
// ==========================================
let cachedPartners = null;
let lastFetchTime = 0;
const CACHE_LIFETIME = 1000 * 60 * 10; 

export const extractCoordsFromUrl = (url) => {
  if (!url) return null;
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)|q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = url.match(regex);
  if (match) {
    return {
      lat: parseFloat(match[1] || match[3]),
      lng: parseFloat(match[2] || match[4])
    };
  }
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

export const getActivePartners = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedPartners && (now - lastFetchTime < CACHE_LIFETIME)) {
    return cachedPartners;
  }

  try {
    const partnersRef = collection(db, getCollectionPath('partners'));

    const q = query(partnersRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const partners = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
    cachedPartners = partners;
    lastFetchTime = now;
    return partners;
  } catch (error) {
    console.error("Error fetching partners:", error);
    return cachedPartners || [];
  }
};

export const updatePartnerProfile = async (userId, partnerData, isActive) => {
  try {
    if (!userId) throw new Error("User ID is required");
    const partnerRef = doc(db, getCollectionPath('partners'), userId);
    let coords = {};
    if (partnerData?.mapsUrl) {
      const extracted = extractCoordsFromUrl(partnerData.mapsUrl);
      if (extracted) coords = extracted;
    }
    const payload = { ...partnerData, ...coords, isActive, updatedAt: new Date().toISOString() };
    await setDoc(partnerRef, payload, { merge: true });
    cachedPartners = null; 
    lastFetchTime = 0;
    return true;
  } catch (error) {
    console.error("Error updating partner profile:", error);
    throw error;
  }
};

export const partnerService = {
  getActivePartners,
  updatePartnerProfile,
  extractCoordsFromUrl
};
