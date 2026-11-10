import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { productReviewService } from '../../firebase/productReviewService';
import { storageService } from '../../firebase/storageService';
import { compressImage } from '../../utils/imageCompressor';
import { useToast } from '../../context/ToastContext';

export const PRODUCT_QUICK_REVIEWS = [
  "สินค้าตรงปก ใช้งานได้ดี",
  "แพ็คสินค้ามาแน่นหนามาก",
  "จัดส่งรวดเร็วทันใจ",
  "คุณภาพดี คุ้มราคา",
  "ใช้งานได้ปกติ ไม่มีปัญหา"
];

export const useProductReviews = (productId, reviewCount = 0, inView = true) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const reviewTextRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // 📸 Image Attachment State & Compression
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
    
    // 🛡️ Zero-Leak: ถ้าสินค้านี้ไม่มีรีวิวตั้งแต่ต้น ไม่ต้องยิง Firestore
    if (reviewCount === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await productReviewService.getReviews(
        productId, 
        5, 
        isInitial ? null : lastDoc
      );
      
      if (!isMountedRef.current) return;
      if (isInitial) {
        setComments(result.reviews);
      } else {
        setComments(prev => [...prev, ...result.reviews]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error loading reviews:", error);
      if (error.message && error.message.toLowerCase().includes('index')) {
        showToast("ไม่สามารถโหลดรีวิวได้: ขาด Index ใน Firestore (ดู Link ใน Console)", "error");
      } else if (error.message && error.message.toLowerCase().includes('permission')) {
        showToast("ไม่สามารถโหลดรีวิวได้: ไม่มีสิทธิ์การเข้าถึง (Permission Denied)", "error");
      } else {
        showToast("ไม่สามารถโหลดรีวิวได้: " + (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ"), "error");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [productId, loading, lastDoc, showToast, reviewCount]);

  useEffect(() => {
    // 🛡️ Viewport Lazy Fetch: ยิงโหลดเฉพาะเมื่อลูกค้าเลื่อนหน้าจอลงมาถึง และมีรีวิวจริง
    if (productId && inView && reviewCount > 0) {
      loadComments(true);
    }
  }, [productId, inView, reviewCount]);

  // 📸 ฟังก์ชันเลือกและบีบอัดภาพรีวิวสินค้าหน้าบ้าน
  const handleImageSelect = useCallback(async (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      // 🚀 บีบอัดภาพหน้าบ้านทันที ให้ขนาดไฟล์เหลือ ~80-120KB คงคุณภาพความคมชัด
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
        mimeType: 'image/webp'
      });

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Error compressing product review image:", err);
      showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'error');
    } finally {
      setIsCompressing(false);
    }
  }, [imagePreview, showToast]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  // 💬 ฟังก์ชันแทรกคำพูด Quick รีวิวอย่างเป็นธรรมชาติ
  const handleQuickReview = useCallback((phrase) => {
    setReviewText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return phrase;
      if (trimmed.includes(phrase)) return trimmed; // ไม่แทรกคำเดิมซ้ำ
      return `${trimmed} ${phrase}`;
    });
  }, []);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว", "warning");
      return;
    }
    
    const textToSend = reviewText.trim() || reviewTextRef.current?.value?.trim() || '';
    if (!textToSend) {
      showToast("กรุณาเขียนความคิดเห็น", "warning");
      return;
    }

    try {
      setSubmitting(true);
      let uploadedImageUrl = null;

      // 🚀 อัปโหลดรูปภาพที่ผ่านการบีบอัดแล้วขึ้น Storage
      if (imageFile) {
        uploadedImageUrl = await storageService.uploadReviewImage(imageFile, currentUser.uid);
      }
      
      const newReview = {
        rating,
        text: textToSend,
        imageUrl: uploadedImageUrl || null
      };
      
      await productReviewService.addReview(productId, newReview, currentUser);
      
      showToast("ขอบคุณสำหรับรีวิวของคุณ!", "success");
      setReviewText('');
      if (reviewTextRef.current) reviewTextRef.current.value = '';
      setRating(5);
      handleRemoveImage();
      
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
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนกดถูกใจรีวิวครับ", "info");
      return;
    }
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
    reviewText,
    setReviewText,
    reviewTextRef,
    imageFile,
    imagePreview,
    isCompressing,
    handleImageSelect,
    handleRemoveImage,
    handleQuickReview,
    quickReviews: PRODUCT_QUICK_REVIEWS,
    submitting,
    loadMore: () => loadComments(false),
    handleSubmit,
    handleLike
  };
};
