import React from 'react';
import { PackageX, Search as SearchIcon, Inbox } from 'lucide-react';

export default function ProductListPanel({
  filteredProducts, search1, search2, search3, 
  selectedProduct, handleSelectProduct, getStockStatus, highlightData, HighlightText
}) {
  return (
    <div className="w-[32%] min-w-[320px] max-w-[420px] bg-dh-surface rounded-[20px] border border-dh-border flex flex-col z-10 shadow-dh-card overflow-hidden shrink-0 transition-colors duration-300">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-dh-border bg-dh-base/80 flex justify-between items-center shrink-0 transition-colors duration-300">
        <span className="text-[11px] font-extrabold text-dh-muted uppercase tracking-widest flex items-center gap-2">
          {(!search1 && !search2 && !search3) ? <><Inbox size={14} className="text-dh-accent" /> สินค้าแนะนำ</> : <><SearchIcon size={14} className="text-dh-accent" /> ผลลัพธ์</>}
        </span>
        <span className="bg-dh-surface border border-dh-border text-dh-main px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm transition-colors duration-300">
          {filteredProducts.length} รายการ
        </span>
      </div>
      
      {/* Product List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const stockStat = getStockStatus(product.stockQuantity, product.bufferStock);
            const isSelected = selectedProduct?.id === product.id;
            
            // แยก State สินค้าเพื่อจัดการลูกเล่นแสงและสี (Day/Night) ให้ขาดออกจากกัน
            const isOutOfStock = product.stockQuantity <= 0;
            const isLowStock = !isOutOfStock && product.stockQuantity <= (product.bufferStock || 2);

            return (
              <div 
                key={product.id} 
                onClick={() => handleSelectProduct(product)}
                className={`group relative rounded-[16px] p-3 transition-all duration-300 cursor-pointer flex gap-3.5 items-center border
                  ${isSelected 
                    ? 'border-dh-accent bg-dh-accent-light shadow-[0_8px_16px_-6px_var(--dh-accent-light)] ring-1 ring-dh-accent/20 z-10 transform scale-[1.02]' 
                    : isOutOfStock
                      ? 'border-red-100 dark:border-[#502222] bg-red-50/40 dark:bg-[#261818] bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(239,68,68,0.03)_8px,rgba(239,68,68,0.03)_16px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,77,77,0.04)_8px,rgba(255,77,77,0.04)_16px)] hover:border-red-200 dark:hover:border-[#7A2E2E] hover:shadow-sm active:scale-[0.98]'
                      : isLowStock
                        ? 'border-yellow-200/70 dark:border-yellow-700/30 bg-yellow-50/30 dark:bg-yellow-900/10 hover:border-yellow-300 dark:hover:border-yellow-600/50 hover:shadow-sm active:scale-[0.98]'
                        : 'border-transparent hover:border-dh-border hover:bg-dh-base/80 active:scale-[0.98]'
                  }
                `}
              >
                {/* Image Box */}
                <div className={`w-[60px] h-[60px] rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-all duration-300 ${
                  isOutOfStock 
                    ? 'border-red-100 dark:border-[#4A2020] bg-white/60 dark:bg-black/40 group-hover:border-red-200 dark:group-hover:border-[#6A2828]' 
                    : 'border-dh-border bg-dh-surface'
                }`}>
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.sku} 
                      className={`w-full h-full object-contain transition-all duration-500 ${isOutOfStock ? 'opacity-40 grayscale-[80%] dark:brightness-75 group-hover:opacity-100 group-hover:grayscale-[20%] dark:group-hover:brightness-100' : ''}`} 
                    />
                  ) : (
                    <PackageX size={24} className={isOutOfStock ? 'text-red-300 dark:text-red-900/50' : 'text-dh-muted/50'} />
                  )}
                </div>
                
                {/* Info Area */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center mb-1">
                    {/* SKU Badge - หรี่แสงลงเมื่อสินค้าหมด ให้กลืนไปกับความมืด */}
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm border transition-colors ${
                      isOutOfStock 
                        ? 'bg-white/60 dark:bg-[#1A1010] text-red-500 dark:text-[#FF6B6B] border-red-100 dark:border-[#3A1818]' 
                        : 'bg-dh-surface text-dh-muted border-dh-border'
                    }`}>
                      <HighlightText text={product.sku} highlightData={highlightData} />
                    </span>
                  </div>
                  {/* Product Name - สีจางลงเหมือนไฟตก เมื่อของหมด */}
                  <h4 className={`font-extrabold text-[13px] leading-snug truncate transition-colors duration-300 ${
                    isSelected 
                      ? 'text-dh-accent' 
                      : isOutOfStock 
                        ? 'text-red-900/40 dark:text-[#8C7A7A] group-hover:text-red-900/80 dark:group-hover:text-[#D4C3C3]' 
                        : 'text-dh-main group-hover:text-dh-accent'
                  }`}>
                    <HighlightText text={product.name} highlightData={highlightData} />
                  </h4>
                </div>

                {/* Stock Number & Badge */}
                <div className="flex flex-col items-end shrink-0 pl-1">
                  {/* Stock Count - สร้าง Neon Glow Effect สีแดงในที่มืด เมื่อสต๊อกเป็น 0 */}
                  <span className={`text-[26px] font-black tracking-tight leading-none transition-all duration-300 ${
                    isOutOfStock 
                      ? 'text-red-500 dark:text-[#FF3333] dark:drop-shadow-[0_0_12px_rgba(255,51,51,0.6)] group-hover:scale-110 origin-right' 
                      : isLowStock
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {product.stockQuantity}
                  </span>
                  {/* Stock Text Label */}
                  <span className={`text-[9px] font-extrabold uppercase mt-1.5 px-1.5 py-0.5 rounded border transition-colors ${
                    isOutOfStock 
                      ? 'text-red-500 dark:text-[#FF4D4D] border-red-200 dark:border-[#FF4D4D]/30 bg-red-50/50 dark:bg-[#FF4D4D]/10' 
                      : isLowStock
                        ? 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600/50 bg-yellow-50/50 dark:bg-yellow-900/20'
                        : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 bg-dh-surface'
                  }`}>
                    {stockStat.text}
                  </span>
                </div>
                
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-dh-accent rounded-r-full shadow-[0_0_8px_var(--dh-accent-light)]"></div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="py-20 text-center opacity-60">
            <SearchIcon size={32} className="text-dh-muted mx-auto mb-3" />
            <h3 className="text-[15px] font-extrabold text-dh-main">ไม่พบรายการ</h3>
          </div>
        )}
      </div>
    </div>
  );
}