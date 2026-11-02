import { useState, useEffect } from 'react';
import { Monitor, Smartphone, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

export default function HeroLivePreview({ config, selectedBannerId }) {
  const [device, setDevice] = useState('desktop');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const c = config || {};
  const banners = Array.isArray(c.banners) && c.banners.length > 0 ? c.banners : [c];
  
  // Keep slide in sync when selectedBannerId changes in parent
  useEffect(() => {
    if (selectedBannerId) {
      const idx = banners.findIndex(b => b.id === selectedBannerId);
      if (idx >= 0) setCurrentSlideIndex(idx);
    }
  }, [selectedBannerId, banners]);

  // Current banner to display
  const activeBanner = banners[currentSlideIndex] || banners[0] || c;

  const overlayColor = activeBanner.overlay?.color || '#1f2937';
  const overlayOpacity = (activeBanner.overlay?.opacity ?? 90) / 100;
  const overlayDirection = activeBanner.overlay?.direction || 'to-r';

  let gradientBackground = `linear-gradient(to right, ${overlayColor} 0%, ${overlayColor} 45%, transparent 100%)`;
  if (overlayDirection === 'to-t') {
    gradientBackground = `linear-gradient(to top, ${overlayColor} 0%, ${overlayColor} 60%, transparent 100%)`;
  } else if (overlayDirection === 'full') {
    gradientBackground = overlayColor;
  }

  // Aspect ratio styling
  const aspectClass = {
    '16:9': 'aspect-[16/9]',
    '3:1': 'aspect-[3/1]',
    '21:9': 'aspect-[21/9]',
    'auto': 'min-h-[280px] md:min-h-[360px]'
  }[c.aspectRatio || '16:9'] || 'aspect-[16/9]';

  const isCenter = activeBanner.textAlignment === 'center';
  const isOverlayEnabled = activeBanner.overlay?.enabled !== false;
  const isFullLayout = activeBanner.imageLayout === 'full';
  const isContain = activeBanner.imageFit === 'contain';

  const handlePrev = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="border border-slate-300 rounded-[2px] overflow-hidden shadow-sm bg-white p-5 space-y-4">
      {/* Header & Device Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span>หน้าจอจำลอง (Live Preview)</span>
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-[2px] border border-emerald-300 inline-block">
              100% Exact Storefront Match
            </span>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-[2px] border border-slate-300">
              สัดส่วน: {c.aspectRatio || '16:9'}
            </span>
          </div>
        </div>
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-[2px] border border-slate-300">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
              device === 'desktop' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
              device === 'mobile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>
      </div>

      {/* Inactive Notice */}
      {!c.isActive && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-[2px]">
          <EyeOff size={16} className="shrink-0 text-amber-600" />
          <span>ระบบป้ายถูก "ปิดใช้งาน" รวมอยู่ — ลูกค้าหน้าเว็บจะเห็นแบนเนอร์รูปแบบดั้งเดิม</span>
        </div>
      )}

      {/* Preview Screen Container */}
      <div className={`w-full flex justify-center transition-all duration-300 ${device === 'mobile' ? 'max-w-[360px] mx-auto' : 'w-full'}`}>
        <div
          className={`relative w-full rounded-[2px] overflow-hidden flex flex-col justify-center border border-slate-700 shadow-xl ${aspectClass}`}
          style={{ backgroundColor: overlayColor }}
        >
          {/* Background Graphic */}
          {isFullLayout ? (
            <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
              <img
                src={getRenderableImageUrl(activeBanner.imageUrl || '/user-bg.jpg') || '/user-bg.jpg'}
                alt="Hero Preview"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, activeBanner.imageUrl, '/user-bg.jpg')}
                className={`w-full h-full ${isContain ? 'object-contain' : 'object-cover object-center'}`}
                loading="lazy"
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
              <div className={`h-full relative transition-all duration-300 flex items-center justify-center ${device === 'mobile' ? 'w-full' : 'w-full md:w-[70%]'}`}>
                <img
                  src={getRenderableImageUrl(activeBanner.imageUrl || '/user-bg.jpg') || '/user-bg.jpg'}
                  alt="Hero Preview"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, activeBanner.imageUrl, '/user-bg.jpg')}
                  className={`w-full h-full ${isContain ? 'object-contain' : 'object-cover object-center'}`}
                  loading="lazy"
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
          <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full max-w-2xl pointer-events-none">
            {/* Badge */}
            {activeBanner.badge?.isActive && activeBanner.badge?.text && (
              <div className="mb-2">
                <span
                  className="text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-sm tracking-wider uppercase inline-block shadow-xs"
                  style={{
                    backgroundColor: activeBanner.badge.color || '#facc15',
                    color: '#000'
                  }}
                >
                  {activeBanner.badge.text}
                </span>
              </div>
            )}

            {/* Title */}
            <div
              className={`text-white font-extrabold text-base sm:text-xl md:text-2xl leading-tight drop-shadow-md ${
                isCenter ? 'text-center' : 'text-left'
              }`}
              dangerouslySetInnerHTML={{
                __html: activeBanner.title || 'ไม่มีข้อความ'
              }}
            />

            {/* Subtitle */}
            {activeBanner.subtitle?.isActive && activeBanner.subtitle?.text && (
              <p className={`text-slate-200 text-xs sm:text-sm mt-2 font-medium drop-shadow-sm ${
                isCenter ? 'text-center' : 'text-left'
              }`}>
                {activeBanner.subtitle.text}
              </p>
            )}

            {/* Buttons */}
            <div className={`flex flex-wrap gap-2.5 mt-4 ${isCenter ? 'justify-center' : 'justify-start'}`}>
              {activeBanner.primaryButton?.isActive && (
                <button
                  type="button"
                  className={`px-3.5 py-1.5 rounded-[2px] font-black text-[11px] md:text-xs shadow-md ${
                    activeBanner.primaryButton?.variant === 'outline'
                      ? 'border border-amber-400 text-amber-300 bg-amber-400/10'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {activeBanner.primaryButton?.label || 'BOOK A SQUAD'}
                </button>
              )}
              {activeBanner.secondaryButton?.isActive && (
                <button
                  type="button"
                  className={`px-3.5 py-1.5 rounded-[2px] font-black text-[11px] md:text-xs shadow-md ${
                    activeBanner.secondaryButton?.variant === 'outline'
                      ? 'border border-white/60 text-white bg-white/10'
                      : 'bg-white hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  {activeBanner.secondaryButton?.label || 'SHOP SPARES'}
                </button>
              )}
            </div>
          </div>

          {/* Carousel Arrows & Indicator (If more than 1 banner) */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="ป้ายก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="ป้ายถัดไป"
              >
                <ChevronRight size={16} />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentSlideIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
