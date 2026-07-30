import { useState, useEffect, useRef } from 'react';
import { X, Info, ChevronLeft, ChevronRight, Layers, Star, Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageModal({ 
  isImageModalOpen, 
  setIsImageModalOpen, 
  selectedProduct 
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const thumbnailRefs = useRef([]);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Extract all images belonging to this exact SKU
  const images = Array.isArray(selectedProduct?.images) 
    ? selectedProduct.images.filter(img => typeof img === 'string' && img.trim() !== '')
    : [];

  // Reset active image index, zoom, and pan position when modal opens or selected product changes
  useEffect(() => {
    if (isImageModalOpen) {
      setActiveIndex(0);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isImageModalOpen, selectedProduct]);

  // Reset zoom and pan position when switching active image
  useEffect(() => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [activeIndex]);

  // Reset pan position when zoom returns to 1x
  useEffect(() => {
    if (zoomScale <= 1) {
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [zoomScale]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (isImageModalOpen && thumbnailRefs.current[activeIndex]) {
      thumbnailRefs.current[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeIndex, isImageModalOpen]);

  // Keyboard navigation (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    if (!isImageModalOpen || images.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, images.length, setIsImageModalOpen]);

  if (!isImageModalOpen || images.length === 0) return null;

  const currentImage = images[activeIndex] || images[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // 1-Click Copy Image to Clipboard
  const handleCopyImage = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(currentImage);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch (err) {
      console.warn('Falling back to image URL copy:', err);
      try {
        await navigator.clipboard.writeText(currentImage);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2200);
      } catch (e2) {
        console.error('Copy failed:', e2);
      }
    }
  };

  // Scroll Wheel Zoom
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(prev + 0.25, 4));
    } else {
      setZoomScale(prev => Math.max(prev - 0.25, 1));
    }
  };

  // Mouse Drag / Pan Logic
  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-120 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 md:p-6 animate-in fade-in duration-200"
      onClick={() => setIsImageModalOpen(false)}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl flex justify-between items-center z-20 shrink-0 text-white flex-wrap gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-md">
          <Layers size={16} className="text-cyan-400" />
          <span className="text-[12px] font-black uppercase text-cyan-300">{selectedProduct?.sku}</span>
          <span className="text-[11px] text-white/70 truncate max-w-[150px] sm:max-w-[250px] md:max-w-md">{selectedProduct?.name}</span>
          {images.length > 1 && (
            <span className="text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md">
              {images.length} ภาพ
            </span>
          )}
        </div>

        {/* Action Buttons & Counter */}
        <div className="flex items-center gap-2">
          {/* Copy Image Button */}
          <button 
            onClick={handleCopyImage}
            className={`flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-md ${
              copySuccess 
                ? 'bg-emerald-600 text-white border-emerald-400' 
                : 'bg-black/60 hover:bg-cyan-600 text-cyan-300 hover:text-white border-white/10 hover:border-cyan-400'
            }`}
            title="คัดลอกรูปภาพลง Clipboard สำหรับวางในแชต"
          >
            {copySuccess ? <Check size={14} className="animate-in zoom-in" /> : <Copy size={14} />}
            <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกรูป'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 1))} 
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="ย่อขนาด"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-mono text-white/80 w-10 text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 4))} 
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="ขยายขนาด"
            >
              <ZoomIn size={16} />
            </button>
            {zoomScale > 1 && (
              <button 
                onClick={() => { setZoomScale(1); setPanPosition({ x: 0, y: 0 }); }} 
                className="p-1 text-cyan-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-0.5"
                title="รีเซ็ตขนาด 100%"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <span className="text-[11px] font-extrabold text-white/80 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              {activeIndex + 1} / {images.length}
            </span>
          )}

          <button 
            onClick={() => setIsImageModalOpen(false)}
            className="text-white/60 hover:text-white hover:bg-white/15 transition-all p-2 rounded-xl border border-white/10 active:scale-95 cursor-pointer ml-1"
            title="ปิด (Esc)"
          >
            <X size={22}/>
          </button>
        </div>
      </div>

      {/* Main Enlarged Image Stage with Drag & Pan */}
      <div 
        className={`relative flex-1 w-full max-w-5xl flex items-center justify-center my-2 overflow-hidden animate-in zoom-in-95 duration-200 group ${
          zoomScale > 1 
            ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') 
            : 'cursor-default'
        }`}
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={() => setZoomScale(prev => (prev === 1 ? 2.5 : 1))}
      >
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-4 z-30 p-3 rounded-2xl bg-black/60 hover:bg-cyan-600 text-white/80 hover:text-white transition-all backdrop-blur-md shadow-2xl border border-white/10 hover:border-cyan-400 hover:scale-110 active:scale-95 cursor-pointer"
            title="รูปก่อนหน้า (←)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Enlarged Image with Dynamic Zoom & Pan */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden p-2 select-none">
          <img 
            src={currentImage} 
            style={{ 
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`, 
              transition: isDragging ? 'none' : 'transform 0.15s ease-out' 
            }}
            className="max-w-full max-h-[68vh] md:max-h-[72vh] rounded-2xl shadow-2xl object-contain bg-slate-900/60 ring-1 ring-white/15 origin-center select-none pointer-events-none" 
            draggable="false" 
            alt={`${selectedProduct?.sku} - Image ${activeIndex + 1}`}
            loading="lazy" 
          />
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-4 z-30 p-3 rounded-2xl bg-black/60 hover:bg-cyan-600 text-white/80 hover:text-white transition-all backdrop-blur-md shadow-2xl border border-white/10 hover:border-cyan-400 hover:scale-110 active:scale-95 cursor-pointer"
            title="รูปถัดไป (→)"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Tip Badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white/90 font-medium select-none bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] shadow-lg flex items-center gap-2 border border-white/10">
            <Info size={14} className="text-cyan-400"/> ใช้ Scroll Wheel ซูม | {zoomScale > 1 ? 'คลิกค้างแล้วลากเมาส์เพื่อขยับตำแหน่งรูป' : 'Double Click เพื่อซูมขยาย 250%'} {images.length > 1 && <>| ลูกศร <span className="font-mono bg-white/20 px-1 rounded text-[10px]">←</span> <span className="font-mono bg-white/20 px-1 rounded text-[10px]">→</span> สลับรูป</>}
          </p>
        </div>
      </div>

      {/* Bottom Thumbnail Strip for the SAME SKU */}
      {images.length > 1 && (
        <div 
          className="w-full max-w-5xl shrink-0 z-20 pt-1 pb-2 animate-in slide-in-from-bottom-2 duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-2.5 overflow-x-auto p-2.5 custom-scrollbar justify-start md:justify-center items-center bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
            {images.map((imgUrl, idx) => {
              const isActive = idx === activeIndex;
              const isCover = idx === 0;

              return (
                <button
                  key={`${imgUrl}-${idx}`}
                  ref={el => (thumbnailRefs.current[idx] = el)}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden transition-all duration-200 border cursor-pointer group/thumb ${
                    isActive 
                      ? 'ring-2 ring-cyan-400 border-cyan-400 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.5)] opacity-100' 
                      : 'border-white/15 opacity-60 hover:opacity-100 hover:scale-100 hover:border-white/40'
                  }`}
                  title={isCover ? 'ภาพปก (Cover)' : `ภาพที่ ${idx + 1}`}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-contain bg-slate-900"
                    loading="lazy"
                  />

                  {/* Cover Photo Star Badge */}
                  {isCover && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 p-0.5 rounded-md shadow-md">
                      <Star size={10} fill="currentColor" />
                    </div>
                  )}

                  {/* Image Index Label */}
                  <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] font-black text-center truncate transition-colors ${
                    isActive ? 'bg-cyan-600 text-white' : 'bg-black/70 text-white/80'
                  }`}>
                    {isCover ? 'ภาพปก' : `ภาพที่ ${idx + 1}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
