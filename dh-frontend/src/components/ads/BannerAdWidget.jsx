import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, X, Info, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { marketingService } from '../../firebase/marketingService';

/**
 * 🛠️ ฟังก์ชันอัจฉริยะ: สกัด YouTube ID จากลิงก์รูปแบบต่างๆ
 * รองรับ: youtu.be/xxx, youtube.com/watch?v=xxx
 */
const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const BannerAdWidget = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState(null); // สำหรับเปิด Modal YouTube

  // 1. โหลดข้อมูลป้ายโฆษณา (ใช้ Smart Cache)
  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const data = await marketingService.getActiveBanners();
        if (isMounted) {
          setBanners(data || []);
        }
      } catch (error) {
        console.error("Error loading banners:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBanners();
    return () => { isMounted = false; };
  }, []);

  // 2. ระบบ Auto-Slide (หมุนโฆษณาอัตโนมัติ)
  useEffect(() => {
    // หยุดหมุนถ้ามีป้ายเดียว หรือกำลังดูวิดีโออยู่
    if (banners.length <= 1 || activeVideoId) return; 
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // เปลี่ยนภาพทุก 5 วินาที

    return () => clearInterval(interval);
  }, [banners.length, activeVideoId]);

  // หากไม่มีโฆษณา ให้ซ่อน Component ไปเลย (Clean UI)
  if (!loading && banners.length === 0) return null;

  // โหมดกำลังโหลด (Skeleton Loading)
  if (loading) {
    return (
      <div className="w-full aspect-[21/9] md:aspect-[21/6] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center border border-slate-200 shadow-sm mb-6">
        <ImageIcon className="text-slate-300 w-10 h-10 opacity-50" />
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  // ตรวจจับลิงก์ YouTube อัตโนมัติ ไม่ว่าจะใส่มาในฟิลด์ไหน
  const youtubeId = extractYouTubeId(currentBanner?.youtubeUrl || currentBanner?.videoUrl || currentBanner?.link);
  const isVideo = !!youtubeId;

  // ฟังก์ชันจัดการเมื่อคลิกแบนเนอร์
  const handleBannerClick = () => {
    if (isVideo) {
      setActiveVideoId(youtubeId); // เปิด Video Modal
    } else if (currentBanner?.link) {
      window.open(currentBanner.link, '_blank', 'noopener,noreferrer'); // เด้งไปลิงก์ภายนอก
    }
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <>
      <div className="w-full relative mb-6 rounded-2xl overflow-hidden shadow-md group border border-slate-200 bg-slate-900 animate-fade-in">
        
        {/* ป้าย Tag ผู้สนับสนุน */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <span className="bg-black/40 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded border border-white/20 flex items-center gap-1 shadow-sm font-medium tracking-wide">
            <Info size={12} /> แนะนำ
          </span>
        </div>

        {/* แผ่นภาพแบนเนอร์ */}
        <div 
          className="relative w-full aspect-[21/9] md:aspect-[21/6] cursor-pointer overflow-hidden"
          onClick={handleBannerClick}
        >
          <img 
            src={currentBanner.imageUrl} 
            alt={currentBanner.title || "Advertisement"} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://placehold.co/1200x400/0f172a/334155?text=DH+Banner'; }}
          />
          
          {/* Overlay อัจฉริยะ: สร้างมิติไล่ระดับสีดำจากด้านล่าง */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

          {/* ไอคอนสำหรับวิดีโอ (เรืองแสงและกระเพื่อม) */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-60"></div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl relative z-10 border border-white/30">
                  <Play size={28} className="ml-1 md:w-8 md:h-8" fill="currentColor" />
                </div>
              </div>
            </div>
          )}

          {/* ไอคอนสำหรับ External Link */}
          {!isVideo && currentBanner.link && (
            <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 shadow-md">
              <ExternalLink size={16} />
            </div>
          )}

          {/* หัวข้อโฆษณา (ถ้ามี) */}
          {currentBanner.title && (
            <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
              <h3 className="text-white font-bold text-base md:text-xl xl:text-2xl drop-shadow-md truncate max-w-[85%]">
                {currentBanner.title}
              </h3>
              {currentBanner.description && (
                <p className="text-white/80 text-xs md:text-sm line-clamp-1 max-w-[75%] mt-1 font-medium">
                  {currentBanner.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ปุ่มลูกศรนำทาง (แสดงเมื่อมีหลายรูปและ Hover) */}
        {banners.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/30 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 border border-white/10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/30 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 border border-white/10">
              <ChevronRight size={20} />
            </button>

            {/* จุดนำทาง (Indicators) */}
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`transition-all duration-300 rounded-full h-1.5 ${
                    idx === currentIndex ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'w-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ==========================================
          🎬 YouTube In-App Modal (Popup เล่นวิดีโอแบบพรีเมียม)
          ========================================== */}
      {activeVideoId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          {/* พื้นหลังเบลอ */}
          <div 
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            onClick={() => setActiveVideoId(null)}
          ></div>
          
          {/* กรอบวิดีโอระดับโรงภาพยนตร์ */}
          <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video z-10 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setActiveVideoId(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 bg-black/50 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors z-20 backdrop-blur-md border border-white/10"
              title="ปิดวิดีโอ"
            >
              <X size={20} />
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerAdWidget;