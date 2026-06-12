import React from 'react';
import { MessageSquare, PlusCircle, RefreshCw, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { HighlightText } from '../HighlightText';

export default function ProductDetailComments({
  selectedProduct,
  highlightData,
  showCommentInput,
  setShowCommentInput,
  newComment,
  setNewComment,
  handleAddComment,
  isSubmittingComment,
  combinedComments,
  commentIndex,
  setCommentIndex
}) {
  return (
    <div className="relative pt-3 pb-4 border-b border-dh-border/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold text-dh-muted uppercase tracking-widest flex items-center gap-1.5">
          <MessageSquare size={16} className="opacity-80"/> บันทึก/คอมเมนต์
        </span>
        <button onClick={() => setShowCommentInput(!showCommentInput)} className="text-dh-muted hover:text-dh-main transition-colors active:scale-95 bg-dh-base hover:bg-dh-border/50 px-2 py-1 rounded-md border border-dh-border flex items-center gap-1.5 text-[11px] font-extrabold shadow-sm">
          <PlusCircle size={14}/> เพิ่มโน้ต
        </button>
      </div>
      
      {showCommentInput && (
        <div className="relative mb-3 animate-in fade-in slide-in-from-top-1">
          <input 
            type="text" 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            placeholder="พิมพ์โน้ตส่วนตัว (กด Enter)..."
            className="w-full bg-dh-base border border-dh-border rounded-lg py-2 pl-3 pr-10 text-[13px] outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/10 shadow-sm font-bold text-dh-main transition-all"
            autoFocus
          />
          <button 
            onClick={handleAddComment}
            disabled={isSubmittingComment || !newComment.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-accent hover:bg-dh-accent-light disabled:opacity-50 p-1.5 rounded-md transition-colors"
          >
            {isSubmittingComment ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}
          </button>
        </div>
      )}

      {combinedComments.length > 0 ? (
        <div className="flex items-start gap-2.5 group/comment">
          <div className="flex-1 bg-dh-base/60 p-2.5 rounded-lg border border-dh-border shadow-sm transition-all duration-300 group-hover/comment:border-dh-border/80">
            <span className="text-[10px] font-black bg-dh-main text-dh-surface px-1.5 py-0.5 rounded-md mr-2 inline-block align-middle shadow-sm">
              {combinedComments[commentIndex].isLegacy ? "Legacy" : new Date(combinedComments[commentIndex].timestamp).toLocaleDateString('th-TH')}
            </span>
            {/* ตัวอักษรคอมเมนต์สีม่วงเข้ม ขนาดใหญ่ อ่านง่ายสุดๆ */}
            <span className="text-purple-600 dark:text-[#B190FF] font-extrabold text-[14px] whitespace-pre-wrap leading-relaxed inline-block align-middle">
              <HighlightText text={combinedComments[commentIndex].text} highlightData={highlightData} />
            </span>
          </div>
          {combinedComments.length > 1 && (
            <div className="flex gap-1 items-center shrink-0 bg-dh-surface p-1 rounded-lg border border-dh-border shadow-sm">
              <button disabled={commentIndex === 0} onClick={() => setCommentIndex(commentIndex - 1)} className="p-1 rounded-md text-dh-muted hover:bg-dh-base hover:text-dh-main disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
              <span className="text-[11px] text-dh-main font-black px-1">{commentIndex + 1}/{combinedComments.length}</span>
              <button disabled={commentIndex === combinedComments.length - 1} onClick={() => setCommentIndex(commentIndex + 1)} className="p-1 rounded-md text-dh-muted hover:bg-dh-base hover:text-dh-main disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-1.5">
          <span className="text-dh-muted font-bold text-[11px] bg-dh-base px-2.5 py-1 rounded-md border border-dh-border border-dashed">ยังไม่มี Comment สำหรับสินค้านี้</span>
        </div>
      )}
    </div>
  );
}
