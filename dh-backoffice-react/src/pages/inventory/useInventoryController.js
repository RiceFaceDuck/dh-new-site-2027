import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useInventoryData from '../../components/inventory/hooks/useInventoryData';
import useInventorySearch from '../../components/inventory/hooks/useInventorySearch';
import useDebounce from '../../hooks/useDebounce';
import { inventoryService } from '../../firebase/inventoryService';
import { inventoryStatsService } from '../../firebase/inventory/inventoryStatsService';
import { catalogHydrationService } from '../../firebase/catalogHydrationService';
import { INVENTORY_MASTER_SHEET_URL } from '../../constants/inventoryConstants';
import toast from 'react-hot-toast';

export default function useInventoryController() {
  const { isManagerOrOwner } = useAuth();
  const {
    products, categories, loading, globalBufferStock,
    fetchInitialProducts, updateProductInState
  } = useInventoryData();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [filterCategory, setFilterCategory] = useState('All');
  const [salesPeriod, setSalesPeriod] = useState('30'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { 
    filteredProducts, isSearching, 
    totalItems, currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage, totalPages,
    startIndex, endIndex,
    updateCache, clearCache 
  } = useInventorySearch(
    products, debouncedSearchTerm, filterCategory, sortConfig, salesPeriod
  );

  const handleRecalculateStats = useCallback(async (options = {}) => {
    try {
      setIsRecalculating(true);
      // 1. Recalculate 5-dimension stats snapshot (soft failure tolerance)
      try {
        await inventoryStatsService.recalculateDailyStats();
      } catch (statsErr) {
        console.warn("⚠️ [useInventoryController] Daily stats recalculation error:", statsErr);
      }

      // 2. Clear search and table cache
      if (typeof clearCache === 'function') {
        clearCache();
      }

      // 3. Clear stale cache & instant force refresh catalog
      const bypassShards = (options && typeof options === 'object') ? !!(options.bypassShards || options.shiftKey || options.altKey) : false;
      await fetchInitialProducts({ forceRefresh: true, bypassShards }); // fetchInitialProducts()

      toast.success(bypassShards ? "ซิงค์และดึงข้อมูลสดจากฐานข้อมูลสำเร็จ" : "ซิงค์และรีเฟรชข้อมูลคลังสินค้าสำเร็จ");
    } catch (error) {
      console.error("Error recalculating stats:", error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการซิงค์ข้อมูลสถิติ");
    } finally {
      setIsRecalculating(false);
    }
  }, [fetchInitialProducts, clearCache]);

  const handleOpenMasterSheet = () => {
    if (isManagerOrOwner) {
      window.open(INVENTORY_MASTER_SHEET_URL, '_blank');
    } else {
      toast.error('คุณไม่สามารถใช้งานได้ ต้องใช้ตำแหน่ง ผู้จัดการ หรือสูงกว่า');
    }
  };

  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      let direction = 'desc';
      if (prev.key === key && prev.direction === 'desc') {
        direction = 'asc';
      }
      return { key, direction };
    });
  }, []);

  const handleEditProduct = useCallback((p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  }, []);

  const handleSaveProduct = async (productData) => {
    try {
      const isEdit = !!editingProduct;
      const cleanSku = String(productData.sku || '').trim().toUpperCase();

      if (isEdit) {
        await inventoryService.updateProduct(cleanSku, productData);
        toast.success(`อัปเดตข้อมูล ${cleanSku} เรียบร้อยแล้ว`);
      } else {
        // 🛡️ Client-Side Duplicate SKU Guard
        const isDuplicate = products.some(p => String(p.sku || '').trim().toUpperCase() === cleanSku);
        if (isDuplicate) {
          toast.error(`รหัสสินค้า (SKU) "${cleanSku}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
          return;
        }

        await inventoryService.addProduct(productData);
        toast.success(`เพิ่มสินค้าใหม่ ${cleanSku} เรียบร้อยแล้ว`);
      }
      
      // 🛡️ Preserve stats integrity when updating in-memory state
      const mergedProduct = isEdit && editingProduct 
        ? { ...editingProduct, ...productData, sku: cleanSku } 
        : { ...productData, sku: cleanSku };

      updateProductInState(mergedProduct, isEdit);
      updateCache(mergedProduct, isEdit);

      // 🚀 Sync with Local POS Cache (Zero-Read Invariant)
      catalogHydrationService.updateCatalogCacheWithProducts([mergedProduct]).catch(() => null);

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleImportSuccess = async () => {
    // 🛡️ ไม่สั่งปิด Modal อัตโนมัติ เพื่อให้ผู้ใช้ตรวจเช็คผลสรุปใน ImportResultSummary และเป็นคนกดปิดเอง
    clearCache();
    await fetchInitialProducts({ forceRefresh: true });
  };

  return {
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
    isRecalculating,
    handleRecalculateStats,
    handleOpenMasterSheet,
    handleSort,
    handleEditProduct,
    handleSaveProduct,
    handleAddProduct,
    handleImportSuccess,
  };
}

