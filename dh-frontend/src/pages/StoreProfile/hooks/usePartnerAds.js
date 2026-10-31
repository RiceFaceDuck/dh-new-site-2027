import { useState, useEffect } from 'react';
import { getUserPartnerAds } from '../../../firebase/marketingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * Controller hook for fetching and filtering partner ads for Store Profile.
 * Clean Architecture & SRP: handles Firestore data queries, guest permission safety, and ad filtering.
 * 
 * @param {string} partnerId
 * @returns {{ ads: Array, loading: boolean }}
 */
export const usePartnerAds = (partnerId) => {
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
        try {
          const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
          const activePartnerSnap = await getDoc(activePartnerRef);

          if (activePartnerSnap.exists()) {
            const partnerData = activePartnerSnap.data();
            if (partnerData.isActive === false || (typeof partnerData.points === 'number' && partnerData.points <= 0)) {
              if (isMounted) setAds([]);
              return;
            }
          }
        } catch (activePartnerErr) {
          console.debug('[usePartnerAds] ActivePartners status check deferred:', activePartnerErr?.message);
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
  }, [partnerId]);

  return { ads, loading };
};

export default usePartnerAds;
