import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import LazyImage from '../common/LazyImage';
import { getRenderableImageUrl } from '../../utils/imageUtils';
import { applyWatermarkToImage, fetchImageAsBlobUrl } from '../../utils/watermarkUtils';
import ImageZoomModal from './ImageZoomModal';

export default function ProductImageSection({ product, imageUrl: defaultImageUrl, name }) {
  const [activeImage, setActiveImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [watermarkedImage, setWatermarkedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasWatermarkError, setHasWatermarkError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setActiveImage(null);
    setImageError(false);
  }, [product?.id]);

  const rawImages = product?.images || product?.imageurl || [];
  const imagesArray = Array.isArray(rawImages) ? rawImages : (rawImages ? [rawImages] : []);
  
  // Find hiddenImages robustly (ignore case)
  const hiddenImagesKey = Object.keys(product || {}).find(k => k.toLowerCase() === 'hiddenimages');
  const rawHidden = hiddenImagesKey ? (product[hiddenImagesKey] || []) : [];
  const hiddenImages = Array.isArray(rawHidden) ? rawHidden.map(u => String(u).trim()) : [];

  // Filter out hidden images
  const finalImages = imagesArray.filter(img => !hiddenImages.includes(String(img).trim()));

  // Determine current image to display
  const currentImage = activeImage || (finalImages.length > 0 ? finalImages[0] : null);

  useEffect(() => {
    if (!currentImage) {
      setWatermarkedImage(null);
      return;
    }

    let isMounted = true;
    const processImage = async () => {
      setIsProcessing(true);
      setHasWatermarkError(false);
      setWatermarkedImage(null);

      try {
        // Try to apply watermark via Canvas (requires CORS)
        const dataUrl = await applyWatermarkToImage(currentImage);
        if (isMounted) {
          setWatermarkedImage(dataUrl);
          setIsProcessing(false);
        }
      } catch (err) {
        console.warn("Canvas watermarking failed in main view, trying blob or raw fallback", err);
        // Fallback: try to fetch as Blob to hide URL
        const blobUrl = await fetchImageAsBlobUrl(currentImage);
        if (isMounted) {
          if (blobUrl) {
            setWatermarkedImage(blobUrl);
            setIsProcessing(false);
          } else {
            // Absolute fallback: just use the raw renderable URL
            setWatermarkedImage(getRenderableImageUrl(currentImage));
            setHasWatermarkError(true); // Indicate that watermark might not be present
            setIsProcessing(false);
          }
        }
      }
    };

    processImage();

    return () => {
      isMounted = false;
    };
  }, [currentImage]);

  return (
    <div className="p-6 md:p-10 bg-slate-50 flex flex-col items-center justify-start border-b md:border-b-0 md:border-r border-slate-200">
      <div className="relative w-full max-w-md aspect-square bg-white rounded-xl shadow-xs overflow-hidden group mb-4 flex items-center justify-center">
        {watermarkedImage && !imageError ? (
          <div 
            className="relative w-full h-full cursor-zoom-in" 
            onClick={() => setIsZoomOpen(true)}
            title="คลิกเพื่อขยายดูภาพ"
          >
            <LazyImage 
              src={watermarkedImage} 
              alt={name} 
              onError={() => setImageError(true)}
              fallbackSrc={null}
              className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-in-out"
              placeholderClassName="bg-slate-50 animate-pulse"
             />
             {hasWatermarkError && (
               <>
                 {/* Visual watermark overlay (Fallback if canvas fails) */}
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden mix-blend-overlay">
                   <h1 className="text-6xl font-black text-white opacity-10 drop-shadow-lg tracking-tighter">
                     DH
                   </h1>
                 </div>
                 <div className="absolute bottom-4 right-4 pointer-events-none select-none mix-blend-overlay">
                   <p className="text-xs font-bold text-white opacity-40 drop-shadow-md">
                     WWW.DHNOTEBOOK.COM
                   </p>
                 </div>
               </>
             )}
          </div>
        ) : isProcessing ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
            <span className="text-xs font-medium animate-pulse">กำลังดาวน์โหลดภาพ...</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
            <Package size={64} strokeWidth={1} className="mb-2 opacity-50" />
            <span className="text-sm font-bold tracking-widest text-slate-400">NO IMAGE</span>
          </div>
        )}
      </div>

      {imagesArray.length > 1 && finalImages.length > 0 && (
        <div className="flex gap-2 w-full max-w-md overflow-x-auto pb-2 custom-scrollbar">
          {finalImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveImage(img);
                setImageError(false); // Reset error state when switching image
              }}
              className={`shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden bg-white transition-all ${
                currentImage === img ? 'border-blue-500 shadow-xs' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img 
                src={getRenderableImageUrl(img)} 
                alt={`${name} thumbnail ${idx}`} 
                className="w-full h-full object-cover rounded-sm shadow-xs opacity-90 hover:opacity-100"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Err'; }} 
               loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {/* 🔮 Image Zoom Modal */}
      <ImageZoomModal 
        images={finalImages} 
        initialIndex={finalImages.indexOf(currentImage) >= 0 ? finalImages.indexOf(currentImage) : 0} 
        isOpen={isZoomOpen} 
        onClose={() => setIsZoomOpen(false)} 
        productName={name} 
      />
    </div>
  );
}
