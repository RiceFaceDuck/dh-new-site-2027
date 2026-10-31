import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * Controller hook for StoreProfilePage.
 * Clean Architecture & SRP: handles authentication state, profile data fetching (ActivePartners + user store fallback),
 * and loading states.
 * 
 * @param {string} id - Partner / Store ID from route params
 * @returns {{ partner: Object|null, loading: boolean, currentUser: Object|null }}
 */
export const useStoreProfilePage = (id) => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPartnerProfile = async () => {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);

        // 1. Try getting from ActivePartners collection
        const partnerRef = doc(db, getCollectionPath('ActivePartners'), id);
        const partnerSnap = await getDoc(partnerRef);

        if (partnerSnap.exists()) {
          if (isMounted) {
            setPartner({ id: partnerSnap.id, ...partnerSnap.data() });
          }
        } else {
          // 2. Fallback: ดึงข้อมูลจาก users/{id}/storeProfile/main เผื่อเจ้าของร้านเปิดดูโปรไฟล์ร้านตัวเอง
          try {
            const userStoreRef = doc(db, getCollectionPath('users'), id, 'storeProfile', 'main');
            const userStoreSnap = await getDoc(userStoreRef);

            if (userStoreSnap.exists()) {
              const uStore = userStoreSnap.data();
              let points = 0;
              let displayName = '';
              try {
                const userSnap = await getDoc(doc(db, getCollectionPath('users'), id));
                if (userSnap.exists()) {
                  const uData = userSnap.data();
                  points = Number(uData.creditPoints || uData.points || 0);
                  displayName = uData.displayName || '';
                }
              } catch (ue) {
                console.warn("Could not fetch user points for fallback:", ue);
              }

              if (isMounted) {
                setPartner({
                  id: id,
                  partnerId: id,
                  storeName: uStore.storeName || displayName || 'ร้านค้าสมาชิก',
                  services: uStore.services || uStore.description || '',
                  phone: uStore.phone || '',
                  messengerUrl: uStore.messengerUrl || '',
                  lineUrl: uStore.lineUrl || '',
                  googleMapLink: uStore.googleMapLink || '',
                  latitude: Number(uStore.latitude || 0),
                  longitude: Number(uStore.longitude || 0),
                  storeImage: uStore.storeImage || '/logo.png',
                  address: uStore.address || '',
                  landmarks: uStore.landmarks || '',
                  richDescription: uStore.richDescription || '',
                  galleryImages: Array.isArray(uStore.galleryImages) ? uStore.galleryImages : [],
                  openHours: uStore.openHours || '',
                  websiteUrl: uStore.websiteUrl || '',
                  youtubeUrl: uStore.youtubeUrl || '',
                  tiktokUrl: uStore.tiktokUrl || '',
                  shopeeUrl: uStore.shopeeUrl || '',
                  lazadaUrl: uStore.lazadaUrl || '',
                  points: points,
                  isActive: false
                });
              }
            } else {
              console.warn("Partner not found in ActivePartners or users storeProfile");
            }
          } catch (fallbackErr) {
            console.warn("Partner fallback error:", fallbackErr);
          }
        }
      } catch (error) {
        console.error("Error fetching partner profile:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPartnerProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { partner, loading, currentUser };
};

export default useStoreProfilePage;
