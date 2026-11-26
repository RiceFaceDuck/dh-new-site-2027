import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllActivePartners } from '../../../firebase/partnerLocationService';
import { calculateDistance } from '../../../utils/geoUtils';

const ITEMS_PER_PAGE = 15;

export const PROVIDER_SERVICE_FILTERS = [
  { id: 'all', label: 'ทั้งหมด', keywords: [] },
  { id: 'board', label: 'ซ่อมบอร์ด', keywords: ['บอร์ด', 'เมนบอร์ด', 'ช็อต', 'เปิดไม่ติด', 'ic', 'ชิป'] },
  { id: 'screen', label: 'เปลี่ยนจอ', keywords: ['จอ', 'หน้าจอ', 'lcd', 'display', 'บานพับ'] },
  { id: 'macbook', label: 'MacBook', keywords: ['macbook', 'apple', 'imac', 'ipad', 'mac'] },
  { id: 'printer', label: 'ปริ้นเตอร์', keywords: ['ปริ้นเตอร์', 'printer', 'หมึก', 'เครื่องพิมพ์'] },
  { id: 'upgrade', label: 'อัปเกรด/ลงโปรแกรม', keywords: ['อัปเกรด', 'ssd', 'ram', 'ลงวินโดวส์', 'windows', 'ทำความสะอาด'] },
  { id: 'mobile', label: 'ซ่อมมือถือ', keywords: ['มือถือ', 'โทรศัพท์', 'iphone', 'สมาร์ทโฟน'] }
];

const matchesServiceFilter = (partner, filterId) => {
  if (!filterId || filterId === 'all') return true;
  const filterObj = PROVIDER_SERVICE_FILTERS.find((f) => f.id === filterId);
  if (!filterObj || filterObj.keywords.length === 0) return true;
  const haystack = `${partner?.storeName || ''} ${partner?.services || ''} ${partner?.description || ''}`.toLowerCase();
  return filterObj.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
};

export const useProvidersList = () => {
  const [allPartners, setAllPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Filtering and Sorting (100% Client-side, 0 Extra Firestore Reads)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Pagination State (เริ่มต้น 15 ร้านต่อหน้า)
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Load Data (from 15-min cache or ActivePartners bundle)
  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllActivePartners();
      setAllPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Request Location
  const requestLocation = useCallback((showExplanation = false) => {
    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
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
        try {
          sessionStorage.setItem('dh_user_location', JSON.stringify({ lat: latitude, lng: longitude }));
        } catch (_) {}
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn('Location permission status/error:', error);
        if (error?.code === 1) {
          // ไม่แสดงข้อความผิดพลาดเรื่องไม่ได้รับอนุญาตตามกฎ Calm UI
          setLocationError(null);
        } else if (showExplanation) {
          setLocationError('ไม่พบสัญญาณพิกัด (จัดเรียงตามคะแนนแนะนำ)');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // 2.5 Pre-compute Service Chip Counts (Client-side, 0 Extra Firestore Reads)
  const serviceCounts = useMemo(() => {
    const counts = {};
    PROVIDER_SERVICE_FILTERS.forEach((f) => {
      counts[f.id] = allPartners.filter((p) => matchesServiceFilter(p, f.id)).length;
    });
    return counts;
  }, [allPartners]);

  // 3. Process Data (Filter & Sort)
  const processedPartners = useMemo(() => {
    let result = [...allPartners];

    // Filter by Quick Service Chip
    if (selectedService && selectedService !== 'all') {
      result = result.filter((p) => matchesServiceFilter(p, selectedService));
    }

    // Filter by search term
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      result = result.filter((p) => {
        const nameMatch = p.storeName?.toLowerCase().includes(trimmedSearch);
        const servicesMatch = p.services?.toLowerCase().includes(trimmedSearch);
        const descMatch = p.description?.toLowerCase().includes(trimmedSearch);
        return nameMatch || servicesMatch || descMatch;
      });
    }

    // Calculate distance if location available
    if (userLocation) {
      result = result.map((p) => {
        let distanceKm = null;
        let formattedDistance = null;
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          distanceKm = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
          formattedDistance =
            distanceKm < 1 ? `${Math.round(distanceKm * 1000)} เมตร` : `${Math.floor(distanceKm)} กม.`;
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
        let countNearby = 0;
        while (distIndex < sortedByDistance.length && countNearby < 9) {
          const item = sortedByDistance[distIndex++];
          if (!usedIds.has(item.id)) {
            usedIds.add(item.id);
            blended.push(item);
            countNearby++;
          }
        }

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
  }, [allPartners, searchTerm, selectedService, userLocation]);

  // 4. Page-based Pagination (15 ร้านต่อหน้า)
  const totalCount = processedPartners.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCount);
  const visiblePartners = processedPartners.slice(startIndex, endIndex);

  const goToPage = useCallback(
    (page) => {
      setCurrentPage((prev) => {
        const target = typeof page === 'function' ? page(prev) : page;
        return Math.max(1, Math.min(target, totalPages));
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage((prev) => Math.min(prev + 1, totalPages));
  }, [goToPage, totalPages]);

  const prevPage = useCallback(() => {
    goToPage((prev) => Math.max(prev - 1, 1));
  }, [goToPage]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedService('all');
    setCurrentPage(1);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedService]);

  // Initial load
  useEffect(() => {
    loadPartners();
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
    selectedService,
    setSelectedService,
    serviceCounts,
    resetFilters,
    userLocation,
    locationError,
    requestLocation,
    totalCount,
    allPartnersCount: allPartners.length
  };
};
