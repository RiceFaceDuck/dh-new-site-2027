import { useState, useEffect, useCallback } from 'react';
import { fetchAllActivePartners } from '../../../firebase/partnerLocationService';

import { calculateDistance } from '../../../utils/geoUtils';
import { squadConfigService } from '../../../firebase/squadConfigService';
import { logImpression } from '../../../firebase/marketingAnalyticsService';

export const useNearbyPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [config, setConfig] = useState({ isActive: true, displayLimit: 3 });

  const fetchPartnersAndCalculate = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      
      // 1. Fetch Config
      const currentConfig = await squadConfigService.getConfig();
      setConfig(currentConfig);
      
      if (!currentConfig.isActive) {
        setPartners([]);
        return;
      }

      // 2. Fetch Active Partners
      const activePartners = await fetchAllActivePartners();
      let partnersWithDistance = activePartners.map(partner => {
        let distanceKm = null;
        let formattedDistance = null;
        if (lat && lng && partner.latitude && partner.longitude) {
          distanceKm = calculateDistance(lat, lng, partner.latitude, partner.longitude);
          formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เมตร` : `${distanceKm.toFixed(1)} กม.`;
        }
        return { ...partner, distanceKm, formattedDistance };
      });

      // 3. Sort by distance or points
      if (lat && lng) {
        partnersWithDistance.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
      } else {
        partnersWithDistance.sort((a, b) => (b.points || 0) - (a.points || 0)); // Fallback sort by points
      }

      // 4. Limit based on config
      const limitedPartners = partnersWithDistance.slice(0, currentConfig.displayLimit);
      setPartners(limitedPartners);

      // 5. Track Impressions (Fire and forget to not block UI)
      if (limitedPartners.length > 0) {
        limitedPartners.forEach(p => {
          logImpression('AD-CARD-' + (p.id || p.userId));
        });
      }
    } catch (error) {
      console.error("Error fetching nearby partners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback((showExplanation = false) => {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      fetchPartnersAndCalculate(null, null);
      return;
    }

    const HAS_REQUESTED_LOCATION_KEY = 'dh_has_requested_location';
    const hasRequested = sessionStorage.getItem(HAS_REQUESTED_LOCATION_KEY);

    if (showExplanation && !hasRequested) {
      sessionStorage.setItem(HAS_REQUESTED_LOCATION_KEY, 'true');
      setPermissionRequested(true);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        fetchPartnersAndCalculate(latitude, longitude);
      },
      (error) => {
        console.warn("Location permission denied or error:", error);
        setLocationError("ไม่สามารถเข้าถึงพิกัดได้ (ระบบจะแสดงผลร้านแนะนำทั่วไป)");
        fetchPartnersAndCalculate(null, null); // Fetch without location
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [fetchPartnersAndCalculate, permissionRequested]);

  useEffect(() => {
    // Initial fetch, try asking on load
    requestLocation(true);
  }, [requestLocation]);

  return {
    partners,
    loading,
    userLocation,
    locationError,
    requestLocation, // expose this to call manually when clicking a button
    config // Expose config so component knows if it's active
  };
};
