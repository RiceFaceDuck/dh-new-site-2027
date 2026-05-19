/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { marketingService } from '../firebase/marketingService';

/**
 * 🎯 Custom Hook สำหรับแทรกโฆษณาสินค้าเข้ากับรายการสินค้าหลัก (Ad Injection Engine)
 * ทำงานตามกฎ 10:1 (แสดงโฆษณา 1 ตัวแรกสุดเสมอ และแทรกทุกๆ สินค้า 10 ชิ้น)
 * * @param {Array} regularProducts - Array ของรายการสินค้าปกติที่ต้องการนำมาแทรกโฆษณา
 * @param {Number} adLimit - จำนวนโฆษณาที่จะดึงมาหมุนเวียน (ค่าเริ่มต้น 20 ตัว)
 * @returns {Object} { productsWithAds, loadingAds, refreshAds }
 */
export const useAdInjection = (regularProducts, adLimit = 20) => {
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);

  // 1. ฟังก์ชันดึงโฆษณาจาก Firebase (ใช้ useCallback เพื่อไม่ให้ถูกสร้างใหม่ตลอดเวลา)
  const fetchAds = useCallback(async () => {
    try {
      setLoadingAds(true);
      // เรียกใช้ marketingService ที่มีระบบสับเปลี่ยนลำดับ (Shuffle) ในตัว
      const activeAds = await marketingService.fetchActiveAds(adLimit);
      setAds(activeAds);
    } catch (error) {
      console.error("🔥 [useAdInjection] Error fetching ads:", error);
    } finally {
      setLoadingAds(false);
    }
  }, [adLimit]);

  // 2. ดึงข้อมูลอัตโนมัติ 1 ครั้ง เมื่อเรียกใช้ Hook นี้ (ประหยัด Reads/Writes)
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchAds();
    }
    
    return () => { isMounted = false; };
  }, [fetchAds]);

  // 3. 🧠 สมองกลคำนวณการแทรกโฆษณา (ใช้ useMemo เพื่อไม่ให้คำนวณใหม่หากข้อมูลไม่ได้เปลี่ยน)
  const productsWithAds = useMemo(() => {
    // ป้องกัน Error หากข้อมูลว่างเปล่า
    if (!regularProducts || !Array.isArray(regularProducts)) return [];
    
    // ถ้าไม่มีโฆษณา หรือสินค้าน้อยกว่า 0 ให้แสดงสินค้าปกติล้วนๆ ไปเลย
    if (regularProducts.length === 0) return [];
    if (!ads || ads.length === 0) return regularProducts;

    const mergedList = [];
    let adIndex = 0;

    // 🟢 กฎเหล็ก: แทรกโฆษณาตัวแรกสุดที่ Index 0 ทันที
    // แนบแฟล็ก isSponsoredAd เข้าไป เพื่อให้ Component รู้ว่าเป็นโฆษณา
    mergedList.push({ 
      ...ads[adIndex % ads.length], 
      isSponsoredAd: true 
    });
    adIndex++;

    // 🟢 วนลูปสินค้าปกติ (The 10:1 Rule Array Merge)
    for (let i = 0; i < regularProducts.length; i++) {
      // ใส่สินค้าปกติ
      mergedList.push(regularProducts[i]);

      // ตรวจสอบ: เมื่อใส่สินค้าปกติครบทุกๆ 10 ชิ้น ให้แทรกโฆษณา 1 ชิ้น
      if ((i + 1) % 10 === 0) {
        // ใช้ Modulo (%) ช่วยวนลูปโฆษณากลับมาใช้ใหม่ได้เรื่อยๆ หากสินค้ามีจำนวนมาก
        mergedList.push({ 
          ...ads[adIndex % ads.length], 
          isSponsoredAd: true 
        });
        adIndex++;
      }
    }

    return mergedList;
  }, [regularProducts, ads]);

  // คืนค่าออกไปให้ UI นำไปใช้
  return { 
    productsWithAds,  // รายการที่ผสมโฆษณาแล้ว นำไป .map() ได้เลย
    loadingAds,       // สถานะการโหลด (เผื่อเอาไปทำ Skeleton Loading)
    refreshAds: fetchAds // ฟังก์ชันดึงโฆษณาใหม่ (เผื่อทำปุ่ม Refresh)
  };
};

export default useAdInjection;