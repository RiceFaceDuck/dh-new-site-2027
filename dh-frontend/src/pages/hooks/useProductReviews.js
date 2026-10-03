import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { productReviewService } from '../../firebase/productReviewService';
import { useToast } from '../../context/ToastContext';

export const useProductReviews = (productId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const reviewTextRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const loadComments = useCallback(async (isInitial = false) => {
    if (!productId || (loading && !isInitial)) return;
    
    try {
      setLoading(true);
      const result = await productReviewService.getReviews(
        productId, 
        5, 
        isInitial ? null : lastDoc
      );
      
      if (isInitial) {
        setComments(result.reviews);
      } else {
        setComments(prev => [...prev, ...result.reviews]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading reviews:", error);
      if (error.message && error.message.toLowerCase().includes('index')) {
        showToast("ไม่สามารถโหลดรีวิวได้: ขาด Index ใน Firestore (ดู Link ใน Console)", "error");
      } else if (error.message && error.message.toLowerCase().includes('permission')) {
        showToast("ไม่สามารถโหลดรีวิวได้: ไม่มีสิทธิ์การเข้าถึง (Permission Denied)", "error");
      } else {
        showToast("ไม่สามารถโหลดรีวิวได้: " + (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ"), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [productId, loading, lastDoc, showToast]);

  useEffect(() => {
    if (productId) {
      loadComments(true);
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว", "warning");
      return;
    }
    
    const reviewText = reviewTextRef.current?.value || '';
    if (!reviewText.trim()) {
      showToast("กรุณาเขียนความคิดเห็น", "warning");
      return;
    }

    try {
      setSubmitting(true);
      
      const newReview = {
        rating,
        text: reviewText.trim()
      };
      
      await productReviewService.addReview(productId, newReview, currentUser);
      
      showToast("ขอบคุณสำหรับรีวิวของคุณ!", "success");
      if (reviewTextRef.current) reviewTextRef.current.value = '';
      setRating(5);
      
      // Reload comments to show the new one
      loadComments(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast("เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId, currentLikes, hasLikedLocal) => {
    if (hasLikedLocal) return; // Prevent spam clicking temporarily

    // Optimistic UI update
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: (currentLikes || 0) + 1, hasLikedLocal: true } : c
    ));
    
    try {
      await productReviewService.likeReview(commentId);
    } catch (error) {
      console.error("Error liking review:", error);
      // Revert optimistic update
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: currentLikes, hasLikedLocal: false } : c
      ));
      showToast("ไม่สามารถบันทึกถูกใจได้ กรุณาลองใหม่", "error");
    }
  };

  return {
    currentUser,
    comments,
    hasMore,
    loading,
    rating,
    setRating,
    hoverRating,
    setHoverRating,
    reviewTextRef,
    submitting,
    loadMore: () => loadComments(false),
    handleSubmit,
    handleLike
  };
};
