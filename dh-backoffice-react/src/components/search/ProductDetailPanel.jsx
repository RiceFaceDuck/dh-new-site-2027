import React from 'react';
import { 
  Search as SearchIcon, ExternalLink, PlusCircle, AlertCircle, 
  PackageX, Link as LinkIcon, Box, Copy, Settings, Check, 
  MessageSquare, Send, ChevronLeft, ChevronRight, Maximize2, RefreshCw, MapPin
} from 'lucide-react';

export default function ProductDetailPanel({
  selectedProduct, highlightData, copySuccess, handleCopyChat, 
  showSuffixSettings, setShowSuffixSettings, chatSuffix, handleSaveSuffix,
  setIsImageModalOpen, getStockStatus, showCommentInput, setShowCommentInput,
  newComment, setNewComment, handleAddComment, isSubmittingComment,
  combinedComments, commentIndex, setCommentIndex, isSubmittingKnowledge, submitKnowledge,
  substitutes, handleSelectProduct, HighlightText
}) {

  if (!selectedProduct) {
    return (
      <div className="flex-1 bg-dh-surface rounded-2xl border border-dh-border shadow-dh-card relative flex flex-col min-h-0 overflow-hidden items-center justify-center p-10 bg-dh-base/50">
        <div className="w-24 h-24 bg-dh-surface rounded-3xl shadow-sm border border-dh-border flex items-center justify-center mb-6 group transition-all duration-500 hover:shadow-dh-elevated hover:-translate-y-2">
          <SearchIcon size={44} className="text-dh-muted opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-black text-dh-main tracking-tight">เลือกรายการเพื่อดูรายละเอียด</h3>
        <p className="text-[15px] font-bold text-dh-muted mt-3 max-w-sm mx-auto text-center leading-relaxed">
          พิมพ์คำค้นหาในช่องด้านบน ข้อมูลที่ตรงเงื่อนไขจะแสดงแบบ Real-time โดยไม่ต้องกด Enter
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-dh-surface rounded-2xl border border-dh-border shadow-dh-card relative flex flex-col min-h-0 overflow-hidden transition-colors duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 relative">
        
        {/* Smart Hover Copy Button (เสถียร 100% + ลูกเล่นแสงวิ่ง) */}
        <div className="absolute top-4 right-4 z-20 flex justify-end">
          <div className="group relative flex items-center bg-dh-surface border border-dh-border shadow-sm hover:shadow-dh-elevated rounded-full overflow-hidden transition-all duration-300 w-[40px] hover:w-[165px] h-[40px] cursor-pointer">
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12 z-0 pointer-events-none"></div>
            <div onClick={handleCopyChat} className="flex items-center justify-center w-[40px] h-[40px] shrink-0 text-dh-muted hover:text-dh-accent hover:bg-dh-base transition-colors z-10 relative">
              {copySuccess ? <Check size={18} className="text-emerald-500 scale-110 transition-transform"/> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
            </div>
            <div onClick={handleCopyChat} className="whitespace-nowrap font-extrabold text-[13px] text-dh-accent opacity-0 group-hover:opacity-100 transition-opacity flex-1 pr-1 relative z-10">
              คัดลอกลงแชต
            </div>
            <div onClick={(e) => { e.stopPropagation(); setShowSuffixSettings(!showSuffixSettings); }} className="w-[40px] h-[40px] shrink-0 flex items-center justify-center border-l border-dh-border text-dh-muted hover:text-dh-main opacity-0 group-hover:opacity-100 transition-colors bg-dh-base hover:bg-dh-border/50 relative z-10">
              <Settings size={16} />
            </div>
          </div>

          {showSuffixSettings && (
            <div className="absolute right-0 top-12 mt-1 flex gap-1.5 p-1.5 bg-dh-surface rounded-xl shadow-dh-elevated border border-dh-border z-30 animate-in slide-in-from-top-2">
              <button onClick={() => handleSaveSuffix('ค่ะ')} className={`px-4 py-1.5 text-[13px] font-black rounded-lg transition-colors ${chatSuffix === 'ค่ะ' ? 'bg-dh-accent text-white shadow-sm' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ค่ะ</button>
              <button onClick={() => handleSaveSuffix('ครับ')} className={`px-4 py-1.5 text-[13px] font-black rounded-lg transition-colors ${chatSuffix === 'ครับ' ? 'bg-dh-accent text-white shadow-sm' : 'bg-transparent text-dh-muted hover:bg-dh-base'}`}>ครับ</button>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Header Info - เพิ่มความชัดเจนของ Font 1 ระดับ */}
          <div className="flex gap-5 items-start pb-5 relative border-b border-dh-border/60">
            <div 
              className="w-32 h-32 shrink-0 bg-dh-base border border-dh-border rounded-2xl p-2 cursor-pointer group relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-dh-card hover:border-dh-accent/40"
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
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                <span className="text-[13px] font-black bg-dh-main text-dh-surface px-3 py-0.5 rounded-md uppercase shadow-sm tracking-wide">
                  <HighlightText text={selectedProduct.sku} highlightData={highlightData} />
                </span>
                {selectedProduct.warehouseLocation && (
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold bg-dh-base text-dh-muted px-2.5 py-1 rounded-md border border-dh-border shadow-sm">
                    <MapPin size={12}/> {selectedProduct.warehouseLocation}
                  </span>
                )}
                <span className={`flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-md border shadow-sm transition-colors ${getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock).stock <= 0 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock).stock <= (selectedProduct.bufferStock || 2) ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                  {getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock).stock <= 0 ? <AlertCircle size={14}/> : <Box size={14}/>} 
                  {getStockStatus(selectedProduct.stockQuantity, selectedProduct.bufferStock).text} ({selectedProduct.stockQuantity})
                </span>
              </div>
              <h2 className="text-[20px] font-black text-dh-main leading-snug">
                <HighlightText text={selectedProduct.name} highlightData={highlightData} />
              </h2>
              
              {/* Focus ราคาส่ง */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col group/price">
                  <span className="text-[11px] font-extrabold text-dh-accent uppercase tracking-widest mb-1 opacity-90 transition-opacity">ราคาส่ง (Wholesale)</span>
                  <div className="text-[38px] font-black text-dh-accent leading-none drop-shadow-sm dark:drop-shadow-[0_0_12px_var(--dh-accent-light)] transition-all duration-300 group-hover/price:scale-105 origin-left">฿{selectedProduct.Price?.toLocaleString() || '0.00'}</div>
                </div>
                <div className="h-10 w-[2px] bg-dh-border/60 rounded-full"></div>
                <div className="flex flex-col justify-end pb-1">
                  <span className="text-[11px] font-extrabold text-dh-muted uppercase tracking-widest mb-1">ราคาปลีก (Retail)</span>
                  <div className="text-lg font-bold text-dh-muted leading-none">฿{selectedProduct.retailPrice?.toLocaleString() || '0.00'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 💜 Comment Section - แก้ไขให้เฉพาะข้อความเป็นสีม่วง */}
          <div className="relative pt-3 pb-5 border-b border-dh-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-dh-muted uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={16} className="opacity-80"/> บันทึก/คอมเมนต์
              </span>
              <button onClick={() => setShowCommentInput(!showCommentInput)} className="text-dh-muted hover:text-dh-main transition-colors active:scale-95 bg-dh-base hover:bg-dh-border/50 px-2.5 py-1.5 rounded-lg border border-dh-border flex items-center gap-1.5 text-[11px] font-extrabold shadow-sm">
                <PlusCircle size={14}/> เพิ่มโน้ต
              </button>
            </div>
            
            {showCommentInput && (
              <div className="relative mb-4 animate-in fade-in slide-in-from-top-1">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="พิมพ์โน้ตส่วนตัว (กด Enter)..."
                  className="w-full bg-dh-base border border-dh-border rounded-xl py-2.5 pl-4 pr-10 text-[13px] outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/10 shadow-sm font-bold text-dh-main transition-all"
                  autoFocus
                />
                <button 
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-dh-accent hover:bg-dh-accent-light disabled:opacity-50 p-1.5 rounded-lg transition-colors"
                >
                  {isSubmittingComment ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}
                </button>
              </div>
            )}

            {combinedComments.length > 0 ? (
              <div className="flex items-start gap-3 group/comment">
                <div className="flex-1 bg-dh-base/60 p-3 rounded-xl border border-dh-border shadow-sm transition-all duration-300 group-hover/comment:border-dh-border/80">
                  <span className="text-[10px] font-black bg-dh-main text-dh-surface px-2 py-0.5 rounded mr-2 inline-block align-middle shadow-sm">
                    {combinedComments[commentIndex].isLegacy ? "Legacy" : new Date(combinedComments[commentIndex].timestamp).toLocaleDateString('th-TH')}
                  </span>
                  {/* ตัวอักษรคอมเมนต์สีม่วงเข้ม ขนาดใหญ่ อ่านง่ายสุดๆ */}
                  <span className="text-purple-600 dark:text-[#B190FF] font-extrabold text-[15px] whitespace-pre-wrap leading-relaxed inline-block align-middle">
                    <HighlightText text={combinedComments[commentIndex].text} highlightData={highlightData} />
                  </span>
                </div>
                {combinedComments.length > 1 && (
                  <div className="flex gap-1.5 items-center shrink-0 bg-dh-surface p-1.5 rounded-xl border border-dh-border shadow-sm">
                    <button disabled={commentIndex === 0} onClick={() => setCommentIndex(commentIndex - 1)} className="p-1 rounded-lg text-dh-muted hover:bg-dh-base hover:text-dh-main disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
                    <span className="text-[11px] text-dh-main font-black px-1">{commentIndex + 1}/{combinedComments.length}</span>
                    <button disabled={commentIndex === combinedComments.length - 1} onClick={() => setCommentIndex(commentIndex + 1)} className="p-1 rounded-lg text-dh-muted hover:bg-dh-base hover:text-dh-main disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <span className="text-dh-muted font-bold text-[11px] bg-dh-base px-3 py-1.5 rounded-lg border border-dh-border border-dashed">ยังไม่มี Comment สำหรับสินค้านี้</span>
              </div>
            )}
          </div>

          {/* Attributes Detail - เพิ่มลูกเล่น Hover ให้สายตาตามบรรทัดได้ง่ายขึ้น */}
          <div className="grid grid-cols-[110px_1fr] gap-y-2 pt-2">
            
            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-3 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">จุดสังเกต</div>
              <div className="font-bold text-dh-accent text-[13px] bg-dh-accent-light p-3 rounded-xl border border-dh-accent/20 whitespace-pre-wrap my-1 transition-colors group-hover/row:border-dh-accent/40 group-hover/row:shadow-sm">
                {selectedProduct.shortDescription ? <HighlightText text={selectedProduct.shortDescription} highlightData={highlightData} /> : <span className="text-dh-muted font-medium">ไม่มีข้อมูลระบุ</span>}
              </div>
            </div>

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-3 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">รายละเอียด</div>
              <div className="font-bold text-dh-main text-[13px] whitespace-pre-wrap leading-relaxed py-2.5 px-3 rounded-xl transition-colors group-hover/row:bg-dh-base/40">
                {selectedProduct.description ? <HighlightText text={selectedProduct.description} highlightData={highlightData} /> : '-'}
              </div>
            </div>

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">แบรนด์ / หมวดหมู่</div>
              <div className="font-black text-dh-main text-[13px] py-1.5 px-3 rounded-xl transition-colors group-hover/row:bg-dh-base/40">
                {selectedProduct.brand || '-'} <span className="text-dh-border mx-2">|</span> {selectedProduct.category || '-'}
              </div>
            </div>

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">โมเดลที่ขายอยู่</div>
              <div className="font-black text-red-500 text-[13px] py-1.5 px-3 rounded-xl transition-colors group-hover/row:bg-red-50 dark:group-hover/row:bg-red-900/10">
                {selectedProduct.sellingModel ? <HighlightText text={selectedProduct.sellingModel} highlightData={highlightData} /> : <span className="text-dh-muted">n/a</span>}
              </div>
            </div>

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-3 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40 flex flex-col items-start gap-1.5">
                Compatible
                <button type="button" disabled={isSubmittingKnowledge} onClick={(e) => submitKnowledge(e, 'model')} className="text-dh-main hover:text-dh-accent disabled:opacity-50 transition-colors flex items-center gap-1 bg-dh-surface px-2 py-1 rounded-md border border-dh-border shadow-sm active:scale-95">
                  {isSubmittingKnowledge ? <RefreshCw size={12} className="animate-spin" /> : <PlusCircle size={12}/>} <span className="text-[10px] font-bold">เพิ่มรุ่น</span>
                </button>
              </div>
              <div className="font-bold text-dh-main text-[13px] bg-dh-base p-3 rounded-xl border border-dh-border min-h-[44px] my-1 transition-all group-hover/row:shadow-sm group-hover/row:border-dh-border/80">
                {selectedProduct.compatibleModels?.length ? <HighlightText text={selectedProduct.compatibleModels} highlightData={highlightData} /> : <span className="text-dh-muted italic font-medium">n/a</span>}
              </div>
            </div>

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-3 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40 flex flex-col items-start gap-1.5">
                Part No.
                <button type="button" disabled={isSubmittingKnowledge} onClick={(e) => submitKnowledge(e, 'part')} className="text-dh-main hover:text-dh-accent disabled:opacity-50 transition-colors flex items-center gap-1 bg-dh-surface px-2 py-1 rounded-md border border-dh-border shadow-sm active:scale-95">
                  {isSubmittingKnowledge ? <RefreshCw size={12} className="animate-spin" /> : <PlusCircle size={12}/>} <span className="text-[10px] font-bold">เพิ่มพาร์ท</span>
                </button>
              </div>
              <div className="font-bold text-dh-main text-[13px] bg-dh-base p-3 rounded-xl border border-dh-border min-h-[44px] uppercase my-1 transition-all group-hover/row:shadow-sm group-hover/row:border-dh-border/80 tracking-wide">
                {selectedProduct.compatiblePartNumbers?.length ? <HighlightText text={selectedProduct.compatiblePartNumbers} highlightData={highlightData} /> : <span className="text-dh-muted italic font-medium">n/a</span>}
              </div>
            </div>

            {(selectedProduct.tags?.length > 0 || selectedProduct.packageSize || selectedProduct.bufferStock) && (
              <div className="group/row contents">
                <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">ข้อมูลเพิ่มเติม</div>
                <div className="flex flex-wrap gap-2 text-[11px] py-1.5 px-3 rounded-xl transition-colors group-hover/row:bg-dh-base/40">
                  {selectedProduct.tags?.length > 0 && selectedProduct.tags.map((t, i) => (
                    <span key={i} className="bg-dh-base text-dh-main px-2 py-1 rounded-md border border-dh-border font-extrabold shadow-sm">#{t}</span>
                  ))}
                  {selectedProduct.packageSize && (
                    <span className="bg-dh-base text-dh-main px-2 py-1 rounded-md border border-dh-border font-extrabold shadow-sm">
                      📦 ขนาด: {selectedProduct.packageSize.w}x{selectedProduct.packageSize.l}x{selectedProduct.packageSize.h}
                    </span>
                  )}
                  {selectedProduct.bufferStock && (
                    <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800/50 font-extrabold shadow-sm">
                      ⚠️ กักสต็อก: {selectedProduct.bufferStock}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="group/row contents">
              <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2 px-2 rounded-l-lg transition-colors group-hover/row:bg-dh-base/40">ลิงก์อ้างอิง</div>
              <div className="flex flex-wrap gap-2 text-[11px] font-extrabold py-1.5 px-3 rounded-xl transition-colors group-hover/row:bg-dh-base/40">
                  {selectedProduct.landingPageUrl && <a href={selectedProduct.landingPageUrl} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dh-surface text-dh-main rounded-md border border-dh-border hover:border-dh-accent transition-all hover:-translate-y-0.5 shadow-sm"><LinkIcon size={12}/> หน้าหลัก</a>}
                  {selectedProduct.externalLinks?.shopee && <a href={selectedProduct.externalLinks.shopee} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ee4d2d]/10 text-[#ee4d2d] rounded-md border border-[#ee4d2d]/20 hover:bg-[#ee4d2d]/20 transition-all hover:-translate-y-0.5 shadow-sm"><ExternalLink size={12}/> Shopee</a>}
                  {selectedProduct.externalLinks?.lazada && <a href={selectedProduct.externalLinks.lazada} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0f136d]/10 text-[#0f136d] dark:bg-[#2A2D8E]/30 dark:text-[#888DF2] rounded-md border border-[#0f136d]/20 dark:border-[#888DF2]/30 hover:bg-[#0f136d]/20 transition-all hover:-translate-y-0.5 shadow-sm"><ExternalLink size={12}/> Lazada</a>}
                  {selectedProduct.externalLinks?.tiktok && <a href={selectedProduct.externalLinks.tiktok} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 dark:bg-white/10 text-current rounded-md border border-current/10 hover:bg-black/10 transition-all hover:-translate-y-0.5 shadow-sm"><ExternalLink size={12}/> TikTok</a>}
                  {(!selectedProduct.landingPageUrl && !selectedProduct.externalLinks?.shopee && !selectedProduct.externalLinks?.lazada && !selectedProduct.externalLinks?.tiktok) && <span className="text-dh-muted font-bold py-1.5">ไม่มีข้อมูลลิงก์</span>}
              </div>
            </div>
          </div>

          {/* Substitutes */}
          {substitutes.length > 0 && (
            <div className="mt-5 p-4 bg-dh-accent-light/50 rounded-xl border border-dh-accent/30 transition-colors">
              <div className="text-[11px] font-extrabold text-dh-accent uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <RefreshCw size={14}/> สินค้าใช้แทนกันได้ (Substitutes)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {substitutes.map(sub => (
                  <div key={sub.id} onClick={() => handleSelectProduct(sub)} className="group/sub bg-dh-surface p-3 rounded-xl border border-dh-border cursor-pointer hover:border-dh-accent flex justify-between items-center transition-all duration-300 hover:shadow-dh-card hover:-translate-y-0.5">
                    <div className="min-w-0 pr-3">
                      <div className="font-extrabold text-dh-main text-[12px] mb-1 group-hover/sub:text-dh-accent transition-colors"><HighlightText text={sub.sku} highlightData={highlightData}/></div> 
                      <div className="text-[10px] font-bold text-dh-muted truncate"><HighlightText text={sub.name} highlightData={highlightData}/></div>
                    </div>
                    <span className="text-[11px] font-black text-dh-accent bg-dh-base border border-dh-border px-2 py-1 rounded-md shrink-0 shadow-sm group-hover/sub:scale-105 transition-transform">มี {sub.stockQuantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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