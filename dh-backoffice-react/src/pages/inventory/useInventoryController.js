import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useInventoryData from '../../components/inventory/hooks/useInventoryData';
import useInventorySearch from '../../components/inventory/hooks/useInventorySearch';
import useDebounce from '../../hooks/useDebounce';
import { inventoryService } from '../../firebase/inventoryService';
import { inventoryStatsService } from '../../firebase/inventory/inventoryStatsService';

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
    } catch (error) {
      console.error("Error recalculating stats:", error);
    } finally {
      setIsRecalculating(false);
    }
  }, [fetchInitialProducts]);

  const handleOpenMasterSheet = () => {
    if (isManagerOrOwner) {
      window.open('https://docs.google.com/spreadsheets/d/1f3ZyfZM6nwE3OSNeseMqlqElDqv7Kxt_UL3H1IPTLos/edit?usp=sharing', '_blank');
    } else {
      alert('คุณไม่สามารถใช้งานได้\nต้องใช้ตำแหน่ง ผู้จัดการ หรือสูงกว่า หรือ ตำแหน่งที่อนุมัติ ให้ใช้งานได้');
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

