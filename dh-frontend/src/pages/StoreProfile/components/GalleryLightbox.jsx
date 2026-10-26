import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const GalleryLightbox = ({ images = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState(null);

  const total = images.length;

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, handlePrev, handleNext]);

  // Touch swipe handlers (for mobile)
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  if (!images || total === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar: Counter & Close Button */}
      <div className="flex items-center justify-between text-white w-full max-w-7xl mx-auto z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide">
            รูปที่ {currentIndex + 1} / {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="ปิด (ESC)"
          className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all text-white cursor-pointer"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Image Area with Prev/Next buttons */}
      <div 
        className="flex-1 flex items-center justify-center relative w-full max-w-7xl mx-auto my-2 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            title="ภาพก่อนหน้า (ลูกศรซ้าย)"
            className="absolute left-2 sm:left-4 z-10 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-90 hover:scale-105 cursor-pointer shadow-lg"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* The Image */}
        <div 
          className="relative max-w-full max-h-[75vh] flex items-center justify-center p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Gallery item ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[75vh] w-auto h-auto object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>

        {/* Next Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            title="ภาพถัดไป (ลูกศรขวา)"
            className="absolute right-2 sm:right-4 z-10 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-90 hover:scale-105 cursor-pointer shadow-lg"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      {total > 1 && (
        <div 
          className="w-full max-w-4xl mx-auto overflow-x-auto py-2 z-10 no-scrollbar flex items-center justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 px-2 overflow-x-auto max-w-full py-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer border-2 ${
                  idx === currentIndex 
                    ? 'border-white scale-105 shadow-md ring-2 ring-blue-500/50' 
                    : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/60'
                }`}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryLightbox;
