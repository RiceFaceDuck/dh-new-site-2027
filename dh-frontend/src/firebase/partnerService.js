import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from './config';

// กำหนด App ID
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 🧠 Smart Cache System (ช่วยประหยัด Firestore Reads มหาศาล)
// ==========================================
let cachedPartners = null;
let lastFetchTime = 0;
const CACHE_LIFETIME = 1000 * 60 * 10; // แคชข้อมูลพาร์ทเนอร์ไว้ 10 นาที (600,000 ms)

/**
 * 📍 แปลงลิงก์ Google Maps เป็น ละติจูด, ลองจิจูด (ลูกเล่นเสริม UX)
 * รองรับลิงก์รูปแบบต่างๆ เช่น https://www.google.com/maps/@13.7563,100.5018,15z หรือ ?q=13.7563,100.5018
 */
export const extractCoordsFromUrl = (url) => {
  if (!url) return null;
  // Regex ดักจับพิกัดหลัง @ หรือ ?q=
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

/**
 * 🧮 สูตรคำนวณระยะทาง Haversine Formula (หาพาร์ทเนอร์ใกล้ที่สุด แบบออฟไลน์ ไม่เสียเงินค่า API)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // รัศมีโลก (กิโลเมตร)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // ระยะทางเป็น กิโลเมตร
};

/**
 * 🏪 ดึงข้อมูล Partner ทั้งหมดที่เปิดรับการสนับสนุน (ดึงจาก Cache ถ้ามี)
 */
export const getActivePartners = async (forceRefresh = false) => {
  const now = Date.now();
  
  // ใช้ Cache ถ้ายังไม่หมดอายุและไม่ได้บังคับรีเฟรช
  if (!forceRefresh && cachedPartners && (now - lastFetchTime < CACHE_LIFETIME)) {
    console.log("🟢 Loaded Partners from Smart Cache (Saved Reads)");
    return cachedPartners;
  }

  try {
    // ข้อมูล Partner ควรเก็บแยกไว้ที่ Public เพื่อให้ลูกค้าทุกคนดึงมาดูได้
    const partnersRef = collection(db, 'artifacts', appId, 'public', 'data', 'partners');
    const q = query(partnersRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    const partners = snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    }));

    cachedPartners = partners;
    lastFetchTime = now;
    console.log(`📡 Fetched ${partners.length} Active Partners from Firestore`);
    return partners;
  } catch (error) {
    console.error("❌ Error fetching partners:", error);
    return cachedPartners || []; // Fallback กลับไปใช้ Cache ตัวเก่าถ้าดึงพลาด
  }
};

/**
 * 🎯 ค้นหา Partner ที่อยู่ใกล้ลูกค้ามากที่สุด (ประมวลผลทันทีรวดเร็วมาก)
 * @param {number} userLat - ละติจูดลูกค้า
 * @param {number} userLng - ลองจิจูดลูกค้า
 * @returns {Object|null} - ข้อมูลพาร์ทเนอร์ที่ใกล้ที่สุด พร้อมระบุระยะทาง (km)
 */
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
        nearestPartner = { 
          ...partner, 
          distanceKm: distance.toFixed(2) // แนบระยะทางไปให้แสดงผลด้วย
        };
      }
    }
  });

  return nearestPartner;
};

/**
 * 📝 อัปเดตข้อมูลและสถานะการเป็น Partner (สำหรับให้ User กดเปิด-ปิด หรือเซฟข้อมูลโปรไฟล์)
 * @param {string} userId - ID ของผู้ใช้
 * @param {Object} partnerData - ข้อมูลเช่น { storeName, mapsUrl, phone, services }
 * @param {boolean} isActive - สถานะเปิด/ปิด รับการสนับสนุน
 */
export const updatePartnerProfile = async (userId, partnerData, isActive) => {
  if (!userId) throw new Error("User ID is required to update partner profile");

  try {
    const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', userId);
    
    // ตรวจสอบถ้ามีการอัปเดต Maps URL ให้แปลงเป็นพิกัดออโต้เลย
    let coords = {};
    if (partnerData?.mapsUrl) {
      const extracted = extractCoordsFromUrl(partnerData.mapsUrl);
      if (extracted) coords = extracted;
    }

    const payload = {
      ...partnerData,
      ...coords, // นำพิกัดที่แปลงได้ยัดเข้าไปด้วย
      isActive,
      updatedAt: new Date().toISOString()
    };

    // ใช้ merge: true เพื่อไม่ให้ข้อมูลเก่าหาย
    await setDoc(partnerRef, payload, { merge: true });

    // ล้าง Cache ทิ้ง เพื่อให้รอบหน้าดึงข้อมูลใหม่ทันที
    cachedPartners = null; 
    lastFetchTime = 0;

    return true;
  } catch (error) {
    console.error("❌ Error updating partner profile:", error);
    throw error;
  }
};