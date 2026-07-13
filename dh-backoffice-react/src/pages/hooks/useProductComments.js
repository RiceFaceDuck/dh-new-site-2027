import { useState, useMemo } from 'react';
import { auth } from '../../firebase/config';
import { historyService } from '../../firebase/historyService';
import { inventoryMutationService } from '../../firebase/inventory/inventoryMutationService';

export function useProductComments(selectedProduct, setSelectedProduct, setAllProducts) {
  const [newComment, setNewComment] = useState('');
  const [commentIndex, setCommentIndex] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  // function นี้จะส่งคืน object ที่เซฟลงประวัติเพื่อเอาไปรวมกับ UI state ได้ทันที
  const handleAddComment = async (onSuccessCallback) => {
    if (!newComment.trim() || !selectedProduct) return;
    setIsSubmittingComment(true);
    try {
      const actorName = auth.currentUser?.displayName || auth.currentUser?.email || 'Staff';
      const actorUid = auth.currentUser?.uid || 'Unknown';
      
      const commentObj = {
        action: 'NOTE',
        details: newComment.trim(),
        targetId: selectedProduct.sku,
        performedBy: actorName,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
      };
      
      // ใช้ historyService.addLog แทนการเขียนลง Firestore ตรงๆ เพื่อป้องกันปัญหา Permission/Rules
      await historyService.addLog('Inventory', 'NOTE', selectedProduct.sku, newComment.trim(), actorUid);
      
      // สร้าง Object สำรองเพื่อ update UI ได้ทันที
      const localLog = {
        id: 'temp-' + Date.now(),
        ...commentObj
      };

      setNewComment('');
      setShowCommentInput(false); 

      if (onSuccessCallback) onSuccessCallback(localLog);

    } catch (error) {
      console.error("Error adding comment:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก Comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTogglePinComment = async (log) => {
    if (!selectedProduct) return;
    try {
      const currentPinned = selectedProduct.pinnedComments || [];
      const isAlreadyPinned = currentPinned.some(c => c.id === log.id);
      
      let newPinned = [];
      if (isAlreadyPinned) {
        newPinned = currentPinned.filter(c => c.id !== log.id);
      } else {
        // ปักหมุดได้สูงสุด 1 อัน ถ้ามีอยู่แล้วให้แจ้งเตือน
        if (currentPinned.length >= 1) {
          alert("คุณสามารถปักหมุดได้เพียง 1 รายการเท่านั้น กรุณาถอนหมุดเดิมออกก่อน");
          return;
        } else {
          newPinned = [...currentPinned, log];
        }
      }
      
      await inventoryMutationService.updateProduct(selectedProduct.sku, {
        pinnedComments: newPinned
      });
      
      // อัปเดต UI ทันที
      setSelectedProduct(prev => ({
        ...prev,
        pinnedComments: newPinned
      }));
      
    } catch (error) {
      console.error("Error toggling pin:", error);
      alert("เกิดข้อผิดพลาดในการปักหมุด");
    }
  };

  const handleDeleteNote = async (log) => {
    if (!selectedProduct) return;
    if (log.action?.toLowerCase() !== 'note') {
      alert("ไม่สามารถลบประวัติระบบได้ ลบได้เฉพาะโน๊ตเท่านั้น");
      return;
    }
    if (!window.confirm("คุณต้องการลบโน๊ตนี้ใช่หรือไม่?")) return;
    
    try {
      const currentDeleted = selectedProduct.deletedNotes || [];
      const currentPinned = selectedProduct.pinnedComments || [];
      
      const newDeleted = [...currentDeleted, log.id];
      const newPinned = currentPinned.filter(c => c.id !== log.id);
      
      await inventoryMutationService.updateProduct(selectedProduct.sku, {
        deletedNotes: newDeleted,
        pinnedComments: newPinned
      });
      
      // อัปเดต UI ทันที
      setSelectedProduct(prev => ({
        ...prev,
        deletedNotes: newDeleted,
        pinnedComments: newPinned
      }));
      
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("เกิดข้อผิดพลาดในการลบโน๊ต");
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

  const resetCommentState = (product) => {
    setNewComment('');
    setShowCommentInput(false);
    const legacyCount = product?.comment ? 1 : 0;
    const internalCount = product?.internalComments ? product.internalComments.length : 0;
    setCommentIndex(Math.max(0, (legacyCount + internalCount) - 1));
  };

  return {
    newComment, setNewComment,
    commentIndex, setCommentIndex,
    isSubmittingComment,
    showCommentInput, setShowCommentInput,
    handleAddComment,
    handleTogglePinComment,
    handleDeleteNote,
    combinedComments,
    resetCommentState
  };
}
