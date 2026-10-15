import { useState } from 'react';
import { PackageX, Maximize2, AlertCircle, Box, MapPin, ExternalLink, RefreshCw, Camera, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { HighlightText } from '../HighlightText';
import CopyableLinkButton from '../../common/CopyableLinkButton';

export default function ProductDetailHeader({
  selectedProduct,
  highlightData,
  setIsImageModalOpen,
  getStockStatus,
  substitutes,
  handleSelectProduct
}) {
  const [copiedSku, setCopiedSku] = useState(false);
  const stockStat = getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock);

  const handleCopySku = (e) => {
    e.stopPropagation();
    if (selectedProduct?.sku) {
      navigator.clipboard.writeText(selectedProduct.sku);
      toast.success(`คัดลอกรหัส ${selectedProduct.sku} เรียบร้อย!`);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 1500);
    }
  };

  const getFrontendUrl = (sku) => {
    if (!sku) return '';
    return `https://dh-notebook-frontend.web.app/product/${sku}`;
  };
  
  const autoUrl = getFrontendUrl(selectedProduct.sku);
  const displayUrl = selectedProduct.landingPageUrl || autoUrl;

  return (
    <div className="flex gap-4 items-start pb-4 relative border-b border-dh-border/60">
      <div 
        className="w-40 h-40 md:w-44 md:h-44 aspect-square shrink-0 bg-white dark:bg-dh-base border-2 border-slate-300 dark:border-dh-border rounded-[0.1rem] p-2 cursor-pointer group relative overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 flex items-center justify-center"
        onClick={() => setIsImageModalOpen(true)}
      >
        {selectedProduct.images?.[0] ? (
          <>
            <img src={selectedProduct.images[0]} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105" alt="" loading="lazy" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <Maximize2 size={24} className="text-white drop-shadow-md scale-90 group-hover:scale-100 transition-transform duration-300"/>
            </div>
            {selectedProduct.images.length > 1 && (
              <span className="absolute bottom-1.5 right-1.5 z-10 bg-slate-900/90 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md leading-none flex items-center gap-1 shadow-md border-2 border-cyan-500/50">
                <Camera size={11} /> {selectedProduct.images.length} ภาพ
              </span>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-dh-border"><PackageX size={40}/></div>
        )}
      </div>
      
      <div className="flex-1 pt-0.5 flex flex-col justify-between">
        {/* Badges Bar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button 
            type="button"
            onClick={handleCopySku}
            className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 py-1 rounded-lg uppercase shadow-sm tracking-wider font-mono cursor-pointer transition-all flex items-center gap-1.5 border-2 border-indigo-800"
            title="คลิกเพื่อคัดลอกรหัส SKU"
          >
            {copiedSku ? (
              <>
                <Check size={13} className="text-emerald-300 stroke-[3]" />
                <span className="text-emerald-200">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <HighlightText text={selectedProduct.sku} highlightData={highlightData} />
                <Copy size={12} className="opacity-80 hover:opacity-100" />
              </>
            )}
          </button>
          <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg border-2 shadow-xs transition-colors ${selectedProduct.stockQuantity <= 0 ? 'bg-red-50 text-red-800 border-red-500 dark:bg-red-950/40 dark:text-red-300 dark:border-red-600' : selectedProduct.stockQuantity <= (selectedProduct.bufferStock || 2) ? 'bg-amber-50 text-amber-900 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600' : 'bg-emerald-50 text-emerald-900 border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600'}`}>
            {selectedProduct.stockQuantity <= 0 ? <AlertCircle size={13}/> : <Box size={13}/>} 
            {stockStat.text} ({selectedProduct.stockQuantity})
          </span>
        </div>

        {/* Product Title (1 line max with truncation) */}
        <h2 className="text-lg font-black text-slate-900 dark:text-dh-main leading-snug tracking-tight mb-3 truncate" title={selectedProduct.name}>
          <HighlightText text={selectedProduct.name} highlightData={highlightData} />
        </h2>
        
        {/* Focus ราคาส่ง & ราคาปลีก (Top Aligned Style) */}
        <div className="flex items-start gap-5 mt-2 flex-wrap">
          <div className="flex flex-col group/price">
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">ราคาส่ง (WHOLESALE)</span>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none font-mono">฿{selectedProduct.Price?.toLocaleString() || '0.00'}</div>
          </div>
          <div className="h-12 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full shrink-0 my-0.5"></div>
          <div className="flex flex-col shrink-0">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">ราคาปลีก (RETAIL)</span>
            <div className="text-2xl font-black text-slate-500 dark:text-slate-400 leading-none font-mono">฿{selectedProduct.retailPrice?.toLocaleString() || '0.00'}</div>
          </div>
          
          {substitutes && substitutes.length > 0 && (
            <>
              <div className="h-8 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full mx-1 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <RefreshCw size={10} /> ใช้แทนได้:
                </span>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar">
                  {substitutes.map(sub => {
                    const isInactive = sub.isActive === false;
                    return (
                      <div 
                        key={sub.id} 
                        onClick={() => handleSelectProduct(sub)} 
                        className={`px-2.5 py-1 rounded-lg border-2 cursor-pointer flex items-center gap-1.5 transition-all text-xs shrink-0 font-bold ${isInactive ? 'bg-red-100 text-red-900 border-red-500' : 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200 shadow-xs'}`}
                        title={sub.name}
                      >
                        <span className="font-black font-mono"><HighlightText text={sub.sku} highlightData={highlightData}/></span>
                        <span className="text-[10px] font-black">({sub.stockQuantity})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {selectedProduct.warehouseLocation && (
            <span className="flex items-center gap-1 text-[11px] font-black bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1 rounded-lg border-2 border-slate-400 dark:border-slate-600 shadow-xs">
              <MapPin size={13} className="text-slate-600 dark:text-slate-300"/> {selectedProduct.warehouseLocation}
            </span>
          )}
          <CopyableLinkButton 
            url={displayUrl} 
            label="หน้าเว็บ" 
            defaultIcon={ExternalLink} 
            className="flex items-center gap-1 text-[11px] font-black bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-800 px-2.5 py-1 rounded-lg shadow-sm transition-all hover:-translate-y-px cursor-pointer" 
          />
          {selectedProduct.externalLinks?.shopee && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.shopee} 
              label="Shopee" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 bg-[#ee4d2d] hover:bg-[#d83f21] text-white rounded-lg border-2 border-[#b5351c] transition-all shadow-sm hover:-translate-y-px cursor-pointer" 
            />
          )}
          {selectedProduct.externalLinks?.lazada && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.lazada} 
              label="Lazada" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 bg-[#0f136d] hover:bg-[#1a1e8a] text-white rounded-lg border-2 border-[#090b42] transition-all shadow-sm hover:-translate-y-px cursor-pointer" 
            />
          )}
          {selectedProduct.externalLinks?.tiktok && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.tiktok} 
              label="TikTok" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg border-2 border-slate-700 transition-all shadow-sm hover:-translate-y-px cursor-pointer" 
            />
          )}
        </div>
      </div>
    </div>
  );
}
