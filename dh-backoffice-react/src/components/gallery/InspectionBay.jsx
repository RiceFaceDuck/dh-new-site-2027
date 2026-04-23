import React, { useState, useCallback } from 'react';
import { Maximize2, Trash2, Moon, Sun, Image as ImageIcon, X } from 'lucide-react';

const InspectionBay = ({ images, onRemove, onClear, onClose }) => {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [darkRoom, setDarkRoom] = useState(true); // Default เป็นห้องมืดให้ดูขลัง

  // Sync Zoom
  const handleMouseMove = useCallback((e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  }, []);

  return (
    <div className={`h-full w-full flex flex-col transition-colors duration-500 ${darkRoom ? 'bg-[#0f1115]' : 'bg-[var(--dh-bg-surface)]'}`}>
      
      {/* Fantasy Toolbar */}
      <div className={`flex justify-between items-center p-4 border-b ${darkRoom ? 'border-gray-800 text-gray-300 bg-black/40' : 'border-[var(--dh-border)] text-[var(--dh-text-main)] bg-white/40'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--dh-accent)]/20 rounded-lg text-[var(--dh-accent)]">
            <Maximize2 size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-wide">INSPECTION BAY</h3>
            <p className={`text-xs ${darkRoom ? 'text-gray-500' : 'text-gray-500'}`}>ศูนย์ปฏิบัติการเปรียบเทียบภาพ (Sync Zoom)</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ml-4 border ${isZooming ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
            {isZooming ? '● SYNC ACTIVE' : 'HOVER TO ZOOM'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkRoom(!darkRoom)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${darkRoom ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {darkRoom ? <><Sun size={14}/> เปิดไฟ</> : <><Moon size={14}/> ปิดไฟ (ห้องมืด)</>}
          </button>
          
          <div className="h-6 w-px bg-gray-600/50"></div>

          <button onClick={onClear} className="text-sm text-red-400 hover:text-red-300 font-bold px-2 transition-colors">
            เคลียร์แท่น
          </button>
          
          <button onClick={onClose} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1">
            <X size={18}/>
            <span className="font-bold pr-1 text-sm">ย่อเก็บ</span>
          </button>
        </div>
      </div>

      {/* Sync Zoom Workspace (เต็มจอ) */}
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        {images.map((img) => (
          <div 
            key={img.id} 
            className={`relative flex-1 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl group
              ${darkRoom ? 'bg-[#000000]' : 'bg-[var(--dh-bg-base)] border-[var(--dh-border)]'}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
          >
            {/* Remove Button */}
            <button 
              onClick={() => onRemove(img.id)}
              className="absolute top-4 right-4 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            >
              <Trash2 size={16} />
            </button>

            {/* Image Layer */}
            <div 
              className="w-full h-full transition-all duration-100 ease-linear"
              style={{
                backgroundImage: `url(${img.url})`,
                backgroundPosition: isZooming ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                backgroundSize: isZooming ? '300%' : 'contain',
                backgroundRepeat: 'no-repeat',
                cursor: isZooming ? 'crosshair' : 'default'
              }}
            />
            
            {/* Metadata Overlay Bottom */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 backdrop-blur-xl ${darkRoom ? 'bg-black/80 text-gray-300 border-t border-gray-800' : 'bg-white/90 text-gray-800 border-t border-[var(--dh-border)]'} flex flex-col gap-1 translate-y-full group-hover:translate-y-0 transition-transform duration-300`}>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded text-xs font-black ${img.sku ? 'bg-[var(--dh-accent)] text-white' : 'bg-red-500 text-white'}`}>{img.sku || 'NO SKU'}</span>
                <span className="font-bold text-sm truncate ml-2">{img.title}</span>
              </div>
              {img.description && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-1">{img.description}</p>}
            </div>
          </div>
        ))}
        
        {/* Placeholder สำหรับช่องที่ว่างอยู่ (รับได้ 3 รูป) */}
        {images.length < 3 && Array.from({ length: 3 - images.length }).map((_, i) => (
          <div key={`empty-${i}`} className={`flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${darkRoom ? 'border-gray-800/50 text-gray-600 hover:border-gray-700 hover:bg-gray-900/20' : 'border-[var(--dh-border)] text-gray-400 hover:bg-gray-50'}`}>
            <ImageIcon size={48} className="mb-4 opacity-30" />
            <span className="text-base font-bold">รอการนำเข้าภาพ</span>
            <span className="text-xs mt-1 opacity-50">พื้นที่สำหรับเปรียบเทียบ</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InspectionBay;