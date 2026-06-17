import { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../../firebase/config';
import { inventoryService } from '../../firebase/inventoryService';
import { userService } from '../../firebase/userService'; 
import { doc, updateDoc, arrayUnion, collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export function useProductSearch() {
  const [search1, setSearch1] = useState(''); 
  const [search2, setSearch2] = useState(''); 
  const [search3, setSearch3] = useState(''); 
  
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  
  const searchInputRef = useRef(null);

  const [chatSuffix, setChatSuffix] = useState('ครับ');
  const [showSuffixSettings, setShowSuffixSettings] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [commentIndex, setCommentIndex] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false); 

  const [isSubmittingKnowledge, setIsSubmittingKnowledge] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({ keyword: '', category: '', customerName: '', referenceLink: '' });

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
      // Check for Ctrl+F or Cmd+F (Use e.code to handle Thai keyboard layout properly)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Delay focus slightly to ensure browser default is fully overridden
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select(); // Select existing text for quick typing
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
    
    // Attach to document to catch event as early as possible
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const cachedProducts = sessionStorage.getItem('cachedSearchProducts');
        const cachedTime = sessionStorage.getItem('cachedSearchProductsTime');
        
        // ใช้ Cache เป็นเวลา 1 ชั่วโมงเพื่อประหยัด Firebase Reads
        if (cachedProducts && cachedTime && (Date.now() - parseInt(cachedTime) < 3600000)) {
          setAllProducts(JSON.parse(cachedProducts));
          setLoading(false);
          return;
        }

        const data = await inventoryService.getAllActiveProductsForSearch();
        setAllProducts(data);
        sessionStorage.setItem('cachedSearchProducts', JSON.stringify(data));
        sessionStorage.setItem('cachedSearchProductsTime', Date.now().toString());
      } catch (error) {
        console.error("Error fetching products", error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetchHistoryLogs = async () => {
      setLoadingHistory(true);
      try {
        const qTarget = query(collection(db, 'history_logs'), where('targetId', '==', selectedProduct.sku), limit(20));
        const snap = await getDocs(qTarget);
        let logs = snap.docs.map(d => ({id: d.id, ...d.data()}));
        logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); 
        setHistoryLogs(logs);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistoryLogs();
  }, [selectedProduct?.sku]);

  const filteredProducts = useMemo(() => {
    if (!search1.trim() && !search2.trim() && !search3.trim()) {
      return allProducts.slice(0, 15); 
    }
    
    const term1 = search1.toLowerCase();
    const term2 = search2.toLowerCase();
    const term3 = search3.toLowerCase();

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
        (product.compatibleModels && product.compatibleModels.some(m => m.toLowerCase().includes(term))) ||
        (product.compatiblePartNumbers && product.compatiblePartNumbers.some(pn => pn.toLowerCase().includes(term))) ||
        (product.substituteSkus && product.substituteSkus.some(sub => sub.toLowerCase().includes(term))) ||
        (product.tags && product.tags.some(t => t.toLowerCase().includes(term)))
      );
    };

    return allProducts.filter(p => checkMatch(p, term1) && checkMatch(p, term2) && checkMatch(p, term3)).slice(0, 50);
  }, [search1, search2, search3, allProducts]);

  const highlightData = useMemo(() => [
    { term: search1.trim(), colorClass: 'bg-yellow-200/90 text-yellow-900 font-bold border-b-2 border-yellow-500 shadow-sm' },
    { term: search2.trim(), colorClass: 'bg-cyan-200/90 text-cyan-900 font-bold border-b-2 border-cyan-500 shadow-sm' },
    { term: search3.trim(), colorClass: 'bg-pink-200/90 text-pink-900 font-bold border-b-2 border-pink-500 shadow-sm' }
  ], [search1, search2, search3]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSubstitutes([]);
    setCopySuccess(false);
    setShowSuffixSettings(false);
    setNewComment('');
    setShowCommentInput(false);
    
    const legacyCount = product.comment ? 1 : 0;
    const internalCount = product.internalComments ? product.internalComments.length : 0;
    setCommentIndex(Math.max(0, (legacyCount + internalCount) - 1));
    
    setIsImageModalOpen(false);
    
    if (product.substituteSkus && product.substituteSkus.length > 0) {
      const subs = allProducts.filter(p => product.substituteSkus.includes(p.sku));
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedProduct) return;
    setIsSubmittingComment(true);
    try {
      const commentObj = {
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        uid: auth.currentUser?.uid || 'system',
      };
      
      const docRef = doc(db, 'products', selectedProduct.sku);
      await updateDoc(docRef, {
        internalComments: arrayUnion(commentObj)
      });

      const updatedComments = [...(selectedProduct.internalComments || []), commentObj];
      setSelectedProduct({ ...selectedProduct, internalComments: updatedComments });
      
      setAllProducts(prev => prev.map(p => p.sku === selectedProduct.sku ? { ...p, internalComments: updatedComments } : p));
      
      setNewComment('');
      const legacyCount = selectedProduct.comment ? 1 : 0;
      setCommentIndex(legacyCount + updatedComments.length - 1); 
      setShowCommentInput(false); 

    } catch (error) {
      console.error("Error adding comment:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก Comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const combinedComments = useMemo(() => {
    if (!selectedProduct) return [];
    let list = [];
    if (selectedProduct.comment && typeof selectedProduct.comment === 'string') {
      list.push({ text: selectedProduct.comment, timestamp: null, isLegacy: true });
    }
    if (Array.isArray(selectedProduct.internalComments)) {
      list = [...list, ...selectedProduct.internalComments];
    }
    return list;
  }, [selectedProduct]);

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
    allProducts, loading, selectedProduct, substitutes, searchInputRef,
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
