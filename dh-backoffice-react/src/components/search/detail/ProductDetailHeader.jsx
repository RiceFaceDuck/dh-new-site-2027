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
        className="w-40 h-40 md:w-44 md:h-44 aspect-square shrink-0 bg-white dark:bg-dh-base border border-slate-200 dark:border-dh-border rounded-xl p-2 cursor-pointer group relative overflow-hidden shadow-xs transition-all duration-300 hover:shadow-md hover:border-indigo-400 flex items-center justify-center"
        onClick={() => setIsImageModalOpen(true)}
      >
        {selectedProduct.images?.[0] ? (
          <>
            <img src={selectedProduct.images[0]} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105" alt="" loading="lazy" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <Maximize2 size={24} className="text-white drop-shadow-md scale-90 group-hover:scale-100 transition-transform duration-300"/>
            </div>
            {selectedProduct.images.length > 1 && (
              <span className="absolute bottom-1.5 right-1.5 z-10 bg-slate-900/85 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md leading-none flex items-center gap-1 shadow-md border border-cyan-500/30">
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
            className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 py-1 rounded-lg uppercase shadow-xs tracking-wider font-mono cursor-pointer transition-all flex items-center gap-1.5"
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
                <Copy size={12} className="opacity-70 hover:opacity-100" />
              </>
            )}
          </button>
          <span className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border shadow-xs transition-colors ${selectedProduct.stockQuantity <= 0 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800' : selectedProduct.stockQuantity <= (selectedProduct.bufferStock || 2) ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
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
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <RefreshCw size={10} /> ใช้แทนได้:
                </span>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar">
                  {substitutes.map(sub => {
                    const isInactive = sub.isActive === false;
                    return (
                      <div 
                        key={sub.id} 
                        onClick={() => handleSelectProduct(sub)} 
                        className={`px-2 py-1 rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all text-xs shrink-0 ${isInactive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400'}`}
                        title={sub.name}
                      >
                        <span className="font-bold font-mono"><HighlightText text={sub.sku} highlightData={highlightData}/></span>
                        <span className="text-[10px] opacity-75">({sub.stockQuantity})</span>
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
            <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-dh-base dark:text-dh-muted px-2.5 py-1 rounded-lg border border-slate-200 dark:border-dh-border shadow-xs">
              <MapPin size={13} className="text-slate-400"/> {selectedProduct.warehouseLocation}
            </span>
          )}
          <CopyableLinkButton 
            url={displayUrl} 
            label="หน้าเว็บ" 
            defaultIcon={ExternalLink} 
            className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg shadow-xs transition-all hover:-translate-y-px" 
          />
          {selectedProduct.externalLinks?.shopee && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.shopee} 
              label="Shopee" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 bg-[#ee4d2d]/10 text-[#ee4d2d] rounded-lg border border-[#ee4d2d]/20 hover:bg-[#ee4d2d]/20 transition-all shadow-xs hover:-translate-y-px" 
            />
          )}
          {selectedProduct.externalLinks?.lazada && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.lazada} 
              label="Lazada" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 bg-[#0f136d]/10 text-[#0f136d] dark:bg-[#2A2D8E]/30 dark:text-[#888DF2] rounded-lg border border-[#0f136d]/20 dark:border-[#888DF2]/30 hover:bg-[#0f136d]/20 transition-all shadow-xs hover:-translate-y-px" 
            />
          )}
          {selectedProduct.externalLinks?.tiktok && (
            <CopyableLinkButton 
              url={selectedProduct.externalLinks.tiktok} 
              label="TikTok" 
              defaultIcon={ExternalLink} 
              className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg border border-slate-800 transition-all shadow-xs hover:-translate-y-px" 
            />
          )}
        </div>
      </div>
    </div>
  );
}
