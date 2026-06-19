import { useState, useMemo } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export function useProductComments(selectedProduct, setSelectedProduct, setAllProducts) {
  const [newComment, setNewComment] = useState('');
  const [commentIndex, setCommentIndex] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

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
    combinedComments,
    resetCommentState
  };
}
