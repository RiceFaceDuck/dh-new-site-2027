import { useState, useEffect, useCallback } from 'react';
import { fetchAllActivePartners } from '../../../firebase/partnerLocationService';

import { calculateDistance } from '../../../utils/geoUtils';
import { squadConfigService } from '../../../firebase/squadConfigService';

export const useNearbyPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
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
          formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เน€เธกเธ•เธฃ` : `${Math.floor(distanceKm)} เธเธก.`;
        }
        return { ...partner, distanceKm, formattedDistance };
      });

      // 3. Sort by distance 100% (Nearest first - เธซเธเนเธฒเนเธฃเธเนเธเนเธฃเนเธฒเธเนเธเธฅเนเน€เธเธตเธขเธ 100%)
      if (lat && lng) {
        partnersWithDistance.sort((a, b) => {
          const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
          const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
          if (distA !== distB) return distA - distB;
          return (b.points || 0) - (a.points || 0);
        });
      } else {
        // Fallback: เธเธฃเธ“เธตเธฅเธนเธเธเนเธฒเนเธกเนเนเธ”เนเธญเธเธธเธเธฒเธ• GPS เนเธซเนเน€เธฃเธตเธขเธเธ•เธฒเธกเธเธฐเนเธเธเธเธงเธฒเธกเธเธดเธขเธก
        partnersWithDistance.sort((a, b) => (b.points || 0) - (a.points || 0));
      }

      // 4. Limit based on config
      const limitedPartners = partnersWithDistance.slice(0, currentConfig.displayLimit);
      setPartners(limitedPartners);

      // 5. View tracking handled by useAdViewTracker on each card
    } catch (error) {
      console.error("Error fetching nearby partners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback((showExplanation = false) => {
    if (!navigator.geolocation) {
      setLocationError("เน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเนเธเธญเธเธเธธเธ“เนเธกเนเธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธฃเธฐเธเธธเธ•เธณเนเธซเธเนเธ");
      fetchPartnersAndCalculate(null, null);
      return;
    }

    const HAS_REQUESTED_LOCATION_KEY = 'dh_has_requested_location';
    const hasRequested = sessionStorage.getItem(HAS_REQUESTED_LOCATION_KEY);

    if (showExplanation && !hasRequested) {
      sessionStorage.setItem(HAS_REQUESTED_LOCATION_KEY, 'true');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        try { 
          sessionStorage.setItem('dh_user_location', JSON.stringify({ lat: latitude, lng: longitude })); 
          window.dispatchEvent(new CustomEvent('dh:location_updated', { detail: { lat: latitude, lng: longitude } }));
        } catch (_) {}
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        fetchPartnersAndCalculate(latitude, longitude);
      },
      (error) => {
        console.warn("Location permission denied or error:", error);
        setLocationError("เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเนเธฒเธ–เธถเธเธเธดเธเธฑเธ”เนเธ”เน (เธฃเธฐเธเธเธเธฐเนเธชเธ”เธเธเธฅเธฃเนเธฒเธเนเธเธฐเธเธณเธ—เธฑเนเธงเนเธ)");
        fetchPartnersAndCalculate(null, null); // Fetch without location
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [fetchPartnersAndCalculate]);

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
