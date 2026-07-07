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
import GuideModal from '../../components/common/GuideModal';
import HistoryModal from '../../components/search/modal/HistoryModal';
import ReportModal from '../../components/search/modal/ReportModal';
import ImageModal from '../../components/search/modal/ImageModal';

export default function Search() {
  const searchState = useProductSearch();

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-300 overflow-hidden bg-dh-base text-dh-main px-4 pt-4 pb-2">
      
      {/* --- ส่วนที่ 1: Header Search --- */}
      <SearchHeader 
        search1={searchState.search1} setSearch1={searchState.setSearch1}
        search2={searchState.search2} setSearch2={searchState.setSearch2}
        search3={searchState.search3} setSearch3={searchState.setSearch3}
        stockFilter={searchState.stockFilter} setStockFilter={searchState.setStockFilter}
        loading={searchState.loading} resetSearch={searchState.resetSearch} forceSync={searchState.forceSync}
        searchInputRef={searchState.searchInputRef}
        openReportModal={searchState.openReportModal}
        openGuideModal={() => searchState.setIsGuideModalOpen(true)}
      />

      {/* Main Content Area - เพิ่มช่องว่างเล็กน้อย (Gap) ตามที่ผู้ใช้ต้องการเพื่อแยกโซนสายตา */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5">
        
        {/* --- ส่วนที่ 2: Product List Panel (ด้านซ้าย) --- */}
        <ProductListPanel 
          filteredProducts={searchState.filteredProducts}
          search1={searchState.search1} search2={searchState.search2} search3={searchState.search3}
          selectedProduct={searchState.selectedProduct}
          selectedIndex={searchState.selectedIndex}
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
          isSubmittingKnowledge={searchState.isSubmittingKnowledge} submitKnowledge={searchState.submitKnowledge}
          substitutes={searchState.substitutes} handleSelectProduct={searchState.handleSelectProduct}
        />

        {/* --- ส่วนที่ 4: History Log Panel (ด้านขวา) --- */}
        <HistoryLogPanel 
          selectedProduct={searchState.selectedProduct}
          setIsHistoryModalOpen={searchState.setIsHistoryModalOpen}
          loadingHistory={searchState.loadingHistory}
          historyLogs={searchState.historyLogs}
          newComment={searchState.newComment}
          setNewComment={searchState.setNewComment}
          handleAddComment={searchState.handleAddComment}
          isSubmittingComment={searchState.isSubmittingComment}
          handleAddNoteSuccess={searchState.handleAddNoteSuccess}
          handleTogglePinComment={searchState.handleTogglePinComment}
          handleDeleteNote={searchState.handleDeleteNote}
        />

      </div>

      {/* ========================================== */}
      {/* --- ส่วน Modals (อัปเกรด UI ให้เข้า Theme) --- */}
      {/* ========================================== */}
      {/* ========================================== */}
      
      {/* In-App Documentation (GuideModal) */}
      <GuideModal
        isOpen={searchState.isGuideModalOpen}
        onClose={() => searchState.setIsGuideModalOpen(false)}
        title="คู่มือการใช้งาน: ระบบค้นหาสินค้า (Product Search)"
        config={{
          description: "ใช้สำหรับค้นหา ตรวจสอบสต๊อก ดูประวัติ และทำรายการแจ้งจัดซื้อได้อย่างรวดเร็ว ระบบถูกออกแบบมาให้ค้นหาแบบ Real-time โดยดึงข้อมูลจากระบบแคชเพื่อความรวดเร็วและประหยัดทรัพยากร",
          howTo: [
            "พิมพ์คีย์เวิร์ดที่ต้องการในช่องค้นหา (ค้นหาได้สูงสุด 3 เงื่อนไขพร้อมกัน)",
            "คลิกที่รายการสินค้าในหน้าต่างซ้ายมือ หรือ <b>ใช้คีย์บอร์ดลูกศรขึ้น/ลง</b> และกด <b>Enter</b> เพื่อดูรายละเอียด",
            "ด้านขวาจะแสดงประวัติการทำงาน (History Log) ของสินค้านั้นๆ อัตโนมัติ",
            "หากต้องการขยายภาพสินค้า ให้คลิกที่รูปภาพในหน้าต่างรายละเอียด"
          ],
          tips: [
            "ใช้ปุ่มลัด (Shortcut) <b>Ctrl+F</b> เพื่อโฟกัสที่ช่องค้นหาได้ทันทีตลอดเวลา",
            "การค้นหาหลายคำพร้อมกัน (เช่น 'LED', '14.0', '40pin') จะช่วยกรองผลลัพธ์ให้แม่นยำขึ้น",
            "ใช้ <b>Quick Filters</b> (ทั้งหมด, มีของ, ใกล้หมด, หมด) เพื่อกรองผลลัพธ์ด่วน",
            "หากสต๊อกไม่ตรง สามารถกดปุ่ม <b>Refresh (หมุนๆ)</b> ด้านบนเพื่อดึงข้อมูลสดใหม่ได้ทันที"
          ],
          expectedResults: "เมื่อค้นหาสินค้า ระบบจะแสดงผลลัพธ์ทันที ภาพจะถูกโหลดขึ้นมาเฉพาะตัวที่แสดงผล (Lazy Load) หากไม่มีภาพจะแสดงไอคอนกล่อง"
        }}
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