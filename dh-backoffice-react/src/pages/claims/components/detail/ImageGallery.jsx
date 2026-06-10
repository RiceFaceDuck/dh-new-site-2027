import React from 'react';
import { Image as ImageIcon, Eye } from 'lucide-react';

export default function ImageGallery({ images }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4 bg-dh-surface/60 backdrop-blur-sm p-5 rounded-xl border border-dh-border shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-black text-dh-muted uppercase tracking-widest flex items-center gap-1.5 mb-4">
        <ImageIcon className="w-3.5 h-3.5"/> ภาพประกอบ ({images.length})
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
        {images.map((img, i) => (
          <a 
            key={i} 
            href={img.replace('&sz=w1000', '')} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="shrink-0 group relative cursor-pointer block w-28 h-28 rounded-xl overflow-hidden border border-dh-border shadow-sm snap-start"
          >
             <img src={img} alt={`Attached ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
               <Eye className="text-white w-6 h-6 drop-shadow-md transform scale-75 group-hover:scale-100 transition-transform duration-300"/>
             </div>
          </a>
        ))}
      </div>
    </div>
  );
}
