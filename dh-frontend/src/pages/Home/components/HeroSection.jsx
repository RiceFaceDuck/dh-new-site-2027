import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storefrontSettingsService, DEFAULT_HERO_CONFIG } from '../../../firebase/storefrontSettingsService';
import { getRenderableImageUrl } from '../../../utils/imageUtils';
import { safeJsonParse } from 'dh-shared';

const CACHE_KEY = 'dh_hero_config_cache';

const HeroSection = () => {
  // 1. Initialize from localStorage if available, otherwise DEFAULT
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

  // If we have a cached version, we don't strictly need to show a loading state that fades it out
  const [isLoading, setIsLoading] = useState(!localStorage.getItem(CACHE_KEY));

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const data = await storefrontSettingsService.getHeroConfig();
        if (isMounted && data) {
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to load hero config:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  // Use default if custom is disabled
  const activeConfig = config?.isActive ? config : DEFAULT_HERO_CONFIG;

  const overlayColor = activeConfig.overlay?.color || '#1f2937';
  const overlayOpacity = (activeConfig.overlay?.opacity ?? 90) / 100;
  const overlayDirection = activeConfig.overlay?.direction || 'to-r';
  const isOverlayEnabled = activeConfig.overlay?.enabled !== false;
  const isFullLayout = activeConfig.imageLayout === 'full';
  const isCenter = activeConfig.textAlignment === 'center';

  let gradientBackground = `linear-gradient(to right, ${overlayColor} 0%, ${overlayColor} 45%, transparent 100%)`;
  if (overlayDirection === 'to-t') {
    gradientBackground = `linear-gradient(to top, ${overlayColor} 0%, ${overlayColor} 60%, transparent 100%)`;
  } else if (overlayDirection === 'full') {
    gradientBackground = overlayColor;
  }

  const heightClass = {
    compact: 'min-h-[260px] md:min-h-[300px]',
    standard: 'min-h-[320px] md:min-h-[380px]',
    large: 'min-h-[380px] md:min-h-[460px]'
  }[activeConfig.bannerHeight || 'standard'];

  const imageUrl = getRenderableImageUrl(activeConfig.imageUrl || DEFAULT_HERO_CONFIG.imageUrl);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden flex flex-col justify-center border border-slate-700 shadow-xl transition-opacity duration-500 ${heightClass} ${isLoading ? 'opacity-70' : 'opacity-100'}`}
      style={{ backgroundColor: overlayColor }}
    >
      {/* Background Graphic */}
      {isFullLayout ? (
        <div className="absolute inset-0 z-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Hero Banner"
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
              ไม่มีรูปภาพ
            </div>
          )}
          {isOverlayEnabled && overlayOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-300"
              style={{ background: gradientBackground, opacity: overlayOpacity }}
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 flex justify-end">
          <div className="w-full md:w-[70%] h-full relative transition-all duration-300">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Hero Banner"
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                ไม่มีรูปภาพ
              </div>
            )}
            {isOverlayEnabled && overlayOpacity > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-300"
                style={{ background: gradientBackground, opacity: overlayOpacity }}
              />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 w-full h-full flex flex-col justify-center ${
          isCenter ? 'items-center text-center' : 'items-start text-left'
        } ${!isOverlayEnabled || overlayOpacity === 0 ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]' : ''}`}
      >
        {/* Badge */}
        {activeConfig.badge?.isActive && activeConfig.badge?.text && (
          <div className="mb-3">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-xs"
              style={{
                backgroundColor: `${activeConfig.badge.color || '#facc15'}25`,
                color: activeConfig.badge.color || '#facc15',
                border: `1px solid ${activeConfig.badge.color || '#facc15'}50`
              }}
            >
              {activeConfig.badge.text}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          className={`text-2xl sm:text-3xl md:text-4xl font-extrabold leading-[1.3] tracking-wide uppercase text-white max-w-2xl ${
            activeConfig.subtitle?.isActive && activeConfig.subtitle?.text ? 'mb-3' : 'mb-6'
          }`}
          dangerouslySetInnerHTML={{ __html: activeConfig.title || DEFAULT_HERO_CONFIG.title }}
        />

        {/* Subtitle */}
        {activeConfig.subtitle?.isActive && activeConfig.subtitle?.text && (
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-6 font-medium leading-relaxed">
            {activeConfig.subtitle.text}
          </p>
        )}

        {/* Buttons */}
        <div className={`flex flex-wrap gap-2.5 sm:gap-3 ${isCenter ? 'justify-center' : 'justify-start'}`}>
          {activeConfig.primaryButton?.isActive && (
            <Link
              to={activeConfig.primaryButton.link || '/squad'}
              className={`px-6 py-2.5 md:px-8 md:py-3 font-bold rounded-lg transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs ${
                activeConfig.primaryButton.variant === 'outline'
                  ? 'border-2 border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-slate-900'
                  : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
              }`}
            >
              {activeConfig.primaryButton.label || 'BOOK A SQUAD'}
            </Link>
          )}
          {activeConfig.secondaryButton?.isActive && (
            <Link
              to={activeConfig.secondaryButton.link || '/categories'}
              className={`px-6 py-2.5 md:px-8 md:py-3 font-bold rounded-lg transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs ${
                activeConfig.secondaryButton.variant === 'outline'
                  ? 'border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900'
                  : 'bg-white text-slate-800 hover:bg-gray-100'
              }`}
            >
              {activeConfig.secondaryButton.label || 'SHOP SPARES'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
