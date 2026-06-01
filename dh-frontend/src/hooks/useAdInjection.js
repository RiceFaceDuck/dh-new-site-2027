 
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { marketingService } from '../firebase/marketingService';

/**
 * 🎯 Custom Hook: Smart Ad Injection Engine (ระบบสมองกลแทรกโฆษณา)
 * อัปเกรด: 
 * 1. รองรับ Unified Ads (นามบัตร + ลิงก์สินค้า)
 * 2. สุ่มตำแหน่งแทรก 100% (Fully Randomized) ไม่บังคับให้โฆษณาอยู่ชิ้นแรก
 * 3. มีระบบ Shuffle สับเปลี่ยนโฆษณาอย่างเป็นธรรม
 * * @param {Array} regularProducts - Array ของรายการสินค้าปกติที่ต้องการนำมาแทรกโฆษณา
 * @param {Number} adLimit - จำนวนโฆษณาที่จะดึงมาหมุนเวียน (ค่าเริ่มต้น 20 ตัว)
 * @returns {Object} { productsWithAds, loadingAds, refreshAds }
 */
export const useAdInjection = (regularProducts, adLimit = 20) => {
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [displayRatio, setDisplayRatio] = useState(10); // ค่าเริ่มต้น 10:1 

  // 🛡️ Helper: ฟังก์ชันสับเปลี่ยน Array อย่างสมบูรณ์แบบ (Fisher-Yates Shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 1. ฟังก์ชันดึงโฆษณาและการตั้งค่าจาก Firebase
  const fetchAdsAndSettings = useCallback(async () => {
    try {
      setLoadingAds(true);
      
      // 📥 1. ดึงการตั้งค่า Ratio จากระบบหลังบ้าน (Marketing Settings)
      const settingsSnap = await getDoc(doc(db, 'artifacts', typeof window !== "undefined" && window.__app_id ? window.__app_id : 'default-app-id', 'public', 'data', 'settings', 'marketing'));
      if (settingsSnap.exists() && settingsSnap.data().displayRatio) {
        const ratio = Number(settingsSnap.data().displayRatio);
        if (ratio > 0) setDisplayRatio(ratio);
      }

      // 📥 2. ดึงข้อมูลโฆษณา 2 ประเภท (นามบัตร และ ลิงก์สินค้า) พร้อมกัน
      // หมายเหตุ: BILLBOARD ไม่นำมาแทรกในนี้ เพราะขนาดและสัดส่วน (16:9) ไม่เข้ากับ Grid สินค้า
      const [businessCards, productLinks] = await Promise.all([
        marketingService.getActivePartnerAds('BUSINESS_CARD'),
        marketingService.getActivePartnerAds('PRODUCT_LINK')
      ]);

      // 🔀 3. รวมโฆษณาทั้ง 2 ระบบ และสับเปลี่ยนแบบสุ่ม (Shuffle) เพื่อความยุติธรรม
      const combinedAds = shuffleArray([...businessCards, ...productLinks]).slice(0, adLimit);
      setAds(combinedAds);

    } catch (error) {
      console.error("🔥 [useAdInjection] Error fetching ads or settings:", error);
    } finally {
      setLoadingAds(false);
    }
  }, [adLimit]);

  // 2. ดึงข้อมูลอัตโนมัติ 1 ครั้ง เมื่อเรียกใช้งาน Hook นี้
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchAdsAndSettings();
    }
    return () => { isMounted = false; };
  }, [fetchAdsAndSettings]);

  // 3. 🧠 สมองกลคำนวณการแทรกโฆษณาแบบสุ่มตำแหน่ง 100% (True Random Injection)
  const productsWithAds = useMemo(() => {
    if (!regularProducts || !Array.isArray(regularProducts)) return [];
    if (regularProducts.length === 0) return [];
    
    // ถ้าไม่มีโฆษณาเลย ให้ส่งคืนสินค้าปกติเพียวๆ กลับไป เพื่อไม่ให้หน้าเว็บล่ม
    if (!ads || ads.length === 0) return regularProducts;

    const mergedList = [];
    let adIndex = 0;

    // 🔄 หั่นสินค้าปกติเป็นกลุ่มๆ (Chunks) ตามอัตราส่วน displayRatio (เช่น กลุ่มละ 10 ชิ้น)
    for (let i = 0; i < regularProducts.length; i += displayRatio) {
      const chunk = regularProducts.slice(i, i + displayRatio);
      
      // 🎲 สุ่มตำแหน่งที่จะแทรกโฆษณา "ภายในกลุ่มนี้" (ตั้งแต่ 0 ถึง ชิ้นสุดท้ายของกลุ่ม)
      // กฎใหม่: ปลดล็อคการบังคับโฆษณาขึ้นเป็นชิ้นแรก ให้สุ่มได้อย่างอิสระ 100%
      const randomInsertPos = Math.floor(Math.random() * chunk.length);

      for (let j = 0; j < chunk.length; j++) {
        // เมื่อวนลูปถึงตำแหน่งที่สุ่มได้ ให้ยัดโฆษณาลงไป
        if (j === randomInsertPos) {
          mergedList.push({ 
            ...ads[adIndex % ads.length], // ใช้ Modulo (%) เพื่อหมุนวนเอาโฆษณากลับมาแสดงใหม่ หากโฆษณามีน้อยกว่าจำนวนสินค้า
            isSponsoredAd: true // ติด Tag ให้ Frontend รู้ว่าเป็นโฆษณา เพื่อเรียกใช้ UI เฉพาะ
          });
          adIndex++;
        }
        
        // ตามด้วยยัดสินค้าปกติลงไป
        mergedList.push(chunk[j]);
      }
    }

    return mergedList;
  }, [regularProducts, ads, displayRatio]);

  return { 
    productsWithAds,  // Array สินค้าที่ผสมโฆษณาแล้ว นำไป .map() ในหน้าเว็บได้เลย
    loadingAds,       // สถานะการโหลด (ใช้ทำ Skeleton หรือ Loader ได้)
    refreshAds: fetchAdsAndSettings 
  };
};

export default useAdInjection;