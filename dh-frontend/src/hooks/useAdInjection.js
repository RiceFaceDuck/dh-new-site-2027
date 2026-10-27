import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { marketingService } from '../firebase/marketingService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { fetchAllActivePartners } from '../firebase/partnerLocationService';
import { calculateDistance } from '../utils/geoUtils';

/**
 * 🎯 Custom Hook: Smart Ad Injection Engine (ระบบสมองกลแทรกโฆษณา)
 * อัปเกรด: 
 * 1. ตารางสินค้าแสดงร้านช่างอันดับ 4 และอันดับ 5 ต่อเนื่องจาก 3 ป้ายบน (Squad Highlight)
 * 2. ตัด 3 ร้านแรกทิ้งเสมอ ป้องกันการแสดงซ้ำ (Zero Duplication Guard)
 * 3. เรียงตามระยะทาง GPS 100% พร้อม Fallback เป็นคะแนนความนิยมเมื่อไม่มีพิกัด
 * 4. รองรับการอัปเดตแบบเรียลไทม์ทันทีที่เบราว์เซอร์อ่านค่า GPS สำเร็จ
 * 
 * @param {Array} regularProducts - Array ของรายการสินค้าปกติที่ต้องการนำมาแทรกโฆษณา
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

  // 1. ฟังก์ชันดึงโฆษณาและการตั้งค่าจาก Firebase พร้อมคำนวณระยะทาง
  const fetchAdsAndSettings = useCallback(async () => {
    try {
      setLoadingAds(true);
      
      // 📥 1. ดึงการตั้งค่า Ratio จากระบบหลังบ้าน (Marketing Settings)
      const settingsSnap = await getDoc(doc(db, getCollectionPath('settings'), 'marketing'));
      if (settingsSnap.exists() && settingsSnap.data().displayRatio) {
        const ratio = Number(settingsSnap.data().displayRatio);
        if (ratio > 0) setDisplayRatio(ratio);
      }

      // 📥 2. ดึงข้อมูลโฆษณา 3 ประเภท + พาร์ทเนอร์ทั้งหมด (อาศัย LocalStorage Tier 1 = 0 Reads)
      const [businessCards, productLinks, billboards, activePartners] = await Promise.all([
        marketingService.getActivePartnerAds('BUSINESS_CARD'),
        marketingService.getActivePartnerAds('PRODUCT_LINK'),
        marketingService.getActivePartnerAds('BILLBOARD'),
        fetchAllActivePartners()
      ]);

      // 🎯 กรองเฉพาะแผ่นป้ายสัดส่วน 1:1 (Square) เพื่อให้เข้ากับ Grid สินค้า
      const squareBillboards = (billboards || []).filter(
        ad => ad.billboardRatio === '1:1' || !ad.billboardRatio
      );

      // 📍 ดึงพิกัดผู้ใช้งานจาก sessionStorage
      let userLat = null;
      let userLng = null;
      try {
        const locStr = sessionStorage.getItem('dh_user_location');
        if (locStr) {
          const parsed = JSON.parse(locStr);
          if (parsed && parsed.lat && parsed.lng) {
            userLat = Number(parsed.lat);
            userLng = Number(parsed.lng);
          }
        }
      } catch (_) {}

      // 🗺️ จับคู่ข้อมูลพิกัดและคำนวณระยะทางของการ์ดนามบัตรช่าง (BUSINESS_CARD)
      const partnersMap = new Map();
      (activePartners || []).forEach(p => {
        const id = p.id || p.partnerId || p.userId;
        if (id) partnersMap.set(id, p);
      });

      const enrichedBusinessCards = (businessCards || []).map(ad => {
        const partnerId = ad.ownerId || ad.partnerId || (ad.id?.startsWith('AD-CARD-') ? ad.id.replace('AD-CARD-', '') : ad.id);
        const matchedPartner = partnersMap.get(partnerId);

        const lat = Number(ad.latitude || matchedPartner?.latitude);
        const lng = Number(ad.longitude || matchedPartner?.longitude);
        const points = Number(ad.creditPoints ?? matchedPartner?.points ?? 0);

        let distanceKm = null;
        let formattedDistance = null;
        if (userLat && userLng && lat && lng) {
          distanceKm = calculateDistance(userLat, userLng, lat, lng);
          formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เมตร` : `${Math.floor(distanceKm)} กม.`;
        }

        return {
          ...ad,
          partnerId,
          latitude: lat || null,
          longitude: lng || null,
          points,
          distanceKm,
          formattedDistance
        };
      });

      // 🚀 จัดเรียงลำดับร้านช่าง:
      // - หากมีพิกัด GPS: เรียงตามระยะทางจากใกล้ไปไกล 100% (Nearest First)
      // - หากไม่มีพิกัด GPS (Fallback): เรียงตามคะแนนความนิยม
      if (userLat && userLng) {
        enrichedBusinessCards.sort((a, b) => {
          const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
          const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
          if (distA !== distB) return distA - distB;
          return (b.points || 0) - (a.points || 0);
        });
      } else {
        enrichedBusinessCards.sort((a, b) => (b.points || 0) - (a.points || 0));
      }

      // 🛡️ ข้าม 3 อันดับแรกออกเสมอ (เพราะแสดงใน Squad Highlight 3 ป้ายบนแล้ว ป้องกันร้านซ้ำ 100%)
      const rankedCardsFromRank4 = enrichedBusinessCards.slice(3);

      // 🎯 ดึงอันดับ 4 และอันดับ 5 มายืนเป็น 2 ช่องแรกของตารางสินค้า
      const rank4 = rankedCardsFromRank4[0];
      const rank5 = rankedCardsFromRank4[1];
      const remainingCards = rankedCardsFromRank4.slice(2);

      // โฆษณาที่เหลือ (สินค้าโปรโมท, ป้ายแบนเนอร์, ร้านอันดับ 6 เป็นต้นไป)
      const otherAds = shuffleArray([
        ...(productLinks || []),
        ...squareBillboards,
        ...remainingCards
      ]);

      const orderedAds = [];
      if (rank4) orderedAds.push(rank4);
      if (rank5) orderedAds.push(rank5);
      orderedAds.push(...otherAds);

      setAds(orderedAds.slice(0, adLimit));

    } catch (error) {
      console.error("🔥 [useAdInjection] Error fetching ads or settings:", error);
    } finally {
      setLoadingAds(false);
    }
  }, [adLimit]);

  // 2. ดึงข้อมูลอัตโนมัติ 1 ครั้ง และคอยรับฟังเหตุการณ์เมื่อพิกัด GPS พร้อมทำงาน
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchAdsAndSettings();
    }

    const handleLocationUpdate = () => {
      if (isMounted) {
        fetchAdsAndSettings();
      }
    };

    window.addEventListener('dh:location_updated', handleLocationUpdate);

    return () => { 
      isMounted = false; 
      window.removeEventListener('dh:location_updated', handleLocationUpdate);
    };
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
