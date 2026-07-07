import { useState, useEffect, useRef, useMemo } from 'react';
import useDebounce from '../../hooks/useDebounce';
import { inventoryQueryService } from '../../firebase/inventory/inventoryQueryService';

import { useProductHistory } from './useProductHistory';
import { useProductComments } from './useProductComments';

// Sub-hooks (SRP)
import { useProductSearchQuery } from './useProductSearchQuery';
import { useProductSearchKeyboard } from './useProductSearchKeyboard';
import { useProductSearchActions } from './useProductSearchActions';

export function useProductSearch() {
  const [search1, setSearch1] = useState(''); 
  const [search2, setSearch2] = useState(''); 
  const [search3, setSearch3] = useState(''); 
  
  const debouncedSearch1 = useDebounce(search1, 300);
  const debouncedSearch2 = useDebounce(search2, 300);
  const debouncedSearch3 = useDebounce(search3, 300);
  
  const [stockFilter, setStockFilter] = useState('ALL'); 
  const [selectedIndex, setSelectedIndex] = useState(0); 
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  
  const searchInputRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // 1. Logic for fetching & filtering (Hybrid Cache)
  const {
    loading,
    filteredProducts,
    mergedProducts,
    forceSync,
    updateProductData
  } = useProductSearchQuery(debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter);

  // 2. Logic for History
  const { historyLogs, setHistoryLogs, loadingHistory, isHistoryModalOpen, setIsHistoryModalOpen } = useProductHistory(selectedProduct);

  // 3. Logic for Comments
  const {
    newComment, setNewComment,
    isSubmittingComment,
    showCommentInput, setShowCommentInput,
    handleAddComment, handleTogglePinComment, handleDeleteNote
  } = useProductComments(selectedProduct, setSelectedProduct, updateProductData);

  const handleAddNoteSuccess = (newLog) => {
    setHistoryLogs(prev => [newLog, ...prev]);
  };

  // 4. Logic for Actions (Report, Knowledge, Copy)
  const searchInputs = useMemo(() => ({ search1, search2, search3 }), [search1, search2, search3]);
  const actionHooks = useProductSearchActions(selectedProduct, searchInputs);

  // 5. Logic for Keyboard Navigation
  const modalsState = {
    isHistoryModalOpen,
    isReportModalOpen: actionHooks.isReportModalOpen,
    isImageModalOpen,
    isGuideModalOpen
  };

  // Global Ctrl+F Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          } else {
            const el = document.getElementById('search-input-k1');
            if (el) {
              el.focus();
              el.select();
            }
          }
        }, 10);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setSubstitutes([]);
    actionHooks.setReportForm(prev => ({ ...prev, category: product.category || '' }));
    setIsImageModalOpen(false); 
    
    setNewComment('');
    setShowCommentInput(false);
    setIsImageModalOpen(false);
    
    // ✨ Live Fetch
    try {
      const liveProduct = await inventoryQueryService.getProductBySku(product.sku);
      if (liveProduct) {
        setSelectedProduct(liveProduct);
      }
    } catch (e) {
      console.warn('Live fetch failed', e);
    }
    
    if (product.substituteSkus && product.substituteSkus.length > 0) {
      const subs = mergedProducts.filter(p => product.substituteSkus.includes(p.sku));
      setSubstitutes(subs);
    }
  };

  useProductSearchKeyboard(filteredProducts, selectedIndex, setSelectedIndex, handleSelectProduct, modalsState);

  const highlightData = useMemo(() => [
    { term: debouncedSearch1.trim(), colorClass: 'bg-yellow-200/90 text-yellow-900 font-bold border-b-2 border-yellow-500 shadow-xs' },
    { term: debouncedSearch2.trim(), colorClass: 'bg-cyan-200/90 text-cyan-900 font-bold border-b-2 border-cyan-500 shadow-xs' },
    { term: debouncedSearch3.trim(), colorClass: 'bg-pink-200/90 text-pink-900 font-bold border-b-2 border-pink-500 shadow-xs' }
  ], [debouncedSearch1, debouncedSearch2, debouncedSearch3]);

  const getStockStatus = (stock, buffer) => {
    const safeBuffer = buffer || 2;
    if (stock <= 0) return { colorClass: 'text-red-600', text: 'หมดสต๊อก', bgClass: 'bg-red-50 border-red-200' };
    if (stock <= safeBuffer) return { colorClass: 'text-yellow-600', text: 'ใกล้หมด', bgClass: 'bg-yellow-50 border-yellow-200' };
    return { colorClass: 'text-emerald-600', text: 'พร้อมขาย', bgClass: 'bg-dh-surface border-dh-border' }; 
  };

  const resetSearch = () => {
    setSearch1('');
    setSearch2('');
    setSearch3('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      const el = document.getElementById('search-input-k1');
      if (el) el.focus();
    }
  };

  return {
    search1, setSearch1, search2, setSearch2, search3, setSearch3,
    stockFilter, setStockFilter, selectedIndex, forceSync,
    loading, selectedProduct, substitutes, searchInputRef,
    
    ...actionHooks, // Spreads chatSuffix, showSuffixSettings, isReportModalOpen, handleSaveSuffix, etc.

    newComment, setNewComment,
    isSubmittingComment, showCommentInput, setShowCommentInput,
    isImageModalOpen, setIsImageModalOpen,
    isHistoryModalOpen, setIsHistoryModalOpen, isGuideModalOpen, setIsGuideModalOpen,
    historyLogs, loadingHistory, filteredProducts, highlightData,
    handleSelectProduct, handleAddComment, handleAddNoteSuccess, handleTogglePinComment, handleDeleteNote, getStockStatus, resetSearch
  };
}
