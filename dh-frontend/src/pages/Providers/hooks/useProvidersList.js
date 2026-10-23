import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllActivePartners } from '../../../firebase/partnerLocationService';
import { calculateDistance } from '../../../utils/geoUtils';

const ITEMS_PER_PAGE = 15;

export const useProvidersList = () => {
  const [allPartners, setAllPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Filtering and Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // Pagination State (เริ่มต้น 15 ร้านต่อหน้า)
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Load Data
  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from cache or Firebase (economy first)
      const data = await fetchAllActivePartners();
      setAllPartners(data);
    } catch (error) {
      console.error("Error loading partners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Request Location
  const requestLocation = useCallback((showExplanation = false) => {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      return;
    }

    const HAS_REQUESTED_LOCATION_KEY = 'dh_has_requested_location';
    const hasRequested = sessionStorage.getItem(HAS_REQUESTED_LOCATION_KEY);

    if (showExplanation && !hasRequested) {
      sessionStorage.setItem(HAS_REQUESTED_LOCATION_KEY, 'true');
      
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        try { sessionStorage.setItem('dh_user_location', JSON.stringify({ lat: latitude, lng: longitude })); } catch (_) {}
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn("Location permission denied or error:", error);
        setLocationError("ไม่สามารถเข้าถึงพิกัดได้ (ระบบจะเรียงตามคะแนนแนะนำ)");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // 3. Process Data (Filter & Sort)
  const processedPartners = useMemo(() => {
    let result = [...allPartners];

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => {
        const nameMatch = p.storeName?.toLowerCase().includes(lowerTerm);
        const servicesMatch = p.services?.toLowerCase().includes(lowerTerm);
        return nameMatch || servicesMatch;
      });
    }

    // Calculate distance if location available
    if (userLocation) {
      result = result.map(p => {
        let distanceKm = null;
        let formattedDistance = null;
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          distanceKm = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
          formattedDistance = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เมตร` : `${distanceKm.toFixed(1)} กม.`;
        }
        return { ...p, distanceKm, formattedDistance };
      });
    }

    // Sort
    if (userLocation) {
      // 1. เรียงตามระยะทางจริง (Distance-First เป็นหลัก)
      const sortedByDistance = [...result].sort((a, b) => {
        const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
        const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
        if (distA !== distB) return distA - distB;
        return (b.points || 0) - (a.points || 0);
      });

      // 2. ค้นหาร้านยอดนิยมตามคะแนน (Popular Pool)
      const topPopular = [...result].sort((a, b) => (b.points || 0) - (a.points || 0));

      // 3. ผสมผสาน: ร้านใกล้เคียง 9 ร้าน + แทรกร้านยอดนิยม 1 ร้านในทุก 10 ร้าน
      const blended = [];
      const usedIds = new Set();
      let popularIndex = 0;
      let distIndex = 0;

      while (distIndex < sortedByDistance.length) {
        // เติมร้านใกล้เคียงเป็นหลัก
        let countNearby = 0;
        while (distIndex < sortedByDistance.length && countNearby < 9) {
          const item = sortedByDistance[distIndex++];
          if (!usedIds.has(item.id)) {
            usedIds.add(item.id);
            blended.push(item);
            countNearby++;
          }
        }

        // แทรกร้านยอดนิยม 1 ร้านในทุก 10 ร้าน (หากยังไม่เคยแสดง)
        while (popularIndex < topPopular.length) {
          const popItem = topPopular[popularIndex++];
          if (!usedIds.has(popItem.id)) {
            usedIds.add(popItem.id);
            blended.push({ ...popItem, isTopRecommendation: true });
            break;
          }
        }
      }

      result = blended;
    } else {
      // Sort by points (highest first) กรณีลูกค้าไม่ได้อนุญาต GPS
      result.sort((a, b) => (b.points || 0) - (a.points || 0));
    }

    return result;
  }, [allPartners, searchTerm, userLocation]);

  // 4. Page-based Pagination (15 ร้านต่อหน้า)
  const totalCount = processedPartners.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  
  // Safe bounded page number
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCount);
  const visiblePartners = processedPartners.slice(startIndex, endIndex);

  const goToPage = useCallback((page) => {
    setCurrentPage(prev => {
      const target = typeof page === 'function' ? page(prev) : page;
      return Math.max(1, Math.min(target, totalPages));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(prev => Math.min(prev + 1, totalPages));
  }, [goToPage, totalPages]);

  const prevPage = useCallback(() => {
    goToPage(prev => Math.max(prev - 1, 1));
  }, [goToPage]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    loadPartners();
    // Auto-request location silently if previously granted
    const hasRequested = sessionStorage.getItem('dh_has_requested_location');
    if (hasRequested) {
      requestLocation(false);
    }
  }, [loadPartners, requestLocation]);

  return {
    loading,
    visiblePartners,
    currentPage: activePage,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    searchTerm,
    setSearchTerm,
    userLocation,
    locationError,
    requestLocation,
    totalCount
  };
};
