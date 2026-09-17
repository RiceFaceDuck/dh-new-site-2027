import { lazy, Suspense } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
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
  } = useInventoryController();

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full animate-in fade-in duration-500 bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5 text-dh-main overflow-hidden">
      
      <InventoryHeader 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        salesPeriod={salesPeriod} setSalesPeriod={setSalesPeriod}
        categories={categories}
        onAddProduct={handleAddProduct}
        onImportProduct={() => setIsImportModalOpen(true)}
        onExportProduct={() => setIsExportModalOpen(true)}
        onGuideOpen={() => setIsGuideOpen(true)}
      />

      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 bg-white border border-dh-border rounded-xl shadow-xs animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 animate-spin text-dh-accent mb-4 drop-shadow-xs" />
          <p className="text-dh-accent font-black tracking-wide text-lg">กำลังโหลดคลังสินค้า...</p>
          <p className="text-dh-muted text-sm mt-1">Please wait a moment</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex-1 bg-white dark:bg-slate-900 border border-dh-border rounded-xl shadow-xs overflow-hidden flex flex-col relative transition-all duration-300">
            {isSearching && (
               <div className="absolute top-0 left-0 w-full h-1 bg-dh-accent/20 overflow-hidden z-30">
                 <div className="w-1/3 h-full bg-dh-accent animate-[slideRight_1s_ease-in-out_infinite]"></div>
               </div>
            )}
            
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
                    แสดง <span className="text-dh-accent font-bold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> จากทั้งหมด <span className="text-dh-main font-bold">{totalItems.toLocaleString()}</span> รายการ
                  </div>
                  
                  <div className="flex items-center gap-1.5 border-l border-dh-border pl-4">
                    <span className="text-dh-muted text-xs">แสดงหน้าละ:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main focus:outline-none focus:border-dh-accent cursor-pointer"
                    >
                      <option value={21}>21 รายการ</option>
                      <option value={50}>50 รายการ</option>
                      <option value={100}>100 รายการ</option>
                      <option value={250}>250 รายการ</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={14} />
                    <span>ย้อนกลับ</span>
                  </button>

                  <div className="px-3 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main">
                    หน้า <span className="text-dh-accent">{currentPage}</span> / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight size={14} />
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
