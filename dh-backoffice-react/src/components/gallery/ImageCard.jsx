import React, { useState } from 'react';
import { Copy, Layers, CheckCircle2 } from 'lucide-react';

const ImageCard = ({ image, onCompare, isComparing }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative break-inside-avoid mb-4 rounded-xl overflow-hidden bg-[var(--dh-bg-base)] shadow-sm hover:shadow-xl transition-all duration-300 border ${isComparing ? 'border-[var(--dh-accent)] shadow-[0_0_15px_var(--dh-accent-light)]' : 'border-[var(--dh-border)]'}`}>
      <img src={image.url} alt={image.title} className="w-full object-cover" loading="lazy" />
      
      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 flex flex-col justify-between p-4 ${isComparing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="flex justify-between items-start">
          <span className={`px-2 py-1 text-xs font-bold rounded-md backdrop-blur-md ${image.sku ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
            {image.sku || '⚠️ NO SKU'}
          </span>
          <button 
            onClick={handleCopy}
            className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
            title="คัดลอกลิงก์ (Copy Link)"
          >
            {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>

        <div>
          <h4 className="text-white font-semibold truncate text-shadow-sm">{image.title}</h4>
          {image.description && (
            <p className="text-gray-300 text-[10px] mt-1 line-clamp-2 leading-tight">{image.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {image.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full backdrop-blur-sm">#{tag}</span>
            ))}
          </div>
          
          <button 
            onClick={() => onCompare(image)}
            className={`mt-3 w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              isComparing 
                ? 'bg-[var(--dh-accent)]/80 text-white border border-white/20 shadow-[0_0_10px_var(--dh-accent)]' 
                : 'bg-white/10 hover:bg-[var(--dh-accent)] text-white backdrop-blur-md border border-white/10 hover:border-transparent'
            }`}
          >
            <Layers size={16} />
            {isComparing ? 'กำลังเปรียบเทียบ' : 'เปรียบเทียบ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;