import { useEffect, useRef, useState } from 'react';
import { trackAdView } from '../firebase/marketingAnalyticsService';

/**
 * 👁️ useAdViewTracker - Hook กลางสำหรับตรวจจับการมองเห็นป้ายโฆษณาตามมาตรฐานสากล (IAB / MRC)
 * 
 * คุณสมบัติ:
 * 1. ตรวจจับสายตาจริงด้วย IntersectionObserver (default threshold: 0.5)
 * 2. Dwell Time Guard: ต้องแช่สายตาอยู่ใน Viewport ต่อเนื่อง (default: 1,000 ms) ป้องกันการไถจอเร็ว
 * 3. Anti-Fraud & Deduplication: มีคูลดาวน์ 5 นาทีต่อป้าย (SessionStorage + Memory Fallback)
 * 4. Dual Telemetry: ส่งข้อมูลไปยังทั้ง GA4 ('ad_impression') และ Cloud Function ('recordAdTelemetry')
 * 
 * @param {Object} options
 * @param {string} options.adId - รหัสของป้ายโฆษณา
 * @param {string} [options.adCollection='partner_ads'] - คอลเลกชันใน Firestore ('partner_ads' | 'user_sku_ads')
 * @param {string} [options.adType='BUSINESS_CARD'] - ประเภทป้าย ('BUSINESS_CARD' | 'BILLBOARD' | 'PRODUCT_LINK')
 * @param {string} [options.ownerId='unknown'] - รหัสเจ้าของโฆษณา (partner userId)
 * @param {string} [options.placement='unknown'] - ตำแหน่งที่แสดงผล (Touchpoint)
 * @param {number} [options.threshold=0.5] - สัดส่วนการมองเห็นขั้นต่ำ (0.0 - 1.0)
 * @param {number} [options.dwellTimeMs=1000] - ระยะเวลาที่ต้องแช่สายตาขั้นต่ำ (มิลลิวินาที)
 * @param {boolean} [options.enabled=true] - เปิด/ปิดการตรวจจับ
 * @param {Object} [options.metadata={}] - ข้อมูลเพิ่มเติมที่ต้องการแนบไปกับ Telemetry
 * @param {React.RefObject} [externalRef] - Ref จากภายนอก (ถ้ามี)
 * @returns {{ ref: React.RefObject, hasTrackedView: boolean }}
 */
export const useAdViewTracker = (
  {
    adId,
    adCollection = 'partner_ads',
    adType = 'BUSINESS_CARD',
    ownerId = 'unknown',
    placement = 'unknown',
    threshold = 0.5,
    dwellTimeMs = 1000,
    enabled = true,
    metadata = {}
  } = {},
  externalRef = null
) => {
  const internalRef = useRef(null);
  const elementRef = externalRef || internalRef;
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const dwellTimerRef = useRef(null);

  useEffect(() => {
    // 🛡️ ป้องกันกรณีไม่มี ID หรือเป็น Preview โหมด หรือตรวจจับไปแล้ว หรือถูกปิดการทำงาน
    if (!enabled || !adId || adId === 'preview-mode' || hasTrackedView) {
      return;
    }

    const currentElement = elementRef.current;
    if (!currentElement || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const clearDwellTimer = () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // เมื่อการ์ดเข้ามาอยู่ในสายตาตามเกณฑ์ threshold
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          if (!dwellTimerRef.current) {
            dwellTimerRef.current = setTimeout(() => {
              // ครบกำหนดเวลา Dwell Time (1,000ms) โดยไม่หลุดออกจากสายตา
              trackAdView(adCollection, adId, {
                ...metadata,
                type: adType,
                ownerId: ownerId || 'unknown',
                placement
              });
              setHasTrackedView(true);
              clearDwellTimer();
              observer.disconnect();
            }, dwellTimeMs);
          }
        } else {
          // เลื่อนหลุดออกจากสายตาก่อนครบกำหนด Dwell Time ให้ยกเลิก Timer ทันที
          clearDwellTimer();
        }
      },
      {
        threshold: [threshold],
        rootMargin: '0px'
      }
    );

    observer.observe(currentElement);

    return () => {
      clearDwellTimer();
      observer.disconnect();
    };
  }, [
    adId,
    adCollection,
    adType,
    ownerId,
    placement,
    threshold,
    dwellTimeMs,
    enabled,
    hasTrackedView
  ]);

  return {
    ref: elementRef,
    hasTrackedView
  };
};

export default useAdViewTracker;
