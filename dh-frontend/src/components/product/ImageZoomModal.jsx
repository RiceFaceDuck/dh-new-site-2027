import React, { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyWatermarkToImage, fetchImageAsBlobUrl } from '../../utils/watermarkUtils';
import { getRenderableImageUrl } from '../../utils/imageUtils';

export default function ImageZoomModal({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose,
  productName = "Product" 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [watermarkedImage, setWatermarkedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Touch Swipe State
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleNext = React.useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = React.useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) handleNext(e);
      if (e.key === 'ArrowLeft' && images.length > 1) handlePrev(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, initialIndex, images.length, handleNext, handlePrev, onClose]);

  useEffect(() => {
    if (!isOpen || !images || images.length === 0) return;

    let isMounted = true;
    const currentImageUrl = images[currentIndex];

    const processImage = async () => {
      setIsLoading(true);
      setError(false);
      setWatermarkedImage(null);

      try {
        // Try to apply watermark via Canvas (requires CORS)
        const dataUrl = await applyWatermarkToImage(currentImageUrl);
        if (isMounted) {
          setWatermarkedImage(dataUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Canvas watermarking failed, falling back to Blob URL or Raw URL", err);
        // Fallback: try to fetch as Blob to hide URL
        const blobUrl = await fetchImageAsBlobUrl(currentImageUrl);
        if (isMounted) {
          if (blobUrl) {
            setWatermarkedImage(blobUrl);
            setIsLoading(false);
          } else {
            // Absolute fallback: just use the raw renderable URL
            setWatermarkedImage(getRenderableImageUrl(currentImageUrl));
            setError(true); // Indicate that watermark might not be present
            setIsLoading(false);
          }
        }
      }
    };

    processImage();

    return () => {
      isMounted = false;
    };
  }, [currentIndex, images, isOpen]);

  if (!isOpen) return null;

  // Touch Swipe Logic
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && images.length > 1) handleNext();
    if (isRightSwipe && images.length > 1) handlePrev();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-[110] flex items-center gap-3">
        {/* Download Button (Moved to top right next to close button) */}
        {!isLoading && watermarkedImage && (
          <a 
            href={watermarkedImage}
            download={`${productName}-dhnotebook.jpg`}
            className="p-2 md:px-4 md:py-2 bg-brand/90 hover:bg-brand text-white font-bold rounded-full transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)] flex items-center gap-2 backdrop-blur-md"
            title="ดาวน์โหลดภาพ"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={20} />
            <span className="hidden md:inline">ดาวน์โหลด</span>
          </a>
        )}
        <button 
          className="p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md"
          onClick={onClose}
          title="ปิด (Esc)"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        {isLoading ? (
          <div className="flex flex-col items-center text-white gap-4">
            <div className="w-16 h-16 border-4 border-slate-600 border-t-white rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">กำลังประมวลผลรูปภาพความละเอียดสูง...</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {watermarkedImage && (
              <div className="relative max-w-full max-h-full flex items-center justify-center group">
                <img 
                  src={watermarkedImage} 
                  alt={`${productName} - Zoomed`} 
                  className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm transition-transform duration-300"
                  onContextMenu={(e) => {
                    // Prevent right click only if we couldn't watermark it properly
                    // If it's watermarked, they can download it
                    if (error) e.preventDefault(); 
                  }}
                />
                
                {/* Visual watermark overlay (Fallback if canvas fails) */}
                {error && (
                  <>
                    {/* Center DH text as fallback logo */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden mix-blend-overlay">
                      <h1 className="text-8xl md:text-[150px] font-black text-white opacity-10 drop-shadow-lg tracking-tighter">
                        DH
                      </h1>
                    </div>
                    {/* Bottom Right Text */}
                    <div className="absolute bottom-6 right-6 pointer-events-none select-none mix-blend-overlay">
                      <p className="text-sm md:text-xl font-bold text-white opacity-40 drop-shadow-md">
                        WWW.DHNOTEBOOK.COM
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            

          </div>
        )}

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button 
              className="absolute left-4 z-[110] p-3 bg-black/50 hover:bg-brand text-white rounded-full transition-colors backdrop-blur-sm"
              onClick={handlePrev}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              className="absolute right-4 z-[110] p-3 bg-black/50 hover:bg-brand text-white rounded-full transition-colors backdrop-blur-sm"
              onClick={handleNext}
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}


      </div>

      {/* Thumbnails (Optional) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-[110] flex justify-center gap-2 p-4 pointer-events-none">
          <div className="flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-md pointer-events-auto overflow-x-auto max-w-[90vw] custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === idx ? 'border-brand scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img 
                  src={getRenderableImageUrl(img)} 
                  alt="thumbnail" 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
