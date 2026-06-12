import React, { useEffect } from 'react';
import { 
  PlusCircle, X, RefreshCw, HelpCircle, Clock, History, Send, Info
} from 'lucide-react';
import { useProductSearch } from './hooks/useProductSearch';
import { HighlightText } from '../components/search/HighlightText';

// นำเข้า Components
import SearchHeader from '../components/search/SearchHeader';
import ProductListPanel from '../components/search/ProductListPanel';
import ProductDetailPanel from '../components/search/ProductDetailPanel';
import HistoryLogPanel from '../components/search/HistoryLogPanel';

export default function Search() {
  const searchState = useProductSearch();

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-300 overflow-hidden bg-dh-base text-dh-main">
      
      {/* --- ส่วนที่ 1: Header Search --- */}
      <SearchHeader 
        search1={searchState.search1} setSearch1={searchState.setSearch1}
        search2={searchState.search2} setSearch2={searchState.setSearch2}
        search3={searchState.search3} setSearch3={searchState.setSearch3}
        loading={searchState.loading} resetSearch={searchState.resetSearch}
        searchInputRef={searchState.searchInputRef}
        setIsManualModalOpen={searchState.setIsManualModalOpen}
        openReportModal={searchState.openReportModal}
      />

      {/* Main Content Area - เพิ่มช่องว่างเล็กน้อย (Gap) ตามที่ผู้ใช้ต้องการเพื่อแยกโซนสายตา */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5">
        
        {/* --- ส่วนที่ 2: Product List Panel (ด้านซ้าย) --- */}
        <ProductListPanel 
          filteredProducts={searchState.filteredProducts}
          search1={searchState.search1} search2={searchState.search2} search3={searchState.search3}
          selectedProduct={searchState.selectedProduct}
          handleSelectProduct={searchState.handleSelectProduct}
          getStockStatus={searchState.getStockStatus}
          highlightData={searchState.highlightData}
          HighlightText={HighlightText}
        />

        {/* --- ส่วนที่ 3: Product Detail Panel (ตรงกลาง) --- */}
        <ProductDetailPanel 
          selectedProduct={searchState.selectedProduct}
          highlightData={searchState.highlightData}
          copySuccess={searchState.copySuccess} handleCopyChat={searchState.handleCopyChat}
          showSuffixSettings={searchState.showSuffixSettings} setShowSuffixSettings={searchState.setShowSuffixSettings}
          chatSuffix={searchState.chatSuffix} handleSaveSuffix={searchState.handleSaveSuffix}
          setIsImageModalOpen={searchState.setIsImageModalOpen}
          getStockStatus={searchState.getStockStatus}
          showCommentInput={searchState.showCommentInput} setShowCommentInput={searchState.setShowCommentInput}
          newComment={searchState.newComment} setNewComment={searchState.setNewComment} handleAddComment={searchState.handleAddComment}
          isSubmittingComment={searchState.isSubmittingComment}
          combinedComments={searchState.combinedComments} commentIndex={searchState.commentIndex} setCommentIndex={searchState.setCommentIndex}
          isSubmittingKnowledge={searchState.isSubmittingKnowledge} submitKnowledge={searchState.submitKnowledge}
          substitutes={searchState.substitutes} handleSelectProduct={searchState.handleSelectProduct}
        />

        {/* --- ส่วนที่ 4: History Log Panel (ด้านขวา) --- */}
        <HistoryLogPanel 
          selectedProduct={searchState.selectedProduct}
          setIsHistoryModalOpen={searchState.setIsHistoryModalOpen}
          loadingHistory={searchState.loadingHistory}
          historyLogs={searchState.historyLogs}
        />

      </div>

      {/* ========================================== */}
      {/* --- ส่วน Modals (อัปเกรด UI ให้เข้า Theme) --- */}
      {/* ========================================== */}
      
      {/* Modal คู่มือการใช้งาน - ดีไซน์ Clean & Compact */}
      {searchState.isManualModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-base px-5 py-3 border-b border-dh-border flex justify-between items-center">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
                <HelpCircle size={16} className="text-dh-accent"/>
                คู่มือการใช้งาน Product Search+
              </h3>
              <button onClick={() => searchState.setIsManualModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-border/50 transition-colors"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-3 text-xs text-dh-main bg-dh-surface">
              <p className="font-semibold text-dh-accent">ระบบ Zero-Read Search ลดเวลาในการหาสินค้า</p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0"></div>
                  <div>ช่อง <strong>K1 (คีย์เวิร์ดหลัก)</strong>: สำหรับใส่คำค้นหาหลัก เช่น ชื่อรุ่น หรือ แบรนด์</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0"></div>
                  <div>ช่อง <strong>K2 และ K3</strong>: สำหรับกรองข้อมูลให้แคบลง เช่น สี, ขนาด, หรือจุดสังเกต</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1 shrink-0"></div>
                  <div>
                    ใช้คีย์ลัด <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">Ctrl</kbd> + <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">F</kbd> เพื่อเริ่มค้นหาได้ทันทีโดยไม่ต้องใช้เมาส์คลิก
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1 shrink-0"></div>
                  <div>
                    ปุ่ม <kbd className="bg-dh-base border border-dh-border text-dh-muted rounded px-1 py-0.5 text-[10px] mx-1">X</kbd> ภายในช่องค้นหา และปุ่ม <strong>ล้างค่า</strong> เพื่อความรวดเร็วในการ Reset
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-red-50/50 p-2 rounded-md border border-red-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                  <div className="text-red-700">
                    หากเจอคำว่า <strong>หมดสต๊อก</strong> หรือ <strong className="text-yellow-600">ใกล้หมด</strong> ให้ระมัดระวังในการขาย
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal History แบบเต็มจอ - Compact & System Colors */}
      {searchState.isHistoryModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-surface px-5 py-3 border-b border-dh-border flex justify-between items-center z-10">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
                <History size={16} className="text-dh-muted"/>
                ประวัติความเคลื่อนไหว (History Log)
              </h3>
              <button onClick={() => searchState.setIsHistoryModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-base transition-colors"><X size={16}/></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto bg-dh-base custom-scrollbar relative">
               {searchState.loadingHistory ? (
                  <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-dh-muted" size={20}/></div>
                ) : searchState.historyLogs.length > 0 ? (
                  <div className="max-w-3xl mx-auto relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-dh-border">
                    {searchState.historyLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group mb-4 last:mb-0">
                        {/* Timeline Icon */}
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-dh-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                          log.action === 'Create' ? 'bg-emerald-500' : 
                          log.action === 'Update' ? 'bg-blue-500' : 
                          log.action === 'Approve' ? 'bg-teal-500' : 'bg-slate-400'
                        }`}>
                           <span className="text-white font-bold text-[10px]">{log.action.substring(0, 1)}</span>
                        </div>
                        {/* Timeline Content */}
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg bg-dh-surface border border-dh-border shadow-sm hover:border-dh-accent/50 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold text-dh-muted bg-dh-base px-1.5 py-0.5 rounded border border-dh-border uppercase tracking-wide">{log.module} / {log.action}</span>
                            <span className="text-[9px] font-medium text-dh-muted flex items-center gap-1">
                              <Clock size={10}/> {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-dh-main mt-1 leading-relaxed">{log.details}</p>
                          <div className="mt-1.5 pt-1.5 border-t border-dh-border text-[10px] text-dh-muted flex items-center gap-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-dh-base flex items-center justify-center font-bold text-dh-accent border border-dh-border">{log.actorName?.substring(0,1) || log.performedBy?.substring(0,1) || 'U'}</div>
                            <span>{log.actorName || log.performedBy}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full opacity-50">
                    <History size={24} className="text-dh-muted mb-2" />
                    <p className="text-xs font-semibold text-dh-muted">ไม่มีประวัติการเคลื่อนไหว</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Modal แจ้งจัดซื้อ - Compact & Professional */}
      {searchState.isReportModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-surface px-5 py-3 border-b border-dh-border flex justify-between items-center">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
                <PlusCircle size={16} className="text-dh-accent"/>
                แจ้งเพิ่มสินค้า ยังไม่มีขาย
              </h3>
              <button onClick={() => searchState.setIsReportModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-base transition-colors"><X size={16}/></button>
            </div>
            
            <form onSubmit={searchState.handleSubmitReport} className="p-5 space-y-3 bg-dh-base/50">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-dh-muted uppercase tracking-wide flex items-center gap-1">
                  คำค้นหาที่ลูกค้าต้องการ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" required 
                  value={searchState.reportForm.keyword} 
                  onChange={e => searchState.setReportForm({...searchState.reportForm, keyword: e.target.value})} 
                  className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all" 
                  placeholder="เช่น Adapter Swift 7520" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">หมวดหมู่โดยประมาณ</label>
                  <input 
                    type="text" 
                    value={searchState.reportForm.category} 
                    onChange={e => searchState.setReportForm({...searchState.reportForm, category: e.target.value})} 
                    className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
                    placeholder="เช่น Adapter" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">ชื่อลูกค้า (ถ้ามี)</label>
                  <input 
                    type="text" 
                    value={searchState.reportForm.customerName} 
                    onChange={e => searchState.setReportForm({...searchState.reportForm, customerName: e.target.value})} 
                    className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
                    placeholder="เช่น คุณสมชาย" 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide flex items-center justify-between">
                  ลิงก์อ้างอิง <span className="text-[9px] font-normal normal-case">(Shopee, Web ฯลฯ)</span>
                </label>
                <input 
                  type="url" 
                  value={searchState.reportForm.referenceLink} 
                  onChange={e => searchState.setReportForm({...searchState.reportForm, referenceLink: e.target.value})} 
                  className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
                  placeholder="https://..." 
                />
              </div>

              <div className="bg-blue-50/50 p-2.5 rounded-md border border-blue-100 flex items-start gap-1.5 mt-1">
                <Info size={12} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-dh-muted leading-relaxed">
                  ส่งเรื่องเข้า <span className="text-blue-600 font-semibold">To-do ของผู้จัดการและฝ่ายจัดซื้อ</span>
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={searchState.isReporting} 
                  className="w-full py-2 bg-dh-accent hover:bg-dh-accent-hover text-white font-bold rounded-md shadow-sm transition-all flex justify-center items-center gap-2 text-xs disabled:opacity-70"
                >
                  {searchState.isReporting ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} 
                  {searchState.isReporting ? 'กำลังส่งข้อมูล...' : 'ยืนยันส่งเรื่อง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal รูปภาพ (Lightbox) - Clean View */}
      {searchState.isImageModalOpen && searchState.selectedProduct?.images?.[0] && (
        <div 
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => searchState.setIsImageModalOpen(false)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-lg z-10">
            <X size={24}/>
          </button>
          <div className="relative max-w-5xl max-h-full flex flex-col items-center justify-center w-full h-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img 
              src={searchState.selectedProduct.images[0]} 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-dh-surface ring-1 ring-white/10" 
              draggable="true" 
              alt="Product Detail"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
               <p className="text-white/80 font-medium select-none bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[11px] shadow-lg flex items-center gap-2 border border-white/10">
                 <Info size={14} className="text-dh-accent"/> ลากรูปภาพไปวางในแชตได้โดยตรง
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}