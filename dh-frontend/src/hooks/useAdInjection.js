 
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { marketingService } from '../firebase/marketingService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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
      const settingsSnap = await getDoc(doc(db, getCollectionPath('settings'), 'marketing'));
      if (settingsSnap.exists() && settingsSnap.data().displayRatio) {
        const ratio = Number(settingsSnap.data().displayRatio);
        if (ratio > 0) setDisplayRatio(ratio);
      }

      // 📥 2. ดึงข้อมูลโฆษณา 3 ประเภท (นามบัตร, ลิงก์สินค้า, และแผ่นป้าย) พร้อมกัน
      const [businessCards, productLinks, billboards] = await Promise.all([
        marketingService.getActivePartnerAds('BUSINESS_CARD'),
        marketingService.getActivePartnerAds('PRODUCT_LINK'),
        marketingService.getActivePartnerAds('BILLBOARD')
      ]);

      // 🎯 กรองเฉพาะแผ่นป้ายสัดส่วน 1:1 (Square) เพื่อให้เข้ากับ Grid สินค้า
      const squareBillboards = (billboards || []).filter(
        ad => ad.billboardRatio === '1:1' || !ad.billboardRatio
      );

      // 🔀 3. รวมโฆษณาทุกประเภทเข้า Pool เดียวกัน และสับเปลี่ยนอย่างเป็นธรรม (Fair Shuffle)
      const combinedAds = shuffleArray([
        ...(businessCards || []),
        ...(productLinks || []),
        ...squareBillboards
      ]).slice(0, adLimit);

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

  // 3. 🧠 สมองกลคำนวณการแทรกโฆษณาแบบสุ่มตำแหน่ง (Fair Injection Engine with Deduplication)
  const productsWithAds = useMemo(() => {
    if (!regularProducts || !Array.isArray(regularProducts)) return [];
    if (regularProducts.length === 0) return [];
    
    // ถ้าไม่มีโฆษณาเลย ให้ส่งคืนสินค้าปกติเพียวๆ กลับไป เพื่อไม่ให้หน้าเว็บล่ม
    if (!ads || ads.length === 0) return regularProducts;

    const mergedList = [];
    let adIndex = 0;
    const usedAdIds = new Set(); // 🛡️ Deduplication Guard: ป้องกันโฆษณาซ้ำซ้อนในกริดเดียวกัน

    // 🔄 หั่นสินค้าปกติเป็นกลุ่มๆ (Chunks) ตามอัตราส่วน displayRatio (เช่น กลุ่มละ 10 ชิ้น)
    for (let i = 0; i < regularProducts.length; i += displayRatio) {
      const chunk = regularProducts.slice(i, i + displayRatio);
      
      // ดึงโฆษณาถัดไปที่ยังไม่เคยถูกแทรกในรายการนี้
      let nextAd = null;
      while (adIndex < ads.length) {
        const candidate = ads[adIndex];
        adIndex++;
        if (candidate && !usedAdIds.has(candidate.id)) {
          usedAdIds.add(candidate.id);
          nextAd = candidate;
          break;
        }
      }

      // 🎲 สุ่มตำแหน่งแทรกภายในกลุ่ม โดยล็อกตำแหน่ง Slot 0 ต้องเป็นสินค้าของร้านเสมอ
      let randomInsertPos = -1;
      if (nextAd) {
        if (i === 0) {
          // กลุ่มแรกสุด: ห้ามแทรกที่ Slot 0 เด็ดขาด สุ่มแทรกที่ตำแหน่ง 1 ถึง chunk.length
          randomInsertPos = chunk.length > 1 
            ? 1 + ((chunk.length * 17 + 7) % (chunk.length - 1))
            : 1;
        } else {
          randomInsertPos = (i * 997 + chunk.length * 31) % (chunk.length + 1);
        }
      }

      let adInserted = false;
      for (let j = 0; j < chunk.length; j++) {
        // เมื่อวนลูปถึงตำแหน่งที่สุ่มได้ ให้แทรกโฆษณา
        if (nextAd && !adInserted && j === randomInsertPos) {
          mergedList.push({ 
            ...nextAd,
            isSponsoredAd: true // ติด Tag ให้ Frontend รู้ว่าเป็นโฆษณา เพื่อเรียกใช้ UI เฉพาะ
          });
          adInserted = true;
        }
        
        // ตามด้วยยัดสินค้าปกติลงไป
        mergedList.push(chunk[j]);
      }

      // หากตำแหน่งสุ่มอยู่ท้ายสุดของ chunk และยังไม่ได้แทรก
      if (nextAd && !adInserted) {
        mergedList.push({
          ...nextAd,
          isSponsoredAd: true
        });
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