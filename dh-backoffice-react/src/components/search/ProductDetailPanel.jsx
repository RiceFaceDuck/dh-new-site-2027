import React from 'react';
import { Search as SearchIcon, Copy, Settings, Check, Info } from 'lucide-react';
import ProductDetailHeader from './detail/ProductDetailHeader';
import ProductDetailComments from './detail/ProductDetailComments';
import ProductDetailAttributes from './detail/ProductDetailAttributes';
import ProductDetailSubstitutes from './detail/ProductDetailSubstitutes';

export default function ProductDetailPanel({
  selectedProduct, highlightData, copySuccess, handleCopyChat, 
  showSuffixSettings, setShowSuffixSettings, chatSuffix, handleSaveSuffix,
  setIsImageModalOpen, getStockStatus, showCommentInput, setShowCommentInput,
  newComment, setNewComment, handleAddComment, isSubmittingComment,
  combinedComments, commentIndex, setCommentIndex, isSubmittingKnowledge, submitKnowledge,
  substitutes, handleSelectProduct
}) {

  if (!selectedProduct) {
    return (
      <div className="flex-1 bg-white dark:bg-[#1E293B] relative flex flex-col min-h-0 overflow-hidden items-center justify-center p-6">
        <div className="w-20 h-20 bg-dh-surface rounded-xl shadow-sm border border-dh-border flex items-center justify-center mb-4 group transition-all duration-500 hover:shadow-dh-elevated hover:-translate-y-1">
          <SearchIcon size={36} className="text-dh-muted opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-black text-dh-main tracking-tight">เลือกรายการเพื่อดูรายละเอียด</h3>
        <p className="text-[13px] font-bold text-dh-muted mt-2 max-w-sm mx-auto text-center leading-relaxed">
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
          <div className="group relative flex items-center bg-dh-surface border border-dh-border shadow-sm hover:shadow-dh-elevated rounded-full overflow-hidden transition-all duration-300 w-[36px] hover:w-[150px] h-[36px] cursor-pointer">
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12 z-0 pointer-events-none"></div>
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
              <button onClick={() => handleSaveSuffix('ค่ะ')} className={`px-3 py-1 text-[12px] font-black rounded-md transition-colors ${chatSuffix === 'ค่ะ' ? 'bg-dh-accent text-white shadow-sm' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ค่ะ</button>
              <button onClick={() => handleSaveSuffix('ครับ')} className={`px-3 py-1 text-[12px] font-black rounded-md transition-colors ${chatSuffix === 'ครับ' ? 'bg-dh-accent text-white shadow-sm' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ครับ</button>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-1">
          <ProductDetailHeader 
            selectedProduct={selectedProduct} 
            highlightData={highlightData}
            setIsImageModalOpen={setIsImageModalOpen}
            getStockStatus={getStockStatus}
          />
          
          <ProductDetailComments 
            selectedProduct={selectedProduct}
            highlightData={highlightData}
            showCommentInput={showCommentInput}
            setShowCommentInput={setShowCommentInput}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={handleAddComment}
            isSubmittingComment={isSubmittingComment}
            combinedComments={combinedComments}
            commentIndex={commentIndex}
            setCommentIndex={setCommentIndex}
          />

          <ProductDetailAttributes 
            selectedProduct={selectedProduct}
            highlightData={highlightData}
            isSubmittingKnowledge={isSubmittingKnowledge}
            submitKnowledge={submitKnowledge}
          />

          <ProductDetailSubstitutes 
            substitutes={substitutes}
            handleSelectProduct={handleSelectProduct}
            highlightData={highlightData}
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