import React, { useState, useRef, useCallback } from 'react';
import { Loader2, Boxes } from 'lucide-react';
import ProductTable from '../components/inventory/ProductTable';
import ProductModal from '../components/inventory/ProductModal';
import InventoryImportModal from '../components/inventory/InventoryImportModal';
import InventoryExportModal from '../components/inventory/InventoryExportModal';
import InventoryHeader from '../components/inventory/InventoryHeader';
import { inventoryService } from '../firebase/inventoryService';

import useInventoryData from '../components/inventory/hooks/useInventoryData';
import useInventorySearch from '../components/inventory/hooks/useInventorySearch';
import useDebounce from '../hooks/useDebounce'; // ✨ Import useDebounce

export default function Inventory() {
  const {
    products, categories, loading, loadingMore, globalBufferStock,
    hasMore, loadMore, fetchInitialProducts, updateProductInState
  } = useInventoryData();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // ✨ หน่วงเวลาพิมพ์ค้นหา 300ms

  const [filterCategory, setFilterCategory] = useState('All');
  const [salesPeriod, setSalesPeriod] = useState('30'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ✨ ส่ง debouncedSearchTerm ไปใช้ค้นหาแทน searchTerm
  const { 
    filteredProducts, isSearching, 
    hasMoreCache, loadMoreCache, // ดึงฟังก์ชันจัดการหน้าของ Cache ออกมา
    updateCache, clearCache 
  } = useInventorySearch(
    products, debouncedSearchTerm, filterCategory, sortConfig, salesPeriod
  );

  const isGlobalActionActive = debouncedSearchTerm || filterCategory !== 'All' || sortConfig.key;

  // ✨ Infinite Scroll Logic รองรับทั้ง Firebase และ Cache
  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (isGlobalActionActive && hasMoreCache) {
          // โหลดเพิ่มจาก Cache
          loadMoreCache();
        } else if (!isGlobalActionActive && hasMore) {
          // โหลดเพิ่มจาก Firebase
          loadMore();
        }
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, hasMoreCache, isGlobalActionActive, loadMore, loadMoreCache]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaveProduct = async (productData) => {
    try {
      const isEdit = !!editingProduct;
      if (isEdit) {
        await inventoryService.updateProduct(productData.sku, productData);
      } else {
        await inventoryService.addProduct(productData);
      }
      
      updateProductInState(productData, isEdit);
      updateCache(productData, isEdit);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full animate-in fade-in duration-500 bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5 text-dh-main overflow-hidden">
      
      <InventoryHeader 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        salesPeriod={salesPeriod} setSalesPeriod={setSalesPeriod}
        onAddProduct={handleAddProduct}
        onImportProduct={() => setIsImportModalOpen(true)}
        onExportProduct={() => setIsExportModalOpen(true)}
      />

      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1 bg-white border border-dh-border rounded-xl shadow-sm animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 animate-spin text-dh-accent mb-4 drop-shadow-sm" />
          <p className="text-dh-accent font-black tracking-wide text-lg">กำลังโหลดคลังสินค้า...</p>
          <p className="text-dh-muted text-sm mt-1">Please wait a moment</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex-1 bg-white dark:bg-slate-900 border border-dh-border rounded-xl shadow-sm overflow-y-auto custom-scrollbar flex flex-col relative transition-all duration-300">
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
              onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }} 
            />
            
            {( (!isGlobalActionActive && hasMore) || (isGlobalActionActive && hasMoreCache) ) && (
              <div ref={lastElementRef} className="flex justify-center items-center p-6 shrink-0 bg-transparent">
                {(!isGlobalActionActive && loadingMore) && (
                  <div className="flex items-center gap-2 text-dh-muted font-bold animate-pulse">
                     <Loader2 className="animate-spin w-5 h-5 text-dh-accent" />
                     กำลังดึงข้อมูลเพิ่มเติม...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct} 
        productData={editingProduct} 
        globalBufferStock={globalBufferStock}
      />

      <InventoryImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => {
          setIsImportModalOpen(false);
          clearCache();
          fetchInitialProducts();
        }}
      />

      <InventoryExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        availableCategories={categories}
      />
    </div>
  );
}// trigger 
