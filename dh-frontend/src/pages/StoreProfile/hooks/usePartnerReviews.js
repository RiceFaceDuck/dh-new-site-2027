import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared';
import { useToast } from '../../../context/ToastContext';
import { compressImage } from '../../../utils/imageCompressor';
import { storageService } from '../../../firebase/storageService';

export const QUICK_REVIEWS = [
  "ให้บริการดีมากเลย",
  "ซ่อมไวมาก รอรับได้เลย",
  "ราคาเป็นกันเอง คุ้มค่ามาก",
  "ร้านให้คำแนะนำได้ดี ตรงจุด",
  "ฝีมือประณีต งานเรียบร้อย"
];

export const usePartnerReviews = (partnerId, ownerId, currentUser) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📸 Image Attachment State & Compression
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const isOwner = Boolean(currentUser && (currentUser.uid === ownerId || currentUser.uid === partnerId));

  // 🧹 ทำความสะอาด Object URL เมื่อคอมโพเนนต์อันเมาท์
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!partnerId) return;

    const reviewsRef = collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = [];
      snapshot.forEach((docSnap) => {
        fetchedReviews.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReviews(fetchedReviews);
    }, (err) => {
      console.error("Error listening to partner reviews:", err);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // 📸 ฟังก์ชันเลือกและบีบอัดรูปภาพหน้าบ้านทันที
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
      console.error("Error compressing review image:", err);
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
    setNewReview((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return phrase;
      if (trimmed.includes(phrase)) return trimmed; // ไม่แทรกคำเดิมซ้ำ
      return `${trimmed} ${phrase}`;
    });
  }, []);

  const handleSubmitReview = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น', 'error');
      return;
    }
    if (!newReview.trim()) {
      showToast('กรุณาระบุความคิดเห็น', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedImageUrl = null;

      // 🚀 อัปโหลดรูปภาพที่ผ่านการบีบอัดแล้วขึ้น Storage
      if (imageFile) {
        uploadedImageUrl = await storageService.uploadReviewImage(imageFile, currentUser.uid);
      }

      const reviewsRef = collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments');

      await addDoc(reviewsRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'ผู้ใช้งาน',
        userPhoto: currentUser.photoURL || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop',
        rating: rating,
        comment: newReview.trim(),
        imageUrl: uploadedImageUrl || null,
        createdAt: serverTimestamp(),
        ownerLiked: false,
        ownerReply: null
      });

      setNewReview('');
      setRating(5);
      handleRemoveImage();
      showToast('ส่งรีวิวเรียบร้อยแล้ว ขอบคุณครับ', 'success');
    } catch (error) {
      console.error('Error adding review:', error);
      showToast('เกิดข้อผิดพลาดในการส่งรีวิว', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, newReview, rating, imageFile, handleRemoveImage, partnerId, showToast]);

  const handleToggleHeart = useCallback(async (reviewId, currentStatus) => {
    if (!isOwner) return;
    try {
      const reviewRef = doc(db, getCollectionPath('partner_reviews'), partnerId, 'comments', reviewId);
      await updateDoc(reviewRef, {
        ownerLiked: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling heart:', error);
    }
  }, [isOwner, partnerId]);

  const handleSubmitReply = useCallback(async (reviewId) => {
    if (!isOwner) return;
    if (!replyText.trim()) return;

    try {
      const reviewRef = doc(db, getCollectionPath('partner_reviews'), partnerId, 'comments', reviewId);
      await updateDoc(reviewRef, {
        ownerReply: {
          text: replyText.trim(),
          createdAt: new Date().toISOString()
        }
      });
      setReplyingTo(null);
      setReplyText('');
      showToast('ตอบกลับความคิดเห็นสำเร็จ', 'success');
    } catch (error) {
      console.error('Error adding reply:', error);
      showToast('เกิดข้อผิดพลาดในการตอบกลับ', 'error');
    }
  }, [isOwner, replyText, partnerId, showToast]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return {
    reviews,
    newReview,
    setNewReview,
    rating,
    setRating,
    hoverRating,
    setHoverRating,
    isSubmitting,
    replyText,
    setReplyText,
    replyingTo,
    setReplyingTo,
    isOwner,
    avgRating,
    imageFile,
    imagePreview,
    isCompressing,
    handleImageSelect,
    handleRemoveImage,
    handleQuickReview,
    quickReviews: QUICK_REVIEWS,
    handleSubmitReview,
    handleToggleHeart,
    handleSubmitReply
  };
};
