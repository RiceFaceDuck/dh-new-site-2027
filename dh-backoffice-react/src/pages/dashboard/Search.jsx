import React, { useEffect } from 'react';
import { 
  PlusCircle, X, RefreshCw, HelpCircle, Clock, History, Send, Info
} from 'lucide-react';
import { useProductSearch } from '../hooks/useProductSearch';
import { HighlightText } from '../../components/search/HighlightText';

// นำเข้า Components
import SearchHeader from '../../components/search/SearchHeader';
import ProductListPanel from '../../components/search/ProductListPanel';
import ProductDetailPanel from '../../components/search/ProductDetailPanel';
import HistoryLogPanel from '../../components/search/HistoryLogPanel';
import ManualModal from '../../components/search/modal/ManualModal';
import HistoryModal from '../../components/search/modal/HistoryModal';
import ReportModal from '../../components/search/modal/ReportModal';
import ImageModal from '../../components/search/modal/ImageModal';

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
      
      {/* Modal คู่มือการใช้งาน */}
      <ManualModal 
        isManualModalOpen={searchState.isManualModalOpen} 
        setIsManualModalOpen={searchState.setIsManualModalOpen} 
      />

      {/* Modal History */}
      <HistoryModal 
        isHistoryModalOpen={searchState.isHistoryModalOpen} 
        setIsHistoryModalOpen={searchState.setIsHistoryModalOpen} 
        loadingHistory={searchState.loadingHistory} 
        historyLogs={searchState.historyLogs} 
      />

      {/* Modal แจ้งจัดซื้อ */}
      <ReportModal 
        isReportModalOpen={searchState.isReportModalOpen} 
        setIsReportModalOpen={searchState.setIsReportModalOpen} 
        reportForm={searchState.reportForm} 
        setReportForm={searchState.setReportForm} 
        isReporting={searchState.isReporting} 
        handleSubmitReport={searchState.handleSubmitReport} 
      />

      {/* Modal รูปภาพ (Lightbox) */}
      <ImageModal 
        isImageModalOpen={searchState.isImageModalOpen} 
        setIsImageModalOpen={searchState.setIsImageModalOpen} 
        selectedProduct={searchState.selectedProduct} 
      />
    </div>
  );
}