import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from './config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
    const partnersRef = collection(db, 'artifacts', appId, 'public', 'data', 'partners');
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

export const findNearestPartner = async (userLat, userLng) => {
  if (!userLat || !userLng) return null;
  const partners = await getActivePartners();
  if (!partners || partners.length === 0) return null;

  let nearestPartner = null;
  let minDistance = Infinity;

  partners.forEach(partner => {
    if (partner.lat && partner.lng) {
      const distance = calculateDistance(userLat, userLng, partner.lat, partner.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPartner = { ...partner, distanceKm: distance.toFixed(2) };
      }
    }
  });
  return nearestPartner;
};

export const updatePartnerProfile = async (userId, partnerData, isActive) => {
  if (!userId) throw new Error("User ID is required");
  try {
    const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', userId);
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
    throw error;
  }
};

// 🚀 [FIX]: เพิ่ม Named Export เพื่อแก้ปัญหา Uncaught SyntaxError
export const partnerService = {
  getActivePartners,
  findNearestPartner,
  updatePartnerProfile,
  extractCoordsFromUrl
};