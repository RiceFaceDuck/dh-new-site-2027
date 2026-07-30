import { useRef, useEffect } from 'react';
import { PackageX, Search as SearchIcon, Inbox, PlusCircle, Loader2, Camera } from 'lucide-react';

export default function ProductListPanel({
  filteredProducts = [],
  totalFilteredCount = 0,
  hasMore = false,
  loadMore,
  search1, search2, search3, 
  selectedProduct, selectedIndex, handleSelectProduct, getStockStatus, highlightData, HighlightText,
  openReportModal
}) {
  const listRef = useRef(null);

  // Auto-scroll to selected index for keyboard navigation
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Infinite Scroll Handler (Trigger loadMore when scrolled near bottom)
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 100 && hasMore && loadMore) {
      loadMore();
    }
  };

  const totalCount = totalFilteredCount || filteredProducts.length;

  return (
    <div className="w-[32%] min-w-[320px] max-w-[420px] bg-white dark:bg-slate-900 flex flex-col z-10 overflow-hidden shrink-0 transition-colors duration-300">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-dh-border bg-white dark:bg-slate-900 flex justify-between items-center shrink-0 transition-colors duration-300">
        <span className="text-[11px] font-bold text-dh-main flex items-center gap-1.5">
          {(!search1 && !search2 && !search3) ? <><Inbox size={14} className="text-dh-accent" /> สินค้าแนะนำ</> : <><SearchIcon size={14} className="text-dh-accent" /> ผลลัพธ์การค้นหา</>}
        </span>
        <span className="text-dh-muted text-[11px] font-medium">
          {totalCount} รายการ
        </span>
      </div>
      
      {/* Product List with Infinite Scroll */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar" 
        ref={listRef}
        onScroll={handleScroll}
      >
        {filteredProducts.length > 0 ? (
          <>
            {filteredProducts.map((product, index) => {
              const stockStat = getStockStatus(product.stockQuantity, product.bufferStock);
              // Highlight if clicked (selectedProduct) OR if navigated via keyboard (selectedIndex)
              const isSelected = (selectedProduct?.id === product.id) || (selectedIndex === index);
              
              const isOutOfStock = product.stockQuantity <= 0;
              const isLowStock = !isOutOfStock && product.stockQuantity <= (product.bufferStock || 2);

              return (
                <div 
                  key={product.id || product.sku} 
                  onClick={() => handleSelectProduct(product, index)}
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
                        loading="lazy" />
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
                    <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-teal-500 rounded-r-xs"></div>
                  )}
                </div>
              );
            })}

            {/* Bottom Infinite Scroll Status */}
            {hasMore ? (
              <div 
                onClick={loadMore}
                className="p-3 text-center text-[11px] font-extrabold text-dh-accent hover:text-cyan-600 bg-slate-50 dark:bg-slate-800/40 border-b border-dh-border cursor-pointer transition-colors flex items-center justify-center gap-1.5 group/load"
              >
                <Loader2 size={13} className="animate-spin text-dh-accent group-hover/load:scale-110 transition-transform" />
                <span>แสดง {filteredProducts.length} จาก {totalCount} รายการ (เลื่อนลงเพื่อดูเพิ่ม)</span>
              </div>
            ) : (
              <div className="p-2.5 text-center text-[10px] font-bold text-dh-muted/70 bg-slate-50/50 dark:bg-slate-900/50 border-b border-dh-border/50">
                แสดงครบทั้งหมด {totalCount} รายการ
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-dh-muted mb-2 shadow-inner">
              <SearchIcon size={20} className="opacity-60" />
            </div>
            <h3 className="text-[13px] font-bold text-dh-main mb-1">ไม่พบรายการ</h3>
            <p className="text-[11px] text-dh-muted mb-3 max-w-[200px]">
              พบบางสินค้าที่ยังไม่มีวางขายในระบบ?
            </p>
            {openReportModal && (
              <button
                type="button"
                onClick={openReportModal}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all px-3 py-2 rounded-lg ring-1 ring-cyan-400/50 shadow-md active:scale-95 cursor-pointer"
              >
                <PlusCircle size={15} strokeWidth={2.5} />
                <span>แจ้งเพิ่มสินค้า ยังไม่มีขาย</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}