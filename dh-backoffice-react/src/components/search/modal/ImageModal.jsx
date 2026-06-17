import React from 'react';
import { X, Info } from 'lucide-react';

export default function ImageModal({ isImageModalOpen, setIsImageModalOpen, selectedProduct }) {
  if (!isImageModalOpen || !selectedProduct?.images?.[0]) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
      onClick={() => setIsImageModalOpen(false)}
    >
      <button className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-lg z-10">
        <X size={24}/>
      </button>
      <div className="relative max-w-5xl max-h-full flex flex-col items-center justify-center w-full h-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <img 
          src={selectedProduct.images[0]} 
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-dh-surface ring-1 ring-white/10" 
          draggable="true" 
          alt="Product Detail"
        />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <p className="text-white/80 font-medium select-none bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[11px] shadow-lg flex items-center gap-2 border border-white/10">
              <Info size={14} className="text-dh-accent"/> ลากรูปภาพไปวางในแชตได้โดยตรง
            </p>
        </div>
      </div>
    </div>
  );
}
