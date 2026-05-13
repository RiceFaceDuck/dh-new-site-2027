/* eslint-disable */
import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const CACHE_KEY = `active_partners_cache_${appId}`;
const CACHE_TTL_MINUTES = 15; // เก็บแคชไว้ 15 นาที เพื่อประหยัด Firebase Reads

/**
 * 🧮 สูตรคำนวณระยะทาง (Haversine Formula) 
 * เพื่อหาความห่างระหว่าง 2 พิกัด บนพื้นผิวโลก (หน่วยเป็นกิโลเมตร)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // รัศมีของโลก (กิโลเมตร)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; 
  return distance; 
};

/**
 * 📦 ดึงข้อมูลพาร์ทเนอร์ที่เปิดรับการสนับสนุนทั้งหมด
 * (ระบบจะเช็คแคชใน sessionStorage ก่อนเพื่อประหยัด Reads/Writes)
 */
export const fetchAllActivePartners = async (forceRefresh = false) => {
  try {
    // 1. ตรวจสอบ Cache ก่อน
    if (!forceRefresh) {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        // ถ้าแคชยังไม่หมดอายุ (น้อยกว่า CACHE_TTL_MINUTES)
        if (now - timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
          console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์จาก Cache (ประหยัด Reads)");
          return data;
        }
      }
    }

    // 2. ถ้าแคชหมดอายุ หรือบังคับ Refresh ค่อยไปดึงจาก Firebase
    console.log("📍 [LocationService] ดึงข้อมูลพาร์ทเนอร์ใหม่จาก Firebase...");
    const partnersRef = collection(db, 'artifacts', appId, 'public', 'data', 'ActivePartners');
    const snapshot = await getDocs(partnersRef);
    
    const partners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. เซฟลง Cache เพื่อใช้ในครั้งต่อไป
    const cachePayload = {
      data: partners,
      timestamp: new Date().getTime()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

    return partners;
  } catch (error) {
    console.error("❌ [LocationService] เกิดข้อผิดพลาดในการดึงข้อมูลพาร์ทเนอร์:", error);
    return [];
  }
};

/**
 * 🎯 ค้นหาร้านพาร์ทเนอร์ที่อยู่ใกล้ลูกค้ามากที่สุด (Nearest Partner)
 * @param {number} userLat - ละติจูดของลูกค้า
 * @param {number} userLon - ลองจิจูดของลูกค้า
 * @param {number} maxDistanceKm - รัศมีสูงสุดในการค้นหา (กิโลเมตร)
 * @returns {Object|null} คืนค่า Object พาร์ทเนอร์ที่ใกล้ที่สุด (พร้อมแนบระยะทาง) หรือ null ถ้าไม่มีใครอยู่ในรัศมี
 */
export const findNearestPartner = async (userLat, userLon, maxDistanceKm = 30) => {
  if (!userLat || !userLon) return null;

  const partners = await fetchAllActivePartners();
  
  if (partners.length === 0) return null;

  let nearestPartner = null;
  let minDistance = Infinity;

  partners.forEach(partner => {
    // ข้ามคนที่ไม่มีพิกัด
    if (!partner.latitude || !partner.longitude) return;

    const distance = calculateDistance(
      userLat, 
      userLon, 
      partner.latitude, 
      partner.longitude
    );

    // เลือกร้านที่ระยะทางน้อยกว่าที่เคยเจอมา และต้องไม่เกิน maxDistanceKm
    if (distance < minDistance && distance <= maxDistanceKm) {
      minDistance = distance;
      nearestPartner = { 
        ...partner, 
        distanceKm: distance, // แนบระยะทางเข้าไปด้วยเพื่อไปแสดงผล (เช่น 2.5 กม.)
        formattedDistance: distance < 1 ? `${Math.round(distance * 1000)} เมตร` : `${distance.toFixed(1)} กม.`
      };
    }
  });

  return nearestPartner; // คืนค่าเฉพาะร้านที่ใกล้และอยู่ในรัศมีที่สุด
};

/**
 * 📡 ฟังก์ชันช่วยเหลือ: ขอสิทธิ์ดึงพิกัด GPS ของผู้เข้าชมเว็บไซต์อย่างนุ่มนวล
 */
export const getUserCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("อุปกรณ์ของคุณไม่รองรับระบบ GPS"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        // จัดการ Error (เช่น ลูกค้ากดปฏิเสธ (Block) การเข้าถึงตำแหน่ง)
        let errorMsg = "ไม่สามารถดึงตำแหน่งได้";
        if (error.code === 1) errorMsg = "ผู้ใช้งานไม่อนุญาตให้เข้าถึงตำแหน่งที่ตั้ง (Permission Denied)";
        if (error.code === 2) errorMsg = "ไม่พบสัญญาณ GPS (Position Unavailable)";
        if (error.code === 3) errorMsg = "หมดเวลาในการค้นหาตำแหน่ง (Timeout)";
        
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // รอนานสุด 10 วินาที
        maximumAge: 0
      }
    );
  });
};

/**
 * 🧹 ล้างแคชของพาร์ทเนอร์ (ใช้เมื่อแอดมินหรือระบบต้องการบังคับดึงข้อมูลใหม่ทันที)
 */
export const clearPartnerCache = () => {
  sessionStorage.removeItem(CACHE_KEY);
  console.log("📍 [LocationService] ล้างแคชข้อมูลพาร์ทเนอร์สำเร็จ");
};