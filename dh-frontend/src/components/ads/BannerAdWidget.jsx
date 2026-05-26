import React, { useState, useEffect, useRef } from 'react';
import { Play, ExternalLink, X, Info, Image as ImageIcon, ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react';
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
  const bannerRef = useRef(null);
  const [trackedViews, setTrackedViews] = useState(new Set()); // เก็บ ID ที่เคยถูกมองเห็นแล้วเพื่อไม่ให้นับซ้ำรัวๆ

  // 1. โหลดข้อมูลป้ายโฆษณา (Unified Ads - BILLBOARD)
  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        setLoading(true);
        // 🚀 ดึงเฉพาะโฆษณาประเภท BILLBOARD ที่ผ่านการอนุมัติแล้วเท่านั้น
        const data = await marketingService.getActivePartnerAds('BILLBOARD');
        if (isMounted) {
          setBanners(data || []);
        }
      } catch (error) {
        console.error("Error loading billboard ads:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBanners();
    return () => { isMounted = false; };
  }, []);

  // 2. ระบบ Auto-Slide (หมุนโฆษณาอัตโนมัติ)
  useEffect(() => {
    if (banners.length <= 1 || activeVideoId) return; 
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 6000); // หมุนทุก 6 วิให้มีเวลาอ่าน

    return () => clearInterval(interval);
  }, [banners.length, activeVideoId]);

  // 👁️ 3. ระบบนับ View (Impression) แบบ Real-time
  useEffect(() => {
    if (banners.length === 0 || loading) return;

    const currentAd = banners[currentIndex];
    if (!currentAd || !currentAd.id || trackedViews.has(currentAd.id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 🚀 ถ้ารูปเลื่อนมาโชว์บนจอเกิน 50% ให้ยิงนับยอด View ทันที
          marketingService.trackAdView(currentAd._collection || 'partner_ads', currentAd.id);
          
          // บันทึกว่านับแล้ว จะได้ไม่ส่งซ้ำจนกว่าจะรีโหลดเว็บใหม่
          setTrackedViews(prev => {
            const newSet = new Set(prev);
            newSet.add(currentAd.id);
            return newSet;
          });
          
          observer.disconnect(); // เลิกจับตาป้ายนี้ไปก่อน
        }
      },
      { threshold: 0.5 } // เห็นเกินครึ่งใบถึงนับ
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, [currentIndex, banners, loading, trackedViews]);

  // หากไม่มีโฆษณา ให้ซ่อน Component ไปเลย (Clean UI)
  if (!loading && banners.length === 0) return null;

  // โหมดกำลังโหลด (Skeleton Loading)
  if (loading) {
    return (
      <div className="w-full aspect-video md:aspect-[21/9] bg-slate-100/50 rounded-3xl animate-pulse flex items-center justify-center border border-slate-200/60 shadow-sm mb-8 backdrop-blur-md">
        <ImageIcon className="text-slate-300 w-12 h-12 opacity-40" />
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  // หาลิงก์ YouTube (ถ้ามี)
  const youtubeId = extractYouTubeId(currentBanner?.targetUrl || currentBanner?.videoUrl || currentBanner?.link);
  const isVideo = !!youtubeId;

  // กำหนดสัดส่วนตามที่ User เลือกมาตอนสร้าง (Fallback ไปที่ 16:9 ถ้าพัง)
  let aspectClass = 'aspect-video md:aspect-[21/9]'; 
  if (currentBanner.billboardRatio === '1:1') aspectClass = 'aspect-square md:aspect-[2/1]';
  if (currentBanner.billboardRatio === '9:16') aspectClass = 'aspect-[9/16] md:aspect-[16/9] max-h-[80vh] mx-auto';

  // 🖱️ 4. ฟังก์ชันจัดการเมื่อคลิกแบนเนอร์
  const handleBannerClick = () => {
    // 🚀 ยิงนับยอด Click หักตังค์ (ถ้างบไม่หมด)
    if (currentBanner?.id) {
       marketingService.trackAdClick(currentBanner._collection || 'partner_ads', currentBanner.id);
    }

    if (isVideo) {
      setActiveVideoId(youtubeId); 
    } else if (currentBanner?.targetUrl) {
      window.open(currentBanner.targetUrl, '_blank', 'noopener,noreferrer'); 
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
      <div 
        ref={bannerRef}
        className={`w-full relative mb-8 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl group border border-slate-200/80 bg-slate-900 animate-in fade-in zoom-in-95 duration-700 transition-all`}
      >
        
        {/* 🏷️ Premium Sponsored Badge */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <span className="bg-slate-900/60 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-sm font-black tracking-widest uppercase">
            <Info size={12} className="text-amber-400" /> Sponsored
          </span>
        </div>

        {/* 🖼️ แผ่นภาพแบนเนอร์ */}
        <div 
          className={`relative w-full cursor-pointer overflow-hidden ${aspectClass}`}
          onClick={handleBannerClick}
        >
          <img 
            src={currentBanner.imageUrl} 
            alt={currentBanner.title || "Advertisement"} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
            loading="lazy"
          />
          
          {/* 🌌 Overlay อัจฉริยะ: สร้างมิติไล่ระดับสีดำจากด้านล่างเพื่อให้อ่านข้อความชัด */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>

          {/* 🎬 ไอคอนสำหรับวิดีโอ (เรืองแสงและกระเพื่อม) */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative group-hover:scale-110 transition-transform duration-500 ease-out">
                <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-60"></div>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] relative z-10 border border-white/30">
                  <Play size={32} className="ml-1.5 md:w-10 md:h-10" fill="currentColor" />
                </div>
              </div>
            </div>
          )}

          {/* 🔗 ไอคอนสำหรับ External Link (Interactive) */}
          {!isVideo && currentBanner.targetUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                   <MousePointerClick size={18}/> เข้าชมแคมเปญ
                </div>
            </div>
          )}

          {/* 📝 ข้อมูลผู้สนับสนุนและหัวข้อโฆษณา */}
          <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1 drop-shadow-md">
              สนับสนุนโดย {currentBanner.partnerName || currentBanner.customerName || 'DH Partner'}
            </p>
            <h3 className="text-white font-black text-lg md:text-2xl xl:text-3xl drop-shadow-lg truncate w-full sm:max-w-[85%] leading-tight">
              {currentBanner.title}
            </h3>
            {currentBanner.description && (
              <p className="text-slate-300 text-xs md:text-sm line-clamp-1 max-w-[75%] mt-1.5 md:mt-2 font-medium">
                {currentBanner.description}
              </p>
            )}
          </div>
        </div>

        {/* ⬅️ ➡️ ปุ่มลูกศรนำทาง (แสดงเมื่อมีหลายรูปและ Hover) */}
        {banners.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 border border-white/10 shadow-lg active:scale-95">
              <ChevronLeft size={24} className="mr-0.5" />
            </button>
            <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 border border-white/10 shadow-lg active:scale-95">
              <ChevronRight size={24} className="ml-0.5" />
            </button>

            {/* ⏺️ จุดนำทาง (Indicators) แนวหรูหรา */}
            <div className="absolute bottom-4 right-5 md:right-8 flex items-center gap-2 z-20">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`transition-all duration-500 rounded-full h-1.5 ${
                    idx === currentIndex 
                      ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                      : 'w-2 bg-white/30 hover:bg-white/60'
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"
            onClick={() => setActiveVideoId(null)}
          ></div>
          
          <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 aspect-video z-10 animate-in zoom-in-95 duration-500">
            <button 
              onClick={() => setActiveVideoId(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all z-20 backdrop-blur-md border border-white/20 shadow-lg hover:rotate-90"
              title="ปิดวิดีโอ"
            >
              <X size={24} />
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