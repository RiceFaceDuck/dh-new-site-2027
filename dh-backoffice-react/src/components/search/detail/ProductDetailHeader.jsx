import React from 'react';
import { PackageX, Maximize2, AlertCircle, Box, MapPin, ExternalLink, RefreshCw } from 'lucide-react';
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
  const stockStat = getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock);

  const getFrontendUrl = (sku) => {
    if (!sku) return '';
    return `https://dh-notebook-frontend.web.app/product/${sku}`;
  };
  
  const autoUrl = getFrontendUrl(selectedProduct.sku);
  const displayUrl = selectedProduct.landingPageUrl || autoUrl;

  return (
    <div className="flex gap-4 items-start pb-4 relative border-b border-dh-border/60">
      <div 
        className="w-28 h-28 shrink-0 bg-dh-base border border-dh-border rounded-lg p-2 cursor-pointer group relative overflow-hidden shadow-xs transition-all duration-300 hover:shadow-dh-card hover:border-dh-accent/40"
        onClick={() => setIsImageModalOpen(true)}
      >
        {selectedProduct.images?.[0] ? (
          <>
            <img src={selectedProduct.images[0]} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110" alt=""  loading="lazy" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <Maximize2 size={24} className="text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform duration-300"/>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dh-border"><PackageX size={32}/></div>
        )}
      </div>
      
      <div className="flex-1 pt-1 pr-14">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[13px] font-black bg-dh-main text-dh-surface px-2.5 py-0.5 rounded-md uppercase shadow-xs tracking-wide">
            <HighlightText text={selectedProduct.sku} highlightData={highlightData} />
          </span>
          {selectedProduct.warehouseLocation && (
            <span className="flex items-center gap-1 text-[11px] font-extrabold bg-dh-base text-dh-muted px-2 py-0.5 rounded-md border border-dh-border shadow-xs">
              <MapPin size={12}/> {selectedProduct.warehouseLocation}
            </span>
          )}
          <span className={`flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border shadow-xs transition-colors ${selectedProduct.stockQuantity <= 0 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : selectedProduct.stockQuantity <= (selectedProduct.bufferStock || 2) ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
            {selectedProduct.stockQuantity <= 0 ? <AlertCircle size={14}/> : <Box size={14}/>} 
            {stockStat.text} ({selectedProduct.stockQuantity})
          </span>

          <CopyableLinkButton 
            url={displayUrl} 
            label="หน้าเว็บ" 
            defaultIcon={ExternalLink} 
            className="flex items-center gap-1 text-[11px] font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md shadow-xs transition-all hover:-translate-y-px" 
          />
        </div>
        <h2 className="text-lg font-black text-dh-main leading-snug">
          <HighlightText text={selectedProduct.name} highlightData={highlightData} />
        </h2>
        
        {/* Focus ราคาส่ง */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex flex-col group/price">
            <span className="text-[10px] font-extrabold text-dh-accent uppercase tracking-widest mb-0.5 opacity-90 transition-opacity">ราคาส่ง (Wholesale)</span>
            <div className="text-3xl font-black text-dh-accent leading-none drop-shadow-xs dark:drop-shadow-[0_0_12px_var(--dh-accent-light)] transition-all duration-300 group-hover/price:scale-105 origin-left">฿{selectedProduct.Price?.toLocaleString() || '0.00'}</div>
          </div>
          <div className="h-8 w-[2px] bg-dh-border/60 rounded-full"></div>
          <div className="flex flex-col justify-end pb-0.5 shrink-0">
            <span className="text-[10px] font-extrabold text-dh-muted uppercase tracking-widest mb-0.5">ราคาปลีก (Retail)</span>
            <div className="text-base font-bold text-dh-muted leading-none">฿{selectedProduct.retailPrice?.toLocaleString() || '0.00'}</div>
          </div>
          
          {substitutes && substitutes.length > 0 && (
            <>
              <div className="h-8 w-[2px] bg-dh-border/60 rounded-full mx-2 hidden md:block"></div>
              <div className="flex-1 flex flex-col items-start min-w-0">
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                  <RefreshCw size={10} /> ใช้แทนได้
                </span>
                <div className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-1">
                  {substitutes.map(sub => {
                    const isInactive = sub.isActive === false;
                    return (
                      <div 
                        key={sub.id} 
                        onClick={() => handleSelectProduct(sub)} 
                        className={`group/sub px-2.5 py-1.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all duration-300 shrink-0 hover:shadow-xs hover:-translate-y-px ${isInactive ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 hover:border-orange-400'}`}
                        title={sub.name}
                      >
                        <div className="flex flex-col">
                          <div className={`font-black text-[12px] leading-tight ${isInactive ? 'text-red-500 line-through' : 'text-orange-700 dark:text-orange-400 group-hover/sub:text-orange-600'}`}>
                            <HighlightText text={sub.sku} highlightData={highlightData}/>
                          </div> 
                          {isInactive && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded-sm w-fit mt-0.5">เลิกขาย</span>}
                        </div>
                        <span className={`text-[10px] font-black border px-1.5 py-0.5 rounded-md shadow-xs ${isInactive ? 'bg-white text-red-400 border-red-200' : 'bg-white dark:bg-dh-surface text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'}`}>
                          มี {sub.stockQuantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
