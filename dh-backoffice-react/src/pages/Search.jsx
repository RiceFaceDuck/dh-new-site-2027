import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, X, RefreshCw, Info, HelpCircle, Clock, History, Send
} from 'lucide-react';
import { auth, db } from '../firebase/config';
import { inventoryService } from '../firebase/inventoryService';
import { userService } from '../firebase/userService'; 
import { doc, updateDoc, arrayUnion, collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// นำเข้า Components ย่อยที่ถูกแยกไฟล์ออกไป
import SearchHeader from '../components/search/SearchHeader';
import ProductListPanel from '../components/search/ProductListPanel';
import ProductDetailPanel from '../components/search/ProductDetailPanel';
import HistoryLogPanel from '../components/search/HistoryLogPanel';

// ============================================================================
// 1. ระบบ Highlight แยกคำได้อย่างถูกต้อง (ดั้งเดิม ไว้ที่เดิม)
// ============================================================================
const HighlightText = ({ text, highlightData }) => {
  if (!text) return <span className="text-dh-muted opacity-70">n/a</span>;
  
  if (Array.isArray(text)) {
    return text.length > 0 ? text.map((item, index) => (
      <span key={index}>
        <HighlightText text={item} highlightData={highlightData} />
        {index < text.length - 1 ? ', ' : ''}
      </span>
    )) : <span className="text-dh-muted opacity-70">n/a</span>;
  }

  if (typeof text !== 'string') return text;

  let parts = [{ text, isMatch: false, className: '' }];

  highlightData.forEach(({ term, colorClass }) => {
    if (!term.trim()) return;
    const lowerTerm = term.toLowerCase();
    let newParts = [];

    parts.forEach(part => {
      if (part.isMatch) {
        newParts.push(part);
        return;
      }

      const lowerPart = part.text.toLowerCase();
      let start = 0;
      let matchIdx = lowerPart.indexOf(lowerTerm, start);

      while (matchIdx !== -1) {
        if (matchIdx > start) {
          newParts.push({ text: part.text.slice(start, matchIdx), isMatch: false, className: '' });
        }
        newParts.push({ text: part.text.slice(matchIdx, matchIdx + term.length), isMatch: true, className: colorClass });
        start = matchIdx + term.length;
        matchIdx = lowerPart.indexOf(lowerTerm, start);
      }
      if (start < part.text.length) {
        newParts.push({ text: part.text.slice(start), isMatch: false, className: '' });
      }
    });
    parts = newParts;
  });

  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className={part.isMatch ? `${part.className} rounded-[4px] px-1 py-0.5` : ''}>{part.text}</span>
      ))}
    </>
  );
};

// ============================================================================
// 2. Main Component (จัดการ State ตาม Logic เดิม 100%)
// ============================================================================
export default function Search() {
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await inventoryService.getAllActiveProductsForSearch();
      setAllProducts(data);
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

  const highlightData = [
    { term: search1.trim(), colorClass: 'bg-yellow-200/90 text-yellow-900 font-bold border-b-2 border-yellow-500 shadow-sm' },
    { term: search2.trim(), colorClass: 'bg-cyan-200/90 text-cyan-900 font-bold border-b-2 border-cyan-500 shadow-sm' },
    { term: search3.trim(), colorClass: 'bg-pink-200/90 text-pink-900 font-bold border-b-2 border-pink-500 shadow-sm' }
  ];

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
    await inventoryService.reportNonExisting(reportForm, auth.currentUser?.uid);
    setIsReporting(false);
    setIsReportModalOpen(false);
    alert('ส่งคำร้องแจ้งจัดซื้อสินค้าสำเร็จ! ฝ่ายจัดซื้อจะตรวจสอบข้อมูลนี้ใน To-do');
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
    searchInputRef.current?.focus();
  };

  return (
    <div className="max-w-[1920px] mx-auto h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-300 overflow-hidden bg-dh-base text-dh-main">
      
      {/* --- ส่วนที่ 1: Header Search --- */}
      <SearchHeader 
        search1={search1} setSearch1={setSearch1}
        search2={search2} setSearch2={setSearch2}
        search3={search3} setSearch3={setSearch3}
        loading={loading} resetSearch={resetSearch}
        searchInputRef={searchInputRef}
        setIsManualModalOpen={setIsManualModalOpen}
        openReportModal={openReportModal}
      />

      {/* Main Content Area - ปรับลด Gap เพื่อความ Compact และเรียบง่าย */}
      <div className="flex-1 flex min-h-0 overflow-hidden gap-3 p-3 md:p-4">
        
        {/* --- ส่วนที่ 2: Product List Panel (ด้านซ้าย) --- */}
        <ProductListPanel 
          filteredProducts={filteredProducts}
          search1={search1} search2={search2} search3={search3}
          selectedProduct={selectedProduct}
          handleSelectProduct={handleSelectProduct}
          getStockStatus={getStockStatus}
          highlightData={highlightData}
          HighlightText={HighlightText}
        />

        {/* --- ส่วนที่ 3: Product Detail Panel (ตรงกลาง) --- */}
        <ProductDetailPanel 
          selectedProduct={selectedProduct}
          highlightData={highlightData}
          copySuccess={copySuccess} handleCopyChat={handleCopyChat}
          showSuffixSettings={showSuffixSettings} setShowSuffixSettings={setShowSuffixSettings}
          chatSuffix={chatSuffix} handleSaveSuffix={handleSaveSuffix}
          setIsImageModalOpen={setIsImageModalOpen}
          getStockStatus={getStockStatus}
          showCommentInput={showCommentInput} setShowCommentInput={setShowCommentInput}
          newComment={newComment} setNewComment={setNewComment} handleAddComment={handleAddComment}
          isSubmittingComment={isSubmittingComment}
          combinedComments={combinedComments} commentIndex={commentIndex} setCommentIndex={setCommentIndex}
          isSubmittingKnowledge={isSubmittingKnowledge} submitKnowledge={submitKnowledge}
          substitutes={substitutes} handleSelectProduct={handleSelectProduct}
          HighlightText={HighlightText}
        />

        {/* --- ส่วนที่ 4: History Log Panel (ด้านขวา) --- */}
        <HistoryLogPanel 
          selectedProduct={selectedProduct}
          setIsHistoryModalOpen={setIsHistoryModalOpen}
          loadingHistory={loadingHistory}
          historyLogs={historyLogs}
        />

      </div>

      {/* ========================================== */}
      {/* --- ส่วน Modals (อัปเกรด UI ให้เข้า Theme) --- */}
      {/* ========================================== */}
      
      {/* Modal คู่มือการใช้งาน - ดีไซน์ Clean & Compact */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-2xl shadow-dh-elevated w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-base px-6 py-4 border-b border-dh-border flex justify-between items-center">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-base">
                <HelpCircle size={18} className="text-dh-accent"/>
                คู่มือการใช้งาน Product Search+
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1.5 rounded-lg hover:bg-dh-border/50 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4 text-sm text-dh-main bg-dh-surface">
              <p className="font-semibold text-dh-accent">ระบบ Zero-Read Search ลดเวลาในการหาสินค้า</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
                  <div>ช่อง <strong>K1 (คีย์เวิร์ดหลัก)</strong>: สำหรับใส่คำค้นหาหลัก เช่น ชื่อรุ่น หรือ แบรนด์</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                  <div>ช่อง <strong>K2 และ K3</strong>: สำหรับกรองข้อมูลให้แคบลง เช่น สี, ขนาด, หรือจุดสังเกต</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1.5 shrink-0"></div>
                  <div>
                    ใช้คีย์ลัด <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">Ctrl</kbd> + <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">F</kbd> เพื่อเริ่มค้นหาได้ทันทีโดยไม่ต้องใช้เมาส์คลิก
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1.5 shrink-0"></div>
                  <div>
                    ปุ่ม <kbd className="bg-dh-base border border-dh-border text-dh-muted rounded px-1.5 py-0.5 text-xs mx-1">X</kbd> ภายในช่องค้นหา และปุ่ม <strong>ล้างค่า</strong> เพื่อความรวดเร็วในการ Reset
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                  <div className="text-red-700">
                    หากเจอคำว่า <strong>หมดสต๊อก</strong> หรือ <strong className="text-yellow-600">ใกล้หมด</strong> ให้ระมัดระวังในการขาย
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal History แบบเต็มจอ - Compact & System Colors */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-2xl shadow-dh-elevated w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-surface px-6 py-4 border-b border-dh-border flex justify-between items-center z-10">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-base">
                <History size={18} className="text-dh-muted"/>
                ประวัติความเคลื่อนไหว (History Log)
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1.5 rounded-lg hover:bg-dh-base transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-dh-base custom-scrollbar relative">
               {loadingHistory ? (
                  <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-dh-muted" size={24}/></div>
                ) : historyLogs.length > 0 ? (
                  <div className="max-w-3xl mx-auto relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-dh-border">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group mb-6 last:mb-0">
                        {/* Timeline Icon */}
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-dh-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                          log.action === 'Create' ? 'bg-emerald-500' : 
                          log.action === 'Update' ? 'bg-blue-500' : 
                          log.action === 'Approve' ? 'bg-teal-500' : 'bg-slate-400'
                        }`}>
                           <span className="text-white font-bold text-xs">{log.action.substring(0, 1)}</span>
                        </div>
                        {/* Timeline Content */}
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl bg-dh-surface border border-dh-border shadow-sm hover:border-dh-accent/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-dh-muted bg-dh-base px-2 py-0.5 rounded border border-dh-border uppercase tracking-wide">{log.module} / {log.action}</span>
                            <span className="text-[10px] font-medium text-dh-muted flex items-center gap-1">
                              <Clock size={10}/> {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-dh-main mt-1.5 leading-relaxed">{log.details}</p>
                          <div className="mt-2 pt-2 border-t border-dh-border text-[11px] text-dh-muted flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-dh-base flex items-center justify-center font-bold text-dh-accent border border-dh-border">{log.actorName?.substring(0,1) || log.performedBy?.substring(0,1) || 'U'}</div>
                            <span>{log.actorName || log.performedBy}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full opacity-50">
                    <History size={32} className="text-dh-muted mb-2" />
                    <p className="text-sm font-semibold text-dh-muted">ไม่มีประวัติการเคลื่อนไหว</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Modal แจ้งจัดซื้อ - Compact & Professional */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-dh-surface rounded-2xl shadow-dh-elevated w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="bg-dh-surface px-6 py-4 border-b border-dh-border flex justify-between items-center">
              <h3 className="font-bold text-dh-main flex items-center gap-2 text-base">
                <PlusCircle size={18} className="text-dh-accent"/>
                แจ้งเพิ่มสินค้าใหม่
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1.5 rounded-lg hover:bg-dh-base transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4 bg-dh-base/50">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-dh-muted uppercase tracking-wide flex items-center gap-1">
                  คำค้นหาที่ลูกค้าต้องการ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" required 
                  value={reportForm.keyword} 
                  onChange={e => setReportForm({...reportForm, keyword: e.target.value})} 
                  className="w-full p-2.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-sm transition-all" 
                  placeholder="เช่น Adapter Swift 7520" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">หมวดหมู่โดยประมาณ</label>
                  <input 
                    type="text" 
                    value={reportForm.category} 
                    onChange={e => setReportForm({...reportForm, category: e.target.value})} 
                    className="w-full p-2.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-sm transition-all"
                    placeholder="เช่น Adapter" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">ชื่อลูกค้า (ถ้ามี)</label>
                  <input 
                    type="text" 
                    value={reportForm.customerName} 
                    onChange={e => setReportForm({...reportForm, customerName: e.target.value})} 
                    className="w-full p-2.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-sm transition-all"
                    placeholder="เช่น คุณสมชาย" 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide flex items-center justify-between">
                  ลิงก์อ้างอิง <span className="text-[9px] font-normal normal-case">(Shopee, Web ฯลฯ)</span>
                </label>
                <input 
                  type="url" 
                  value={reportForm.referenceLink} 
                  onChange={e => setReportForm({...reportForm, referenceLink: e.target.value})} 
                  className="w-full p-2.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-sm transition-all"
                  placeholder="https://..." 
                />
              </div>

              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mt-1">
                <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-dh-muted leading-relaxed">
                  ส่งเรื่องเข้า <span className="text-blue-600 font-semibold">To-do ของผู้จัดการและฝ่ายจัดซื้อ</span>
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isReporting} 
                  className="w-full py-2.5 bg-dh-accent hover:bg-dh-accent-hover text-white font-bold rounded-lg shadow-sm transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-70"
                >
                  {isReporting ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>} 
                  {isReporting ? 'กำลังส่งข้อมูล...' : 'ยืนยันส่งเรื่อง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal รูปภาพ (Lightbox) - Clean View */}
      {isImageModalOpen && selectedProduct?.images?.[0] && (
        <div 
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-lg z-10">
            <X size={24}/>
          </button>
          <div className="relative max-w-5xl max-h-full flex flex-col items-center justify-center w-full h-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedProduct.images[0]} 
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain bg-dh-surface ring-1 ring-white/10" 
              draggable="true" 
              alt="Product Detail"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
               <p className="text-white/80 font-medium select-none bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs shadow-lg flex items-center gap-2 border border-white/10">
                 <Info size={14} className="text-dh-accent"/> ลากรูปภาพไปวางในแชตได้โดยตรง
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}