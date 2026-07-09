import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { inventoryService } from '../../firebase/inventoryService';
import { userService } from '../../firebase/userService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export function useProductSearchActions(selectedProduct, searchInputs) {
  const [chatSuffix, setChatSuffix] = useState('ครับ');
  const [showSuffixSettings, setShowSuffixSettings] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [isSubmittingKnowledge, setIsSubmittingKnowledge] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportForm, setReportForm] = useState({ keyword: '', category: '', customerName: '', referenceLink: '' });

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

  const openReportModal = () => {
    const kw = searchInputs.search1 || searchInputs.search2 || searchInputs.search3;
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

        await addDoc(collection(db, getCollectionPath('todos')), {
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
    let shortName = selectedProduct.name || 'ไม่มีชื่อสินค้า';
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

  return {
    chatSuffix, setChatSuffix,
    showSuffixSettings, setShowSuffixSettings,
    copySuccess, setCopySuccess,
    isSubmittingKnowledge, setIsSubmittingKnowledge,
    isReportModalOpen, setIsReportModalOpen,
    isReporting, setIsReporting,
    reportForm, setReportForm,
    handleSaveSuffix, openReportModal, handleSubmitReport, submitKnowledge, handleCopyChat
  };
}
