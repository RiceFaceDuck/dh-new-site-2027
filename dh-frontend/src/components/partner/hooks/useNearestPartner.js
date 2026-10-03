import { useState, useEffect, useRef } from 'react';
import { findNearestPartner, getFallbackPartner } from '../../../firebase/partnerLocationService';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 Memory Cache for Nearest Partner & Ad Details (5-minute TTL to reduce Firestore reads)
let cachedNearestPartner = null;
let cachedNearestTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const useNearestPartner = () => {
  const { getUserCurrentLocation } = useGeolocation();
  const getUserLocationRef = useRef(getUserCurrentLocation);
  useEffect(() => {
    getUserLocationRef.current = getUserCurrentLocation;
  });

  const [partner, setPartner] = useState(() => {
    if (cachedNearestPartner && (Date.now() - cachedNearestTimestamp < CACHE_TTL_MS)) {
      return cachedNearestPartner;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !partner);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedNearestPartner && (Date.now() - cachedNearestTimestamp < CACHE_TTL_MS)) {
      setPartner(cachedNearestPartner);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPartner = async () => {
      try {
        setLoading(true);
        let nearest = null;
        
        try {
          const location = await getUserLocationRef.current();
          nearest = await findNearestPartner(location.latitude, location.longitude, 30);
        } catch {
          console.warn("📍 [Location] Permission denied or unavailable. Using fallback partner...");
          nearest = await getFallbackPartner();
        }

        if (!nearest) {
          console.warn("📍 [Location] No partner within 30km. Using fallback partner...");
          nearest = await getFallbackPartner();
        }
        
        if (nearest) {
          // Fetch ad details (cached alongside partner)
          try {
            const adId = `AD-CARD-${nearest.partnerId || nearest.id}`;
            const adRef = doc(db, getCollectionPath('partner_ads'), adId);
            const adSnap = await getDoc(adRef);
            
            if (adSnap.exists()) {
              const adData = adSnap.data();
              if (adData.imageUrl) nearest.fallbackAdImage = adData.imageUrl;
              if (!nearest.lineUrl && adData.lineUrl) nearest.lineUrl = adData.lineUrl;
              if (!nearest.messengerUrl && adData.messengerUrl) nearest.messengerUrl = adData.messengerUrl;
            }
          } catch (imgError) {
            console.error("Failed to fetch fallback ad image:", imgError);
          }

          cachedNearestPartner = nearest;
          cachedNearestTimestamp = Date.now();

          if (isMounted) {
            setPartner(nearest);
            setError(null);
          }
        } else {
          if (isMounted) setError("No partners available");
        }
      } catch (err) {
        console.error("Partner Box - System Error:", err);
        if (isMounted) setError("Error loading partner");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPartner();

    return () => {
      isMounted = false;
    };
  }, []);

  return { partner, loading, error };
};
