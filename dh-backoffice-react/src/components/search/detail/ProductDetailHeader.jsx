import React from 'react';
import { PackageX, Maximize2, AlertCircle, Box, MapPin } from 'lucide-react';
import { HighlightText } from '../HighlightText';

export default function ProductDetailHeader({
  selectedProduct,
  highlightData,
  setIsImageModalOpen,
  getStockStatus
}) {
  const stockStat = getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock);

  return (
    <div className="flex gap-4 items-start pb-4 relative border-b border-dh-border/60">
      <div 
        className="w-28 h-28 shrink-0 bg-dh-base border border-dh-border rounded-lg p-2 cursor-pointer group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-dh-card hover:border-dh-accent/40"
        onClick={() => setIsImageModalOpen(true)}
      >
        {selectedProduct.images?.[0] ? (
          <>
            <img src={selectedProduct.images[0]} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110" alt="" />
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
          <span className="text-[13px] font-black bg-dh-main text-dh-surface px-2.5 py-0.5 rounded-md uppercase shadow-sm tracking-wide">
            <HighlightText text={selectedProduct.sku} highlightData={highlightData} />
          </span>
          {selectedProduct.warehouseLocation && (
            <span className="flex items-center gap-1 text-[11px] font-extrabold bg-dh-base text-dh-muted px-2 py-0.5 rounded-md border border-dh-border shadow-sm">
              <MapPin size={12}/> {selectedProduct.warehouseLocation}
            </span>
          )}
          <span className={`flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border shadow-sm transition-colors ${stockStat.stock <= 0 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : stockStat.stock <= (selectedProduct.bufferStock || 2) ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
            {stockStat.stock <= 0 ? <AlertCircle size={14}/> : <Box size={14}/>} 
            {stockStat.text} ({selectedProduct.stockQuantity})
          </span>
        </div>
        <h2 className="text-lg font-black text-dh-main leading-snug">
          <HighlightText text={selectedProduct.name} highlightData={highlightData} />
        </h2>
        
        {/* Focus ราคาส่ง */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex flex-col group/price">
            <span className="text-[10px] font-extrabold text-dh-accent uppercase tracking-widest mb-0.5 opacity-90 transition-opacity">ราคาส่ง (Wholesale)</span>
            <div className="text-3xl font-black text-dh-accent leading-none drop-shadow-sm dark:drop-shadow-[0_0_12px_var(--dh-accent-light)] transition-all duration-300 group-hover/price:scale-105 origin-left">฿{selectedProduct.Price?.toLocaleString() || '0.00'}</div>
          </div>
          <div className="h-8 w-[2px] bg-dh-border/60 rounded-full"></div>
          <div className="flex flex-col justify-end pb-0.5">
            <span className="text-[10px] font-extrabold text-dh-muted uppercase tracking-widest mb-0.5">ราคาปลีก (Retail)</span>
            <div className="text-base font-bold text-dh-muted leading-none">฿{selectedProduct.retailPrice?.toLocaleString() || '0.00'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
