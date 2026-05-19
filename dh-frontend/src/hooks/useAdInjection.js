/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { marketingService } from '../firebase/marketingService';

/**
 * 🎯 Custom Hook สำหรับแทรกโฆษณาสินค้าเข้ากับรายการสินค้าหลัก (Smart Ad Injection Engine)
 * อัปเกรด: สุ่มตำแหน่งการแทรกโฆษณา เพื่อความเนียนตา (Random Injection) และดึงเรทจาก Backend
 * * @param {Array} regularProducts - Array ของรายการสินค้าปกติที่ต้องการนำมาแทรกโฆษณา
 * @param {Number} adLimit - จำนวนโฆษณาที่จะดึงมาหมุนเวียน (ค่าเริ่มต้น 20 ตัว)
 * @returns {Object} { productsWithAds, loadingAds, refreshAds }
 */
export const useAdInjection = (regularProducts, adLimit = 20) => {
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [displayRatio, setDisplayRatio] = useState(10); // ค่าเริ่มต้น 10:1 (สำรองไว้หากดึงข้อมูลไม่ได้)

  // 1. ฟังก์ชันดึงโฆษณาและการตั้งค่าจาก Firebase
  const fetchAdsAndSettings = useCallback(async () => {
    try {
      setLoadingAds(true);
      
      // 📥 ดึงการตั้งค่า Ratio จากระบบหลังบ้าน (Marketing Settings)
      const settingsSnap = await getDoc(doc(db, 'settings', 'marketing'));
      if (settingsSnap.exists() && settingsSnap.data().displayRatio) {
        const ratio = Number(settingsSnap.data().displayRatio);
        if (ratio > 0) setDisplayRatio(ratio);
      }

      // 📥 ดึงข้อมูลโฆษณาที่ Active (มีระบบ Shuffle ในตัวจาก Service แล้ว)
      const activeAds = await marketingService.fetchActiveAds(adLimit);
      setAds(activeAds);
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

  // 3. 🧠 สมองกลคำนวณการแทรกโฆษณาแบบสุ่มตำแหน่ง (Smart Random Injection)
  const productsWithAds = useMemo(() => {
    if (!regularProducts || !Array.isArray(regularProducts)) return [];
    if (regularProducts.length === 0) return [];
    
    // ถ้าไม่มีโฆษณาให้แทรก ก็คืนค่าสินค้าปกติกลับไปเลย
    if (!ads || ads.length === 0) return regularProducts;

    const mergedList = [];
    let adIndex = 0;

    // 🔄 แบ่งสินค้าเป็นกลุ่มๆ (Chunks) ตามอัตราส่วน displayRatio เช่น กลุ่มละ 10 ชิ้น
    for (let i = 0; i < regularProducts.length; i += displayRatio) {
      // ดึงสินค้าปกติตามอัตราส่วนออกมา
      const chunk = regularProducts.slice(i, i + displayRatio);
      
      // 🎲 สุ่มตำแหน่งที่จะแทรกโฆษณาภายในกลุ่มนี้ (ตั้งแต่ชิ้นแรก 0 ถึง ชิ้นสุดท้ายของกลุ่ม)
      // ลูกค้าจะไม่รู้เลยว่าโฆษณาจะโผล่มาตรงไหน ช่วยให้ดูเป็นธรรมชาติ
      const randomInsertPos = Math.floor(Math.random() * chunk.length);

      for (let j = 0; j < chunk.length; j++) {
        // เมื่อวนลูปถึงตำแหน่งที่สุ่มได้ ให้ยัดโฆษณาลงไปก่อน
        if (j === randomInsertPos) {
          mergedList.push({ 
            ...ads[adIndex % ads.length], // ใช้ Modulo วนโฆษณากลับมาใช้ใหม่ได้เรื่อยๆ (ในกรณีที่สินค้ายาวกว่าโฆษณา)
            isSponsoredAd: true 
          });
          adIndex++;
        }
        // ตามด้วยสินค้าปกติ
        mergedList.push(chunk[j]);
      }
    }

    return mergedList;
  }, [regularProducts, ads, displayRatio]);

  return { 
    productsWithAds,  // รายการที่ผสมโฆษณาแบบสุ่มตำแหน่งแล้ว นำไปวนลูปได้เลย
    loadingAds,       // สถานะการโหลดข้อมูลโฆษณา
    refreshAds: fetchAdsAndSettings 
  };
};

export default useAdInjection;