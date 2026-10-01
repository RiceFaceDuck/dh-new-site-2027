import { useState } from 'react';
import { Monitor, Smartphone, EyeOff } from 'lucide-react';

export default function HeroLivePreview({ config }) {
  const [device, setDevice] = useState('desktop');
  const c = config || {};
  const overlayColor = c.overlay?.color || '#1f2937';
  const overlayOpacity = (c.overlay?.opacity ?? 90) / 100;
  const overlayDirection = c.overlay?.direction || 'to-r';

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
  }[c.bannerHeight || 'standard'];

  const isCenter = c.textAlignment === 'center';
  const isOverlayEnabled = c.overlay?.enabled !== false;
  const isFullLayout = c.imageLayout === 'full';

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white p-5 space-y-4">
      {/* Header & Device Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <span>หน้าจอจำลอง (Live Preview)</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-1">
            100% Exact Storefront Match
          </span>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              device === 'desktop' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              device === 'mobile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>
      </div>

      {/* Inactive Notice */}
      {!c.isActive && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl">
          <EyeOff size={16} className="shrink-0 text-amber-600" />
          <span>สถานะป้ายถูก "ปิดใช้งาน" อยู่ — ลูกค้าหน้าเว็บจะเห็นแบนเนอร์รูปแบบดั้งเดิม</span>
        </div>
      )}

      {/* Preview Screen */}
      <div className={`w-full flex justify-center transition-all duration-300 ${device === 'mobile' ? 'max-w-[360px] mx-auto' : 'w-full'}`}>
        <div
          className={`relative w-full rounded-2xl overflow-hidden flex flex-col justify-center border border-slate-700 shadow-xl ${heightClass}`}
          style={{ backgroundColor: overlayColor }}
        >
          {/* Background Graphic */}
          {isFullLayout ? (
            <div className="absolute inset-0 z-0">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt="Hero Preview"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
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
              <div className={`h-full relative transition-all duration-300 ${device === 'mobile' ? 'w-full' : 'w-full md:w-[70%]'}`}>
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt="Hero Preview"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
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

          {/* Text & Button Layer */}
          <div
            className={`relative z-10 p-6 sm:p-8 md:p-10 w-full h-full flex flex-col justify-center ${
              isCenter ? 'items-center text-center' : 'items-start text-left'
            } ${!isOverlayEnabled || overlayOpacity === 0 ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]' : ''}`}
          >
            {/* Badge */}
            {c.badge?.isActive && c.badge?.text && (
              <div className="mb-3">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-xs"
                  style={{
                    backgroundColor: `${c.badge.color || '#facc15'}25`,
                    color: c.badge.color || '#facc15',
                    border: `1px solid ${c.badge.color || '#facc15'}50`
                  }}
                >
                  {c.badge.text}
                </span>
              </div>
            )}

            {/* Title */}
            <h1
              className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-[1.3] tracking-wide uppercase text-white max-w-2xl ${
                c.subtitle?.isActive && c.subtitle?.text ? 'mb-3' : 'mb-6'
              }`}
              dangerouslySetInnerHTML={{
                __html: c.title || '<span class="text-slate-400">ยังไม่มีข้อความ...</span>'
              }}
            />

            {/* Subtitle */}
            {c.subtitle?.isActive && c.subtitle?.text && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-6 font-medium leading-relaxed">
                {c.subtitle.text}
              </p>
            )}

            {/* Buttons */}
            <div className={`flex flex-wrap gap-2.5 sm:gap-3 ${isCenter ? 'justify-center' : 'justify-start'}`}>
              {c.primaryButton?.isActive && (
                <div
                  className={`px-5 py-2.5 font-bold rounded-lg text-xs md:text-sm uppercase tracking-wider transition-transform shadow-xs ${
                    c.primaryButton.variant === 'outline'
                      ? 'border-2 border-yellow-400 text-yellow-400 bg-transparent'
                      : 'bg-yellow-400 text-slate-900'
                  }`}
                >
                  {c.primaryButton.label || 'PRIMARY BUTTON'}
                </div>
              )}
              {c.secondaryButton?.isActive && (
                <div
                  className={`px-5 py-2.5 font-bold rounded-lg text-xs md:text-sm uppercase tracking-wider transition-transform shadow-xs ${
                    c.secondaryButton.variant === 'outline'
                      ? 'border-2 border-white text-white bg-transparent'
                      : 'bg-white text-slate-800'
                  }`}
                >
                  {c.secondaryButton.label || 'SECONDARY BUTTON'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        จำลองผลลัพธ์แบบเรียลไทม์ตามโค้ดจริงของ B2B Storefront ทั้งการตัดขอบภาพ, ไล่สี, และรูปแบบฟอนต์
      </p>
    </div>
  );
}
