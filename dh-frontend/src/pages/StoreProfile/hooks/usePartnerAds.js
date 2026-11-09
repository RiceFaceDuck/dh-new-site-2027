import { useState, useEffect } from 'react';
import { getUserPartnerAds } from '../../../firebase/marketingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * Controller hook for fetching and filtering partner ads for Store Profile.
 * Clean Architecture & SRP: handles Firestore data queries, guest permission safety, and ad filtering.
 * Quota Optimization: Bypasses redundant ActivePartners getDoc read when partnerData prop is provided.
 * 
 * @param {string} partnerId
 * @param {Object|null} [partnerData=null] Pre-fetched partner data to bypass redundant Firestore read
 * @returns {{ ads: Array, loading: boolean }}
 */
export const usePartnerAds = (partnerId, partnerData = null) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPartnerAds = async () => {
      try {
        setLoading(true);

        // 🛡️ ตรวจสอบสถานะการเปิดใช้งานและเครดิตจาก ActivePartners (Public Collection - ปลอดภัยสำหรับ Guest)
        // ⚡ Quota Safeguard: หากมี partnerData ส่งเข้ามาแล้ว ให้ข้าม getDoc เพื่อประหยัด 1 Read ทันที
        let resolvedPartnerData = partnerData;

        if (!resolvedPartnerData) {
          try {
            const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
            const activePartnerSnap = await getDoc(activePartnerRef);

            if (activePartnerSnap.exists()) {
              resolvedPartnerData = activePartnerSnap.data();
            }
          } catch (activePartnerErr) {
            console.debug('[usePartnerAds] ActivePartners status check deferred:', activePartnerErr?.message);
          }
        }

        if (resolvedPartnerData) {
          if (resolvedPartnerData.isActive === false || (typeof resolvedPartnerData.points === 'number' && resolvedPartnerData.points <= 0)) {
            if (isMounted) setAds([]);
            return;
          }
        }

        // ดึงโฆษณาทั้งหมดของพาร์ทเนอร์รายนี้
        const allAds = await getUserPartnerAds(partnerId);

        const activeAds = (allAds || []).filter((adData) => {
          // Check for active status
          const isActive = (['active', 'ACTIVE', 'APPROVED'].includes(adData.status) || adData.isActive === true) &&
            adData.status !== 'OUT_OF_CREDIT' &&
            adData.status !== 'paused';
          // Exclude business cards
          const isNotBusinessCard = adData.type !== 'BUSINESS_CARD';

          return isActive && isNotBusinessCard;
        });

        if (isMounted) {
          setAds(activeAds);
        }
      } catch (error) {
        console.error('Error fetching partner ads:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPartnerAds();

    return () => {
      isMounted = false;
    };
  }, [partnerId, partnerData?.isActive, partnerData?.points]);

  return { ads, loading };
};

export default usePartnerAds;
