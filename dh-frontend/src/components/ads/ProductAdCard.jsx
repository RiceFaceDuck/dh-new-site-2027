import React, { useEffect, useState, useCallback } from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketingService } from '../../firebase/marketingService';
import LazyImage from '../common/LazyImage';
import { getRenderableImageUrl } from '../../utils/imageUtils';
import { fetchAllActivePartners } from '../../firebase/partnerLocationService';
import { calculateDistance } from '../../utils/geoUtils';
import useAdViewTracker from '../../hooks/useAdViewTracker';
import ProductAdModal from './ProductAdModal';

const formatDistanceValue = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'number') return raw < 1 ? `${Math.round(raw * 1000)} เมตร` : `${Math.floor(raw)} กม.`;
  return String(raw).replace(/(\d+)\.\d+\s*กม\./, (_, intPart) => `${intPart} กม.`);
};

const getSubtitle = (ad, isProduct) => {
  const rawDisplayName = ad.partnerName || ad.customerName || 'DH Partner';
  const isTitleSame = ad.title?.trim().toLowerCase() === rawDisplayName.trim().toLowerCase();
  const shopBio = ad.description || ad.services || ad.role || (isProduct ? 'สินค้าแนะนำ' : 'Official Partner');
  return isTitleSame ? shopBio : (ad.description ? `${rawDisplayName} - ${ad.description}` : rawDisplayName);
};

const ProductAdCard = ({ ad, placement = 'product_grid_card' }) => {
  const navigate = useNavigate();
  const collectionName = ad?._collection || (ad?.type === 'PRODUCT_LINK' ? 'user_sku_ads' : 'partner_ads');
  const adType = ad?.type || 'BUSINESS_CARD';
  const ownerId = ad?.userId || ad?.ownerId || 'unknown';

  const { ref: cardRef } = useAdViewTracker({
    adId: ad?.id,
    adCollection: collectionName,
    adType,
    ownerId,
    placement,
    threshold: 0.5,
    dwellTimeMs: 1000,
    enabled: Boolean(ad?.id && ad.id !== 'preview-mode'),
    metadata: ad
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distanceText, setDistanceText] = useState(() => formatDistanceValue(ad?.formattedDistance));

  useEffect(() => {
    if (ad?.formattedDistance) return setDistanceText(formatDistanceValue(ad.formattedDistance));
    if (ad?.type === 'PRODUCT_LINK') return;

    let isMounted = true;
    const resolveDistance = async () => {
      try {
        const locStr = sessionStorage.getItem('dh_user_location');
        if (!locStr) return;
        const { lat, lng } = JSON.parse(locStr);
        if (!lat || !lng) return;
        const partners = await fetchAllActivePartners();
        const partnerId = ad?.ownerId || ad?.partnerId || (ad?.id?.startsWith('AD-CARD-') ? ad.id.replace('AD-CARD-', '') : ad?.id);
        const matched = partners.find(p => (p.id || p.partnerId || p.userId) === partnerId);
        if (matched?.latitude && matched?.longitude && isMounted) {
          const distKm = calculateDistance(lat, lng, matched.latitude, matched.longitude);
          setDistanceText(distKm < 1 ? `${Math.round(distKm * 1000)} เมตร` : `${Math.floor(distKm)} กม.`);
        }
      } catch (e) { console.warn("Distance calc error", e); }
    };
    resolveDistance();
    return () => { isMounted = false; };
  }, [ad]);

  const openLink = useCallback((url) => {
    if (!url) return;
    const finalUrl = !url.startsWith('http') && !url.startsWith('tel:') ? 'https://' + url : url;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleAdClick = (e) => {
    e.stopPropagation();
    if (ad?.id && ad.id !== 'preview-mode') {
      const col = ad._collection || (ad.type === 'PRODUCT_LINK' ? 'user_sku_ads' : 'partner_ads');
      marketingService.trackAdClick(col, ad.id, ad);
    }
    if (ad?.id === 'preview-mode') return setIsModalOpen(true);
    if (ad?.type === 'BUSINESS_CARD') navigate(`/store/${ad.ownerId || ad.partnerId || 'unknown'}`);
    else if (ad?.targetUrl) openLink(ad.targetUrl);
    else setIsModalOpen(true);
  };

  const closeModal = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  }, []);

  if (!ad) return null;
  const rawImage = ad.imageUrl || ad.imageurl || ad.image || (ad.images && ad.images[0]) || ad.img || ad.picture || ad.photo || ad.storeImage || ad.avatar || ad.photoURL || ad.profileImage || (ad.storeProfile && ad.storeProfile.logoUrl) || '/logo.png';
  const safeImageUrl = getRenderableImageUrl(rawImage);
  const isProduct = ad.type === 'PRODUCT_LINK';
  const subtitle = getSubtitle(ad, isProduct);

  return (
    <>
      <div ref={cardRef} className="group relative flex flex-col h-full cursor-pointer bg-slate-100 p-2 md:p-3 rounded-[2px] border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-premium-hover transition-all duration-300 animate-in fade-in">
        {ad.isSponsoredAd && (
          isProduct ? (
            <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-slate-800/90 backdrop-blur-xs px-2 py-1 rounded-[2px] border border-slate-700/50 shadow-xs z-30 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">SPONSORED</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 max-w-[85%] z-30 pointer-events-none group-hover:scale-105 transition-transform duration-200">
              <div className="p-[1.5px] rounded-[2px] bg-linear-to-r from-violet-500 via-pink-500 via-amber-400 via-emerald-400 to-cyan-500 shadow-xs">
                <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-[2px]">
                  <span className="text-[10px] md:text-[11px] font-black text-indigo-950 tracking-tight truncate">
                    {distanceText ? `เดินทาง ${distanceText}` : 'ไม่ทราบระยะทาง'}
                  </span>
                </div>
              </div>
            </div>
          )
        )}
        <div className="relative aspect-square w-full bg-white rounded-[2px] flex items-center justify-center overflow-hidden mb-2 cursor-pointer" onClick={handleAdClick}>
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-50 pointer-events-none"></div>
          <LazyImage src={safeImageUrl} alt={ad.title || 'Advertisement'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10" />
        </div>
        <div className="flex flex-col grow px-1 cursor-pointer" onClick={handleAdClick}>
          <h3 className="text-sm md:text-base font-bold text-slate-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 break-words" title={ad.title}>
            {ad.title}
          </h3>
          <div className="text-[11px] md:text-xs text-slate-600 leading-snug line-clamp-3 mb-2 flex items-start gap-1">
            {isProduct ? <ShoppingBag size={12} className="shrink-0 mt-0.5 text-slate-400"/> : <Store size={12} className="shrink-0 mt-0.5 text-slate-400"/>}
            <span className="break-words">{subtitle}</span>
          </div>
          <div className="mt-auto flex flex-col pt-1">
            {isProduct && ad.price && (
              <div className="text-base md:text-lg font-bold text-slate-800 leading-none mb-2.5 h-5 flex items-center">
                ฿{Number(ad.price).toLocaleString()}
              </div>
            )}
            <button type="button" className={`w-full py-2 rounded-md flex items-center justify-center transition-all duration-300 shadow-md z-20 text-xs md:text-sm font-bold active:scale-95 ${isProduct ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white uppercase tracking-wider' : 'bg-slate-800 text-white hover:bg-indigo-600 hover:shadow-indigo-500/30'}`}>
              {isProduct ? 'เข้าชมสินค้า' : 'ติดต่อทันที'}
            </button>
          </div>
        </div>
      </div>
      <ProductAdModal isOpen={isModalOpen} onClose={closeModal} ad={ad} safeImageUrl={safeImageUrl} isProduct={isProduct} openLink={openLink} />
    </>
  );
};

export default React.memo(ProductAdCard);