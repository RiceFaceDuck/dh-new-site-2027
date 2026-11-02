import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { DEFAULT_HERO_CONFIG } from '../../../firebase/storefrontSettingsService';
import { getRenderableImageUrl } from '../../../utils/imageUtils';
import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CACHE_KEY = 'dh_hero_config_cache';
const HERO_DOC = 'hero_config';

const HeroSection = () => {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = safeJsonParse(cached);
        return parsed?.data || parsed || DEFAULT_HERO_CONFIG;
      }
      return DEFAULT_HERO_CONFIG;
    } catch (e) {
      return DEFAULT_HERO_CONFIG;
    }
  });

  const [isLoading, setIsLoading] = useState(!localStorage.getItem(CACHE_KEY));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch coordinates
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const docRef = doc(db, getCollectionPath('settings'), HERO_DOC);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const newConfig = { ...DEFAULT_HERO_CONFIG, ...docSnap.data() };
        setConfig(newConfig);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: newConfig,
            timestamp: Date.now()
          }));
        } catch (e) {
          // ignore
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("🔥 Error listening to hero config:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isSystemActive = config?.isActive !== false;

  // Active banners list
  const banners = (() => {
    if (!isSystemActive) return [DEFAULT_HERO_CONFIG];
    if (Array.isArray(config?.banners) && config.banners.length > 0) {
      const activeOnly = config.banners.filter(b => b.isActive !== false);
      return activeOnly.length > 0 ? activeOnly : [config.banners[0]];
    }
    return [config || DEFAULT_HERO_CONFIG];
  })();

  const totalBanners = banners.length;

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Autoplay
  const autoplay = config?.autoplay !== false && totalBanners > 1;
  const autoplaySpeed = config?.autoplaySpeed || 5000;

  useEffect(() => {
    if (!autoplay || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [autoplay, isPaused, autoplaySpeed, handleNext]);

  // Touch Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Responsive balanced sizing
  const aspectClass = {
    '16:9': 'aspect-[16/9] max-h-[440px]',
    '3:1': 'aspect-[3/1] max-h-[380px]',
    '21:9': 'aspect-[21/9] max-h-[360px]',
    'auto': 'min-h-[280px] max-h-[440px]'
  }[config?.aspectRatio || '16:9'] || 'aspect-[16/9] max-h-[440px]';

  const transitionEffect = config?.transitionEffect || 'slide';

  return (
    <div
      className={`relative w-full rounded-[2px] overflow-hidden flex flex-col justify-center border border-slate-700 shadow-xl select-none min-h-[260px] ${aspectClass} ${
        isLoading ? 'opacity-70' : 'opacity-100'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          const overlayColor = banner.overlay?.color || '#1f2937';
          const overlayOpacity = (banner.overlay?.opacity ?? 90) / 100;
          const overlayDirection = banner.overlay?.direction || 'to-r';
          const isOverlayEnabled = banner.overlay?.enabled !== false;
          const isFullLayout = banner.imageLayout === 'full';
          const isCenter = banner.textAlignment === 'center';
          const isContain = banner.imageFit === 'contain';

          let gradientBackground = `linear-gradient(to right, ${overlayColor} 0%, ${overlayColor} 45%, transparent 100%)`;
          if (overlayDirection === 'to-t') {
            gradientBackground = `linear-gradient(to top, ${overlayColor} 0%, ${overlayColor} 60%, transparent 100%)`;
          } else if (overlayDirection === 'full') {
            gradientBackground = overlayColor;
          }

          const rawImageUrl = banner.imageUrl || '/user-bg.jpg';
          const imageUrl = getRenderableImageUrl(rawImageUrl) || '/user-bg.jpg';

          const slideStyle = transitionEffect === 'fade' 
            ? {} 
            : { transform: `translateX(${(index - currentIndex) * 100}%)` };

          const transitionClasses = transitionEffect === 'fade'
            ? `transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`
            : `transition-transform duration-500 ease-out z-10`;

          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 w-full h-full flex flex-col justify-center ${transitionClasses}`}
              style={{
                backgroundColor: overlayColor,
                ...slideStyle
              }}
            >
              {/* Background Graphic */}
              {isFullLayout ? (
                <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Hero Banner"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/user-bg.jpg'; }}
                    className={`w-full h-full ${
                      isContain ? 'object-contain object-center' : 'object-cover object-center'
                    }`}
                  />
                  {isOverlayEnabled && overlayOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-300"
                      style={{ background: gradientBackground, opacity: overlayOpacity }}
                    />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 z-0 flex justify-end bg-slate-950">
                  <div className="w-full md:w-[70%] h-full relative transition-all duration-300 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Hero Banner"
                      loading={index === 0 ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/user-bg.jpg'; }}
                      className={`w-full h-full ${
                        isContain ? 'object-contain object-center' : 'object-cover object-center'
                      }`}
                    />
                    {isOverlayEnabled && overlayOpacity > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-300"
                        style={{ background: gradientBackground, opacity: overlayOpacity }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Foreground Content */}
              <div
                className={`relative z-10 p-5 sm:p-7 md:p-10 w-full h-full flex flex-col justify-center ${
                  isCenter ? 'items-center text-center' : 'items-start text-left'
                } ${!isOverlayEnabled || overlayOpacity === 0 ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]' : ''}`}
              >
                {/* Badge */}
                {banner.badge?.isActive && banner.badge?.text && (
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs"
                      style={{
                        backgroundColor: `${banner.badge.color || '#facc15'}25`,
                        color: banner.badge.color || '#facc15',
                        border: `1px solid ${banner.badge.color || '#facc15'}50`
                      }}
                    >
                      {banner.badge.text}
                    </span>
                  </div>
                )}

                {/* Title */}
                {banner.title && (
                  <h1
                    className={`text-lg sm:text-2xl md:text-3xl font-extrabold leading-[1.3] tracking-wide uppercase text-white max-w-2xl ${
                      banner.subtitle?.isActive && banner.subtitle?.text ? 'mb-2' : 'mb-3 sm:mb-4'
                    }`}
                    dangerouslySetInnerHTML={{ __html: banner.title }}
                  />
                )}

                {/* Subtitle */}
                {banner.subtitle?.isActive && banner.subtitle?.text && (
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-3 sm:mb-4 font-medium leading-relaxed">
                    {banner.subtitle.text}
                  </p>
                )}

                {/* Buttons */}
                <div className={`flex flex-wrap gap-2.5 ${isCenter ? 'justify-center' : 'justify-start'}`}>
                  {banner.primaryButton?.isActive && banner.primaryButton?.label && (
                    <Link
                      to={banner.primaryButton.link || '/squad'}
                      className={`px-5 py-2 sm:px-6 sm:py-2.5 font-bold rounded-[2px] transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs ${
                        banner.primaryButton.variant === 'outline'
                          ? 'border-2 border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-slate-900'
                          : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                      }`}
                    >
                      {banner.primaryButton.label}
                    </Link>
                  )}
                  {banner.secondaryButton?.isActive && banner.secondaryButton?.label && (
                    <Link
                      to={banner.secondaryButton.link || '/categories'}
                      className={`px-5 py-2 sm:px-6 sm:py-2.5 font-bold rounded-[2px] transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs ${
                        banner.secondaryButton.variant === 'outline'
                          ? 'border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900'
                          : 'bg-white text-slate-800 hover:bg-gray-100'
                      }`}
                    >
                      {banner.secondaryButton.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel Navigation (Visible if > 1 banner) */}
      {totalBanners > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="ป้ายก่อนหน้า"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="ป้ายถัดไป"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-5 bg-yellow-400 shadow-sm' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                title={`ไปที่ป้ายที่ ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSection;
