import React, { useState } from 'react';
import { Package } from 'lucide-react';

export default function ProductImageSection({ product, imageUrl: defaultImageUrl, name }) {
  const [activeImage, setActiveImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setActiveImage(null);
    setImageError(false);
  }, [product?.id]);

  const getRenderableImageUrl = (url) => {
    if (!url) return '';
    const match = String(url).match(/[-\w]{25,}/);
    if (String(url).includes('drive.google.com') && match) {
      return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

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

  return (
    <div className="p-6 md:p-10 bg-slate-50 flex flex-col items-center justify-start border-b md:border-b-0 md:border-r border-slate-200">
      <div className="relative w-full max-w-md aspect-square bg-white rounded-xl shadow-sm overflow-hidden group mb-4 flex items-center justify-center">
        {currentImage && !imageError ? (
          <img 
            src={getRenderableImageUrl(currentImage)} 
            alt={name} 
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
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
                currentImage === img ? 'border-blue-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img 
                src={getRenderableImageUrl(img)} 
                alt={`${name} thumbnail ${idx}`} 
                className="w-full h-full object-cover rounded shadow-sm opacity-90 hover:opacity-100"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Err'; }} 
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
