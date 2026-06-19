import { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../../firebase/config';
import { inventoryService } from '../../firebase/inventoryService';
import { inventoryQueryService } from '../../firebase/inventory/inventoryQueryService';
import { gasStockService } from '../../firebase/gasStockService';
import { userService } from '../../firebase/userService'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { useProductHistory } from './useProductHistory';
import { useProductComments } from './useProductComments';
import useDebounce from '../../hooks/useDebounce';

const SEARCH_CACHE_KEY = 'search_hybrid_cache';
const SEARCH_CACHE_EXPIRY = 'search_hybrid_cache_expiry';
const CACHE_TTL = 2 * 60 * 60 * 1000;

export function useProductSearch() {
  const [search1, setSearch1] = useState(''); 
  const [search2, setSearch2] = useState(''); 
  const [search3, setSearch3] = useState(''); 
  
  const debouncedSearch1 = useDebounce(search1, 300);
  const debouncedSearch2 = useDebounce(search2, 300);
  const debouncedSearch3 = useDebounce(search3, 300);
  
  const [initialProducts, setInitialProducts] = useState([]);
  const [gasProductsCache, setGasProductsCache] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  
  const searchInputRef = useRef(null);

  const [chatSuffix, setChatSuffix] = useState('ครับ');
  const [showSuffixSettings, setShowSuffixSettings] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [isSubmittingKnowledge, setIsSubmittingKnowledge] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({ keyword: '', category: '', customerName: '', referenceLink: '' });

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // ✨ Hooks ที่แยกตามหลัก SRP
  const { historyLogs, loadingHistory, isHistoryModalOpen, setIsHistoryModalOpen } = useProductHistory(selectedProduct);
  const { 
    newComment, setNewComment, commentIndex, setCommentIndex, 
    isSubmittingComment, showCommentInput, setShowCommentInput, 
    handleAddComment, combinedComments, resetCommentState 
  } = useProductComments(selectedProduct, setSelectedProduct, (updater) => {
    setInitialProducts(updater);
    if (gasProductsCache) setGasProductsCache(updater);
  });

  useEffect(() => {
    if (auth.currentUser) {
      const savedSuffix = localStorage.getItem(`chatSuffix_${auth.currentUser.uid}`);
      if (savedSuffix) setChatSuffix(savedSuffix);
    }
  }, []);

  const handleSaveSuffix = (suffix) => {
    setChatSuffix(suffix);
    if (auth.currentUser) {
      localStorage.setItem(`chatSuffix_${auth.currentUser.uid}`, suffix);
    }
    setShowSuffixSettings(false);
  };

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

  // ✨ Hybrid Cache Fetching
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // 1. ดึงของ 50 ชิ้นแรกจาก Firebase แบบไวๆ และได้รูปภาพครบ (ประหยัดกว่าดึงทั้งหมด)
        const { products } = await inventoryQueryService.getPaginatedProducts(50);
        setInitialProducts(products);

        // 2. ดึงข้อมูล 5,000 ชิ้นจาก Google Sheet (ประหยัด 100% Reads)
        const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
        const expiry = sessionStorage.getItem(SEARCH_CACHE_EXPIRY);
        
        if (cached && expiry && new Date().getTime() < Number(expiry)) {
          setGasProductsCache(JSON.parse(cached));
        } else {
          const gasData = await gasStockService.fetchBackupInventory();
          setGasProductsCache(gasData);
          try {
            sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(gasData));
            sessionStorage.setItem(SEARCH_CACHE_EXPIRY, String(new Date().getTime() + CACHE_TTL));
          } catch (e) {
            console.warn("Storage full", e);
          }
        }
      } catch (error) {
        console.error("Error fetching products", error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const mergedProducts = useMemo(() => {
    const base = gasProductsCache || initialProducts;
    return base.map(cacheProduct => {
      const fullProduct = initialProducts.find(p => p.sku === cacheProduct.sku);
      return fullProduct ? { ...cacheProduct, ...fullProduct } : cacheProduct;
    });
  }, [gasProductsCache, initialProducts]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch1.trim() && !debouncedSearch2.trim() && !debouncedSearch3.trim()) {
      return mergedProducts.slice(0, 15); 
    }
    
    const term1 = debouncedSearch1.toLowerCase();
    const term2 = debouncedSearch2.toLowerCase();
    const term3 = debouncedSearch3.toLowerCase();

    const checkMatch = (product, term) => {
      if (!term) return true; 
      return (
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term)) ||
        (product.warehouseLocation && product.warehouseLocation.toLowerCase().includes(term)) ||
        (product.shortDescription && product.shortDescription.toLowerCase().includes(term)) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.sellingModel && product.sellingModel.toLowerCase().includes(term)) ||
        (product.compatibleModels && product.compatibleModels?.some(m => m.toLowerCase().includes(term))) ||
        (product.compatiblePartNumbers && product.compatiblePartNumbers?.some(pn => pn.toLowerCase().includes(term))) ||
        (product.substituteSkus && product.substituteSkus?.some(sub => sub.toLowerCase().includes(term))) ||
        (product.tags && product.tags?.some(t => t.toLowerCase().includes(term)))
      );
    };

    return mergedProducts.filter(p => checkMatch(p, term1) && checkMatch(p, term2) && checkMatch(p, term3)).slice(0, 50);
  }, [debouncedSearch1, debouncedSearch2, debouncedSearch3, mergedProducts]);

  const highlightData = useMemo(() => [
    { term: debouncedSearch1.trim(), colorClass: 'bg-yellow-200/90 text-yellow-900 font-bold border-b-2 border-yellow-500 shadow-sm' },
    { term: debouncedSearch2.trim(), colorClass: 'bg-cyan-200/90 text-cyan-900 font-bold border-b-2 border-cyan-500 shadow-sm' },
    { term: debouncedSearch3.trim(), colorClass: 'bg-pink-200/90 text-pink-900 font-bold border-b-2 border-pink-500 shadow-sm' }
  ], [debouncedSearch1, debouncedSearch2, debouncedSearch3]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSubstitutes([]);
    setCopySuccess(false);
    setShowSuffixSettings(false);
    resetCommentState(product);
    
    setIsImageModalOpen(false);
    
    if (product.substituteSkus && product.substituteSkus.length > 0) {
      const subs = mergedProducts.filter(p => product.substituteSkus.includes(p.sku));
      setSubstitutes(subs);
    }
  };

  const openReportModal = () => {
    const kw = search1 || search2 || search3;
    setReportForm({ keyword: kw, category: '', customerName: '', referenceLink: '' });
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.keyword.trim()) return;
    setIsReporting(true);
    try {
      await inventoryService.reportNonExisting(reportForm, auth.currentUser?.uid);
      alert('ส่งคำร้องแจ้งจัดซื้อสินค้าสำเร็จ! ฝ่ายจัดซื้อจะตรวจสอบข้อมูลนี้ใน To-do');
      setIsReportModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการส่งคำร้อง');
    } finally {
      setIsReporting(false);
    }
  };

  const submitKnowledge = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedProduct || isSubmittingKnowledge) return;
    
    const typeLabel = type === 'model' ? 'รุ่น (Model)' : 'พาร์ท (Part No.)';
    const value = window.prompt(`เสนอเพิ่มข้อมูลให้ ${selectedProduct.sku} (${typeLabel}):\n* ข้อมูลนี้จะถูกส่งไปให้ผู้จัดการอนุมัติก่อนแสดงผลจริง`);
    
    if (value && value.trim()) {
      setIsSubmittingKnowledge(true);
      try {
        const currentUser = auth.currentUser;
        let userName = currentUser?.email || 'System';
        
        if (currentUser?.uid) {
          const profile = await userService.getUserProfile(currentUser.uid);
          if (profile) {
            userName = profile.nickname || profile.firstName || userName;
          }
        }

        await addDoc(collection(db, 'todos'), {
          type: 'KNOWLEDGE_APPROVAL',
          title: `ขอเพิ่มข้อมูล ${typeLabel} สำหรับ ${selectedProduct.sku}`,
          description: `พนักงานเสนอเพิ่มข้อมูล:\nSKU: ${selectedProduct.sku}\nข้อมูลที่เสนอ: ${value.trim()}`,
          priority: "Medium",
          status: "pending_manager",
          referenceType: "Product",
          referenceId: selectedProduct.sku,
          payload: {
            sku: selectedProduct.sku,
            productName: selectedProduct.name,
            knowledgeType: type,
            proposedValue: value.trim()
          },
          createdByUid: currentUser?.uid || 'system',
          createdByName: userName, 
          handledBy: null, 
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert('ส่งคำร้องเพิ่มข้อมูลสำเร็จ รอผู้จัดการตรวจสอบครับ 🚀');
      } catch (error) {
        console.error("Submit Knowledge Error:", error);
        alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${error.message}`);
      } finally {
        setIsSubmittingKnowledge(false); 
      }
    }
  };

  const handleCopyChat = (e) => {
    e.stopPropagation();
    if (!selectedProduct) return;
    let shortName = selectedProduct.name;
    if (shortName.length > 40) {
      shortName = shortName.substring(0, 40) + '...';
    }
    const textToCopy = `${selectedProduct.sku} ${shortName}\nราคา ${selectedProduct.retailPrice?.toLocaleString()} บาท ${chatSuffix}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        alert("ไม่สามารถ Copy ได้อัตโนมัติ กรุณากด Copy เอง");
      }
      document.body.removeChild(textArea);
    });
  };

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
    loading, selectedProduct, substitutes, searchInputRef,
    chatSuffix, showSuffixSettings, setShowSuffixSettings, copySuccess,
    newComment, setNewComment, commentIndex, setCommentIndex,
    isSubmittingComment, showCommentInput, setShowCommentInput,
    isSubmittingKnowledge, isImageModalOpen, setIsImageModalOpen,
    isReportModalOpen, setIsReportModalOpen, isReporting, reportForm, setReportForm,
    isManualModalOpen, setIsManualModalOpen, isHistoryModalOpen, setIsHistoryModalOpen,
    historyLogs, loadingHistory, filteredProducts, highlightData,
    handleSelectProduct, openReportModal, handleSubmitReport, submitKnowledge,
    handleCopyChat, handleAddComment, combinedComments, getStockStatus, resetSearch, handleSaveSuffix
  };
}
