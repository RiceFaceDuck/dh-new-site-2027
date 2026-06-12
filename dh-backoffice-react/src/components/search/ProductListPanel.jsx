import React from 'react';
import { PackageX, Search as SearchIcon, Inbox } from 'lucide-react';

export default function ProductListPanel({
  filteredProducts, search1, search2, search3, 
  selectedProduct, handleSelectProduct, getStockStatus, highlightData, HighlightText
}) {
  return (
    <div className="w-[32%] min-w-[320px] max-w-[420px] bg-white dark:bg-slate-900 flex flex-col z-10 overflow-hidden shrink-0 transition-colors duration-300">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-dh-border bg-white dark:bg-slate-900 flex justify-between items-center shrink-0 transition-colors duration-300">
        <span className="text-[11px] font-bold text-dh-main flex items-center gap-1.5">
          {(!search1 && !search2 && !search3) ? <><Inbox size={14} className="text-dh-accent" /> สินค้าแนะนำ</> : <><SearchIcon size={14} className="text-dh-accent" /> ผลลัพธ์การค้นหา</>}
        </span>
        <span className="text-dh-muted text-[11px] font-medium">
          {filteredProducts.length} รายการ
        </span>
      </div>
      
      {/* Product List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const stockStat = getStockStatus(product.stockQuantity, product.bufferStock);
            const isSelected = selectedProduct?.id === product.id;
            
            const isOutOfStock = product.stockQuantity <= 0;
            const isLowStock = !isOutOfStock && product.stockQuantity <= (product.bufferStock || 2);

            return (
              <div 
                key={product.id} 
                onClick={() => handleSelectProduct(product)}
                className={`group relative p-3 transition-colors duration-150 cursor-pointer flex gap-3 items-center border-b border-dh-border
                  ${isSelected 
                    ? 'bg-[#E6F4F1] dark:bg-teal-900/30' 
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }
                `}
              >
                {/* Image Box */}
                <div className="w-[42px] h-[42px] flex items-center justify-center shrink-0 overflow-hidden bg-transparent">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.sku} 
                      className={`w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-opacity duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''}`} 
                    />
                  ) : (
                    <PackageX size={20} className={isOutOfStock ? 'text-red-300/50' : 'text-dh-muted/30'} />
                  )}
                </div>
                
                {/* Info Area */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center mb-0.5">
                    {/* SKU */}
                    <span className={`text-[12px] font-black uppercase tracking-wider ${
                      isOutOfStock ? 'text-red-500' : 'text-dh-main'
                    }`}>
                      <HighlightText text={product.sku} highlightData={highlightData} />
                    </span>
                  </div>
                  {/* Product Name */}
                  <h4 className={`font-semibold text-[11px] leading-snug truncate ${
                      isOutOfStock ? 'text-dh-muted' : 'text-dh-main'
                  }`}>
                    <HighlightText text={product.name} highlightData={highlightData} />
                  </h4>
                </div>

                {/* Stock Number & Badge */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  {/* Stock Count */}
                  <span className={`text-[16px] font-black tracking-tight leading-none ${
                    isOutOfStock 
                      ? 'text-red-500' 
                      : isLowStock
                        ? 'text-yellow-600'
                        : 'text-emerald-600'
                  }`}>
                    {product.stockQuantity}
                  </span>
                  {/* Stock Text Label */}
                  <span className={`text-[9px] font-bold mt-1.5 flex items-center gap-0.5 ${
                    isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-emerald-600'
                  }`}>
                    {stockStat.text}
                  </span>
                </div>
                
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500"></div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="py-12 text-center opacity-60">
            <SearchIcon size={24} className="text-dh-muted mx-auto mb-2" />
            <h3 className="text-[13px] font-bold text-dh-main">ไม่พบรายการ</h3>
          </div>
        )}
      </div>
    </div>
  );
}