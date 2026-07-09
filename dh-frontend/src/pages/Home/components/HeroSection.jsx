import React, { useState, useEffect } from 'react';
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
      return cached ? safeJsonParse(cached) : DEFAULT_HERO_CONFIG;
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
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
  const activeConfig = config.isActive ? config : DEFAULT_HERO_CONFIG;

  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden flex flex-col items-center min-h-[280px] md:min-h-[360px] lg:min-h-[400px] transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      style={{ backgroundColor: activeConfig.overlay?.color || '#1f2937' }}
    >
      {/* Background Image / Graphic on the right */}
      <div className="absolute inset-0 z-0 flex justify-end">
        <div className="w-full md:w-[70%] h-full relative">
          <img 
            src={getRenderableImageUrl(activeConfig.imageUrl || DEFAULT_HERO_CONFIG.imageUrl)} 
            alt="Electronic Repairs" 
            loading="eager"
            fetchpriority="high"
            className="w-full h-full object-cover"
          />
          {/* Dynamic Gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${activeConfig.overlay?.color || '#1f2937'} 0%, ${activeConfig.overlay?.color || '#1f2937'} 40%, transparent 100%)`,
              opacity: (activeConfig.overlay?.opacity ?? 90) / 100
            }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-12 lg:p-16 w-full h-full flex flex-col justify-center">
        {/* Render HTML from config securely */}
        <h1 
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 leading-[1.3] tracking-wide uppercase text-white max-w-2xl"
            dangerouslySetInnerHTML={{ __html: activeConfig.title || DEFAULT_HERO_CONFIG.title }}
        />
        
        <div className="flex flex-row space-x-3 md:space-x-4">
          {activeConfig.primaryButton?.isActive && (
            <Link to={activeConfig.primaryButton.link} className="px-6 py-2.5 md:px-8 md:py-3 bg-yellow-400 text-slate-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs">
              {activeConfig.primaryButton.label}
            </Link>
          )}
          {activeConfig.secondaryButton?.isActive && (
            <Link to={activeConfig.secondaryButton.link} className="px-6 py-2.5 md:px-8 md:py-3 bg-white text-slate-800 font-bold rounded-lg hover:bg-gray-100 transition-colors text-xs md:text-sm uppercase tracking-wider shadow-xs">
              {activeConfig.secondaryButton.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
