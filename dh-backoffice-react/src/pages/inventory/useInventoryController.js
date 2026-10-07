import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useInventoryData from '../../components/inventory/hooks/useInventoryData';
import useInventorySearch from '../../components/inventory/hooks/useInventorySearch';
import useDebounce from '../../hooks/useDebounce';
import { inventoryService } from '../../firebase/inventoryService';
import { inventoryStatsService } from '../../firebase/inventory/inventoryStatsService';
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

  const handleRecalculateStats = useCallback(async () => {
    try {
      setIsRecalculating(true);
      await inventoryStatsService.recalculateDailyStats();
      await fetchInitialProducts(); // Refresh UI after recalculate
      toast.success("ซิงค์และคำนวณข้อมูลสถิติ 5 มิติสำเร็จ");
    } catch (error) {
      console.error("Error recalculating stats:", error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการซิงค์ข้อมูลสถิติ");
    } finally {
      setIsRecalculating(false);
    }
  }, [fetchInitialProducts]);

  const handleOpenMasterSheet = () => {
    if (isManagerOrOwner) {
      window.open('https://docs.google.com/spreadsheets/d/1f3ZyfZM6nwE3OSNeseMqlqElDqv7Kxt_UL3H1IPTLos/edit?usp=sharing', '_blank');
    } else {
      toast.error('คุณไม่สามารถใช้งานได้ ต้องใช้ตำแหน่ง ผู้จัดการ หรือสูงกว่า');
    }
  };

  const { 
    filteredProducts, isSearching, 
    totalItems, currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage, totalPages,
    startIndex, endIndex,
    updateCache, clearCache 
  } = useInventorySearch(
    products, debouncedSearchTerm, filterCategory, sortConfig, salesPeriod
  );

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
      if (isEdit) {
        await inventoryService.updateProduct(productData.sku, productData);
        toast.success(`อัปเดตข้อมูล ${productData.sku} เรียบร้อยแล้ว`);
      } else {
        await inventoryService.addProduct(productData);
        toast.success(`เพิ่มสินค้าใหม่ ${productData.sku} เรียบร้อยแล้ว`);
      }
      
      updateProductInState(productData, isEdit);
      updateCache(productData, isEdit);
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
  
  const handleImportSuccess = () => {
    setIsImportModalOpen(false);
    clearCache();
    fetchInitialProducts();
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

