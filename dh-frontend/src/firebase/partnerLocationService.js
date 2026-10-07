import { collection, doc, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { calculateDistance } from '../utils/geoUtils';
import { safeJsonParse } from 'dh-shared';

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const CACHE_KEY = `active_partners_cache_v4_${appId}`;
const CACHE_TTL_MINUTES = 15; // เก็บแคชไว้ 15 นาที เพื่อประหยัด Firebase Reads

let inFlightFetchPromise = null;

/**
 * 📦 ดึงข้อมูลพาร์ทเนอร์ที่เปิดรับการสนับสนุนทั้งหมด
 * ระบบ 3-Tier Multi-Cache:
 * - Tier 1: LocalStorage Cache (0 Reads, Instant)
 * - Tier 2: Curated Starter Bundle `catalogs/active_partners_bundle` (1 Read รวมร้านช่างครบถ้วน)
 * - Tier 3: Direct Collection Query (Fallback กรณีฉุกเฉิน)
 */
export const fetchAllActivePartners = async (forceRefresh = false) => {
  if (!forceRefresh && inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  const fetchPromise = (async () => {
    try {
      // 1. ตรวจสอบ Cache ก่อน (Tier 1: LocalStorage, 0 Reads)
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = safeJsonParse(cachedData);
          if (parsed && parsed.data && parsed.timestamp) {
            const { data, timestamp } = parsed;
            const now = new Date().getTime();
            // ถ้าแคชยังไม่หมดอายุ (น้อยกว่า CACHE_TTL_MINUTES)
            if (now - timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
              console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์จาก Cache (Tier 1 LocalStorage, 0 Reads)");
              return data;
            }
          }
        }
      }

      // 2. ดึงจาก Curated Starter Bundle (Tier 2: Single Document Read = 1 Read เท่านั้น)
      console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์จาก Starter Bundle (Tier 2)...");
      try {
        const bundleRef = doc(db, 'catalogs', 'active_partners_bundle');
        const bundleSnap = await getDoc(bundleRef);
        if (bundleSnap.exists()) {
          const bundleData = bundleSnap.data();
          if (bundleData && Array.isArray(bundleData.items) && bundleData.items.length > 0) {
            console.log(`📍 [LocationService] โหลดพาร์ทเนอร์สำเร็จจาก Starter Bundle (${bundleData.items.length} ร้าน, 1 Read)`);
            const cachePayload = {
              data: bundleData.items,
              timestamp: new Date().getTime()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
            return bundleData.items;
          }
        }
      } catch (bundleErr) {
        console.warn("⚠️ [LocationService] ไม่สามารถดึง Starter Bundle ได้ กำลังใช้ Fallback Query:", bundleErr);
      }

      // 3. Fallback: ถ้าแคชหมดอายุและไม่มี Bundle ให้ดึงจาก Firebase ActivePartners (Tier 3)
      console.log("📍 [LocationService] Fallback ดึงข้อมูลพาร์ทเนอร์จาก ActivePartners collection...");
      const partnersRef = collection(db, getCollectionPath('ActivePartners'));
      const q = query(partnersRef, limit(100));
      const snapshot = await getDocs(q);
      
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 4. เซฟลง Cache เพื่อใช้ในครั้งต่อไป
      const cachePayload = {
        data: partners,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

      return partners;
    } catch (error) {
      console.error("❌ [LocationService] เกิดข้อผิดพลาดในการดึงข้อมูลพาร์ทเนอร์:", error);
      return [];
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  if (!forceRefresh) {
    inFlightFetchPromise = fetchPromise;
  }

  return fetchPromise;
};

/**
 * 🎯 ค้นหาร้านพาร์ทเนอร์ที่อยู่ใกล้ลูกค้ามากที่สุด (Nearest Partner - Distance First 100%)
 * สำหรับโซนใต้ปุ่มใส่ตะกร้า: ยึดระยะทางจริงใกล้ตัวลูกค้าที่สุดเป็นอันดับแรกก่อนสิ่งอื่นใด
 */
export const findNearestPartner = async (userLat, userLon, maxDistanceKm = 30) => {
  try {
    if (!userLat || !userLon) return null;

    const partners = await fetchAllActivePartners();
    if (partners.length === 0) return null;

    let bestPartner = null;
    let minDistance = Infinity;

    partners.forEach(partner => {
      const lat = Number(partner.latitude ?? partner.lat);
      const lng = Number(partner.longitude ?? partner.lng);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const distance = calculateDistance(userLat, userLon, lat, lng);

      if (distance <= maxDistanceKm) {
        // ยึดระยะทางที่น้อยที่สุดก่อนสิ่งอื่นใด (Distance-First 100%)
        const isCloser = distance < minDistance;
        const isVirtuallySame = Math.abs(distance - minDistance) < 0.1;
        const hasHigherPoints = (partner.points || 0) > (bestPartner?.points || 0);

        if (isCloser || (isVirtuallySame && hasHigherPoints)) {
          minDistance = distance;
          bestPartner = { 
            ...partner, 
            distanceKm: distance,
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