import { Search as SearchIcon, Copy, Settings, Check } from 'lucide-react';
import ProductDetailHeader from './detail/ProductDetailHeader';
import ProductDetailAttributes from './detail/ProductDetailAttributes';

export default function ProductDetailPanel({
  selectedProduct, highlightData, copySuccess, handleCopyChat, 
  showSuffixSettings, setShowSuffixSettings, chatSuffix, handleSaveSuffix,
  setIsImageModalOpen, getStockStatus, 
  isSubmittingKnowledge, submitKnowledge,
  substitutes, handleSelectProduct
}) {

  if (!selectedProduct) {
    return (
      <div className="flex-1 bg-linear-to-b from-white to-slate-50 dark:from-[#1E293B] dark:to-[#0F172A] relative flex flex-col min-h-0 overflow-hidden items-center justify-center p-6">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        </div>

        {/* Premium Empty State Icon */}
        <div className="relative group cursor-default z-10 mb-6">
          <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl scale-110 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative w-24 h-24 bg-white dark:bg-dh-base rounded-2xl shadow-xs border border-slate-100 dark:border-dh-border flex items-center justify-center transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2 group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
            <SearchIcon size={40} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors duration-500" strokeWidth={1.5} />
            
            {/* Sparkle Micro-animation */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          </div>
        </div>

        <h3 className="text-xl font-black text-dh-main tracking-tight z-10">เลือกรายการเพื่อดูรายละเอียด</h3>
        <p className="text-[13px] font-bold text-dh-muted mt-2 max-w-sm mx-auto text-center leading-relaxed z-10">
          พิมพ์คำค้นหาในช่องด้านบน ข้อมูลที่ตรงเงื่อนไขจะแสดงแบบ Real-time โดยไม่ต้องกด Enter
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-[#1E293B] relative flex flex-col min-h-0 overflow-hidden transition-colors duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 relative">
        
        {/* Smart Hover Copy Button */}
        <div className="absolute top-3 right-3 z-20 flex justify-end">
          <div className="group relative flex items-center bg-dh-surface border border-dh-border shadow-xs hover:shadow-dh-elevated rounded-full overflow-hidden transition-all duration-300 w-[36px] hover:w-[150px] h-[36px] cursor-pointer">
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12 z-0 pointer-events-none"></div>
            <div onClick={handleCopyChat} className="flex items-center justify-center w-[36px] h-[36px] shrink-0 text-dh-muted hover:text-dh-accent hover:bg-dh-base transition-colors z-10 relative">
              {copySuccess ? <Check size={16} className="text-emerald-500 scale-110 transition-transform"/> : <Copy size={16} className="group-hover:scale-110 transition-transform" />}
            </div>
            <div onClick={handleCopyChat} className="whitespace-nowrap font-extrabold text-[12px] text-dh-accent opacity-0 group-hover:opacity-100 transition-opacity flex-1 pr-1 relative z-10">
              คัดลอกลงแชต
            </div>
            <div onClick={(e) => { e.stopPropagation(); setShowSuffixSettings(!showSuffixSettings); }} className="w-[36px] h-[36px] shrink-0 flex items-center justify-center border-l border-dh-border text-dh-muted hover:text-dh-main opacity-0 group-hover:opacity-100 transition-colors bg-dh-base hover:bg-dh-border/50 relative z-10">
              <Settings size={14} />
            </div>
          </div>

          {showSuffixSettings && (
            <div className="absolute right-0 top-10 mt-1 flex gap-1 p-1 bg-dh-surface rounded-lg shadow-dh-elevated border border-dh-border z-30 animate-in slide-in-from-top-2">
              <button onClick={() => handleSaveSuffix('ค่ะ')} className={`px-3 py-1 text-[12px] font-black rounded-md transition-colors ${chatSuffix === 'ค่ะ' ? 'bg-dh-accent text-white shadow-xs' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ค่ะ</button>
              <button onClick={() => handleSaveSuffix('ครับ')} className={`px-3 py-1 text-[12px] font-black rounded-md transition-colors ${chatSuffix === 'ครับ' ? 'bg-dh-accent text-white shadow-xs' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ครับ</button>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-1">
          <ProductDetailHeader 
            selectedProduct={selectedProduct} 
            highlightData={highlightData}
            setIsImageModalOpen={setIsImageModalOpen}
            getStockStatus={getStockStatus}
            substitutes={substitutes}
            handleSelectProduct={handleSelectProduct}
          />

          <ProductDetailAttributes 
            selectedProduct={selectedProduct}
            highlightData={highlightData}
            isSubmittingKnowledge={isSubmittingKnowledge}
            submitKnowledge={submitKnowledge}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}