import { useState, useEffect, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LoaderCircle, Lock } from 'lucide-react';
import ProductTable from '../../components/inventory/ProductTable';
import InventoryHeader from '../../components/inventory/InventoryHeader';
import useInventoryController from './useInventoryController';

// ⚡ Lazy Loading Heavy Modals
const ProductModal = lazy(() => import('../../components/inventory/ProductModal'));
const InventoryImportModal = lazy(() => import('../../components/inventory/InventoryImportModal'));
const InventoryExportModal = lazy(() => import('../../components/inventory/InventoryExportModal'));
const GuideModal = lazy(() => import('../../components/common/GuideModal'));

export default function Inventory() {
  const {
    categories,
    loading,
    globalBufferStock,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    salesPeriod,
    setSalesPeriod,
    sortConfig,
    filteredProducts,
    isSearching,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    isModalOpen,
    setIsModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    editingProduct,
    isGuideOpen,
    setIsGuideOpen,
    handleOpenMasterSheet,
    handleSort,
    handleEditProduct,
    handleSaveProduct,
    handleAddProduct,
    handleImportSuccess,
    isRecalculating,
    handleRecalculateStats,
  } = useInventoryController();

  const [searchProgress, setSearchProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(15);

  useEffect(() => {
    if (loading) {
      setLoadingProgress(15);
      const timer = setInterval(() => {
        setLoadingProgress(prev => (prev < 95 ? prev + Math.max(1, Math.floor((96 - prev) / 8)) : prev));
      }, 120);
      return () => clearInterval(timer);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    if (isSearching) {
      setSearchProgress(10);
      const timer = setInterval(() => {
        setSearchProgress(prev => (prev < 92 ? prev + Math.floor(Math.random() * 6) + 3 : prev));
      }, 180);
      return () => clearInterval(timer);
    }
    setSearchProgress(100);
  }, [isSearching]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full animate-in fade-in duration-500 bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5 text-dh-main overflow-hidden">
      
      <InventoryHeader 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        isRecalculating={isRecalculating}
        onRecalculateStats={handleRecalculateStats}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        salesPeriod={salesPeriod} setSalesPeriod={setSalesPeriod}
        categories={categories}
        onAddProduct={handleAddProduct}
        onImportProduct={() => setIsImportModalOpen(true)}
        onExportProduct={() => setIsExportModalOpen(true)}
        onGuideOpen={() => setIsGuideOpen(true)}
      />

      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 bg-white dark:bg-slate-900 border border-dh-border rounded-xl shadow-xs p-6 md:p-10 animate-in fade-in duration-500 max-w-md mx-auto my-auto w-full">
          <div className="relative flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-full border-4 border-dh-accent/20 border-t-dh-accent animate-spin" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-dh-accent font-black text-sm">
              {Math.min(100, Math.max(0, Math.round(loadingProgress)))}%
            </div>
          </div>
          <h3 className="text-dh-accent font-black tracking-wide text-lg mb-1 text-center">
            กำลังโหลดคลังสินค้า ({Math.min(100, Math.max(0, Math.round(loadingProgress)))}%)
          </h3>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-3 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${Math.min(100, Math.max(5, loadingProgress))}%` }} 
            />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium text-center mb-4 min-h-[18px]">
            กรุณารอสักครู่...
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-dh-accent/10 border border-dh-accent/20 rounded-full text-[11px] font-bold text-dh-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-dh-accent animate-pulse" />
            ระบบ Zero-Read Architecture Fast Loading
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex-1 bg-white dark:bg-slate-900 border border-dh-border rounded-xl shadow-xs overflow-hidden flex flex-col relative transition-all duration-300">
            
            <ProductTable 
              products={filteredProducts} 
              salesPeriod={salesPeriod} 
              globalBufferStock={globalBufferStock}
              sortConfig={sortConfig}
              onSort={handleSort}
              onEdit={handleEditProduct} 
            />
            
            {/* 📄 Pagination Bar (แถบควบคุมเปลี่ยนหน้า 21/50/100/250 รายการ) */}
            {!loading && totalItems > 0 && (
              <div className="px-4 py-2 bg-dh-surface border-t border-dh-border flex flex-wrap items-center justify-between gap-3 shrink-0 text-sm shadow-xs rounded-b-xl z-10">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-dh-muted">
                  <div>
                    {searchTerm ? (
                      <>
                        แสดง <span className="text-dh-accent font-bold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> จาก (คำค้นหา <span className="text-dh-main font-bold">{searchTerm}</span>) พบทั้งหมด <span className="text-dh-main font-bold">{totalItems.toLocaleString()}</span> รายการ
                      </>
                    ) : (
                      <>
                        แสดง <span className="text-dh-accent font-bold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> จากทั้งหมด <span className="text-dh-main font-bold">{totalItems.toLocaleString()}</span> รายการ
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 border-l border-dh-border pl-4">
                    <span className="text-dh-muted text-xs">แสดงหน้าละ:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Math.max(10, Number(e.target.value) || 10))}
                      className="px-2 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main focus:outline-none focus:border-dh-accent cursor-pointer"
                    >
                      <option value={21}>21 รายการ</option>
                      <option value={50}>50 รายการ</option>
                      <option value={100}>100 รายการ</option>
                      <option value={250}>250 รายการ</option>
                    </select>
                  </div>
                </div>

                {isSearching && (
                  <div className="flex flex-1 justify-center animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-3.5 py-1 rounded-full border-2 border-yellow-500 shadow-md shadow-yellow-400/20 font-black transition-all">
                      <LoaderCircle size={13} className="animate-spin text-slate-950 stroke-[2.5]" />
                      <span className="text-xs font-black tracking-wide">
                        กำลังอัปเดตข้อมูล {Math.min(100, Math.max(0, Math.round(searchProgress)))}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1}
                    className="px-2 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าแรก"
                  >
                    <ChevronsLeft size={14} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">ย้อนกลับ</span>
                  </button>

                  <div className="flex items-center gap-1 px-2 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main">
                    <span>หน้า</span>
                    <select
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Math.max(1, Number(e.target.value) || 1))}
                      className="bg-transparent border-none text-dh-accent font-bold outline-none cursor-pointer appearance-none text-center px-1 hover:bg-dh-surface rounded [&>option]:text-slate-900 dark:[&>option]:text-slate-100 dark:[&>option]:bg-slate-800"
                    >
                      {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <span>/ {totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <span className="hidden sm:inline">ถัดไป</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าสุดท้าย"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {isModalOpen && (
          <ProductModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveProduct} 
            productData={editingProduct} 
            globalBufferStock={globalBufferStock}
            categoriesData={categories}
          />
        )}

        {isImportModalOpen && (
          <InventoryImportModal 
            isOpen={isImportModalOpen} 
            onClose={() => setIsImportModalOpen(false)} 
            onSuccess={handleImportSuccess}
          />
        )}

        {isExportModalOpen && (
          <InventoryExportModal 
            isOpen={isExportModalOpen} 
            onClose={() => setIsExportModalOpen(false)} 
            availableCategories={categories}
          />
        )}

        {isGuideOpen && (
          <GuideModal 
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            title="คู่มือการใช้งาน: ระบบคลังสินค้า (Inventory)"
            config={{
              description: "หน้านี้ใช้สำหรับจัดการสต๊อกสินค้า กำหนดราคาขาย ราคาต้นทุน และซิงค์ข้อมูลกับ Google Sheets เพื่อออกใบเสร็จแบบอัตโนมัติ",
              howTo: [
                "1. <b>ค้นหาสินค้า:</b> พิมพ์ SKU หรือชื่อรุ่นในช่องค้นหา ระบบจะค้นหาให้อัตโนมัติ (ไม่ต้องกด Enter)",
                "2. <b>แก้ไขสต๊อก/ราคา:</b> กดปุ่ม ✏️ หลังชื่อสินค้า เพื่อแก้ไขข้อมูล ข้อมูลจะถูกอัปเดตแบบเรียลไทม์",
                "3. <b>นำเข้า/ส่งออก (Import/Export):</b> ใช้ปุ่ม Import เพื่อนำเข้าสินค้าหลายรายการพร้อมกันจากไฟล์ Excel/CSV",
                "4. <b>ระบบซิงค์อัตโนมัติ (Auto-Sync):</b> ข้อมูลสต๊อกและราคาจะถูกส่งไปอัปเดตที่ Google Sheets อัตโนมัติทุกครั้งที่มีการแก้ไขหรือเกิดยอดขายใหม่"
              ],
              tips: [
                "คุณสามารถดู 'ยอดขาย 30 วัน' เพื่อประกอบการตัดสินใจเติมสต๊อกได้จากเมนู Dropdown ด้านบน",
                "หากสินค้าใกล้หมด (ต่ำกว่า Buffer Stock ที่ตั้งไว้) จำนวนสต๊อกจะแสดงเป็นสีแดงเพื่อแจ้งเตือน"
              ],
              expectedResults: "การเพิ่มหรือแก้ไขสินค้าที่นี่ จะส่งผลกับหน้า POS ทันที แต่บน Google Sheets ต้องรอระบบซิงค์ (ประมาณ 10 วินาที)"
            }}
            extraFooter={
              <button 
                onClick={handleOpenMasterSheet}
                title="เปิดฐานข้อมูล Google Sheet"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm shadow-xs transition-colors dh-active-press"
              >
                <Lock size={16} className="text-amber-500" />
                Master DB
              </button>
            }
          />
        )}
      </Suspense>
    </div>
  );
}
