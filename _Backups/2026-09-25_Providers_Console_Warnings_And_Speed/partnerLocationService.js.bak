import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { calculateDistance } from '../utils/geoUtils';
import { safeJsonParse } from 'dh-shared';

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const CACHE_KEY = `active_partners_cache_v4_${appId}`;
const CACHE_TTL_MINUTES = 15; // เก็บแคชไว้ 15 นาที เพื่อประหยัด Firebase Reads

/**
 * 📦 ดึงข้อมูลพาร์ทเนอร์ที่เปิดรับการสนับสนุนทั้งหมด
 * (ระบบจะเช็คแคชใน sessionStorage ก่อนเพื่อประหยัด Reads/Writes)
 */
export const fetchAllActivePartners = async (forceRefresh = false) => {
  try {
    // 1. ตรวจสอบ Cache ก่อน
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = safeJsonParse(cachedData);
        const now = new Date().getTime();
        // ถ้าแคชยังไม่หมดอายุ (น้อยกว่า CACHE_TTL_MINUTES)
        if (now - timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
          console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์จาก Cache (ประหยัด Reads)");
          console.table(data.map(p => ({ id: p.id, name: p.storeName, lat: p.latitude, lng: p.longitude })));
          return data;
        }
      }
    }

    // 2. ถ้าแคชหมดอายุ หรือบังคับ Refresh ค่อยไปดึงจาก Firebase
    console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์ใหม่จาก Firebase...");
    const partnersRef = collection(db, getCollectionPath('ActivePartners'));
    const q = query(partnersRef, limit(500));
    const snapshot = await getDocs(q);
    
    const partners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. เซฟลง Cache เพื่อใช้ในครั้งต่อไป
    const cachePayload = {
      data: partners,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

    return partners;
  } catch (error) {
    console.error("❌ [LocationService] เกิดข้อผิดพลาดในการดึงข้อมูลพาร์ทเนอร์:", error);
    return [];
  }
};

/**
 * 🎯 ค้นหาร้านพาร์ทเนอร์ที่อยู่ใกล้ลูกค้ามากที่สุด (Nearest Partner) - Weighted Algorithm
 * ประเมินจาก: ระยะทาง (Distance) และ คะแนนเครดิต (Points)
 */
export const findNearestPartner = async (userLat, userLon, maxDistanceKm = 30) => {
  try {
    if (!userLat || !userLon) return null;

    const partners = await fetchAllActivePartners();
    
    if (partners.length === 0) return null;

    let bestPartner = null;
    let maxScore = -Infinity;

    partners.forEach(partner => {
      if (!partner.latitude || !partner.longitude) return;

      const distance = calculateDistance(
        userLat, 
        userLon, 
        partner.latitude, 
        partner.longitude
      );

      if (distance <= maxDistanceKm) {
        const safeDistance = distance < 0.1 ? 0.1 : distance;
        const creditPoints = partner.points || 1; 
        
        // 🌟 Weighted Search Algorithm
        const score = creditPoints / safeDistance;

        if (score > maxScore) {
          maxScore = score;
          bestPartner = { 
            ...partner, 
            distanceKm: distance,
            score: score.toFixed(2),
            formattedDistance: distance < 1 ? `${Math.round(distance * 1000)} เมตร` : `${distance.toFixed(1)} กม.`
          };
        }
      }
    });

    return bestPartner;
  } catch (error) {
    console.error("❌ [LocationService] เกิดข้อผิดพลาดในการหาพาร์ทเนอร์ใกล้เคียง:", error);
    return null;
  }
};

/**
 * 🌟 ระบบ Fallback: ดึงพาร์ทเนอร์ที่มีคะแนนสูงสุด (ใช้กรณีลูกค้าบล็อค Location หรือไม่มีใครอยู่ใกล้)
 */
export const getFallbackPartner = async () => {
  try {
    const partners = await fetchAllActivePartners();
    if (partners.length === 0) return null;
    
    // เรียงตามคะแนน points (มากไปน้อย)
    const sorted = [...partners].sort((a, b) => (b.points || 0) - (a.points || 0));
    const best = sorted[0];
    
    return {
      ...best,
      score: best.points || 0,
      formattedDistance: 'ร้านแนะนำ (ทั่วประเทศ)'
    };
  } catch (error) {
    console.error("❌ [LocationService] Fallback Error:", error);
    return null;
  }
};

/**
 * 🧹 ล้างแคชของพาร์ทเนอร์ (ใช้เมื่อแอดมินหรือระบบต้องการบังคับดึงข้อมูลใหม่ทันที)
 */
export const clearPartnerCache = () => {
  localStorage.removeItem(CACHE_KEY);
  console.log("📍 [LocationService] ล้างแคชข้อมูลพาร์ทเนอร์สำเร็จ");
};