import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';

// 🔐 App ID logic matching the rest of the app
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

const PartnerReviews = ({ partnerId, ownerId, currentUser }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const isOwner = currentUser && (currentUser.uid === ownerId || currentUser.uid === partnerId);

  useEffect(() => {
    if (!partnerId) return;

    const reviewsRef = collection(db, 'artifacts', appId, 'public', 'data', 'partner_reviews', partnerId, 'comments');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = [];
      snapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    });

    return () => unsubscribe();
  }, [partnerId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
    if (!newReview.trim()) return alert('กรุณาระบุความคิดเห็น');

    try {
      setIsSubmitting(true);
      const reviewsRef = collection(db, 'artifacts', appId, 'public', 'data', 'partner_reviews', partnerId, 'comments');
      
      await addDoc(reviewsRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'ผู้ใช้งาน',
        userPhoto: currentUser.photoURL || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop',
        rating: rating,
        comment: newReview.trim(),
        createdAt: serverTimestamp(),
        ownerLiked: false,
        ownerReply: null
      });

      setNewReview('');
      setRating(5);
    } catch (error) {
      console.error('Error adding review:', error);
      alert('เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHeart = async (reviewId, currentStatus) => {
    if (!isOwner) return;
    try {
      const reviewRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_reviews', partnerId, 'comments', reviewId);
      await updateDoc(reviewRef, {
        ownerLiked: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling heart:', error);
    }
  };

  const handleSubmitReply = async (reviewId) => {
    if (!isOwner) return;
    if (!replyText.trim()) return;

    try {
      const reviewRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_reviews', partnerId, 'comments', reviewId);
      await updateDoc(reviewRef, {
        ownerReply: {
          text: replyText.trim(),
          createdAt: new Date().toISOString()
        }
      });
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('เกิดข้อผิดพลาดในการตอบกลับ');
    }
  };

  // Helper to format date safely
  const formatDate = (timestamp) => {
    if (!timestamp) return 'กำลังประมวลผล...';
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          รีวิวและคะแนนจากลูกค้า
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center bg-amber-50 px-4 py-2 rounded-xl">
            <span className="text-2xl font-black text-amber-600 mr-2">{avgRating}</span>
            <div className="flex text-amber-500 text-sm">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? 'fill-current' : 'text-amber-200'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-slate-500 text-sm font-medium">({reviews.length} รีวิว)</span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {currentUser && !isOwner && (
        <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-brand/30 focus-within:bg-white">
          <div className="flex items-start gap-4">
            <img src={currentUser.photoURL || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop'} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transform transition-transform hover:scale-110"
                  >
                    <svg className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'text-amber-500 fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="แบ่งปันประสบการณ์การใช้บริการของคุณกับร้านนี้..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none h-20 text-slate-700 placeholder-slate-400 p-0"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newReview.trim()}
                  className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {(!currentUser && reviews.length === 0) && (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-2">ยังไม่มีรีวิวสำหรับร้านค้านี้</p>
          <p className="text-sm text-slate-400">ล็อกอินเข้าสู่ระบบเพื่อเป็นคนแรกที่รีวิว!</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="group flex gap-4">
            <img src={review.userPhoto} alt={review.userName} className="w-12 h-12 rounded-full border border-slate-200 shadow-sm object-cover" />
            <div className="flex-1">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 relative">
                
                {/* Heart Button for Owner */}
                {isOwner && (
                  <button 
                    onClick={() => handleToggleHeart(review.id, review.ownerLiked)}
                    className="absolute top-4 right-4 focus:outline-none transform transition-transform hover:scale-110"
                    title={review.ownerLiked ? "เลิกถูกใจ" : "ถูกใจรีวิวนี้"}
                  >
                    <svg className={`w-6 h-6 transition-colors ${review.ownerLiked ? 'text-rose-500 fill-current' : 'text-slate-300 hover:text-rose-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill={review.ownerLiked ? "currentColor" : "none"}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
                {/* Visual Indicator of Owner Like for everyone else */}
                {!isOwner && review.ownerLiked && (
                   <div className="absolute top-4 right-4 flex items-center text-rose-500 text-xs font-medium bg-rose-50 px-2 py-1 rounded-full">
                     <svg className="w-3.5 h-3.5 mr-1 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                     เจ้าของร้านถูกใจสิ่งนี้
                   </div>
                )}

                <div className="flex items-center gap-2 mb-1 pr-10">
                  <h4 className="font-bold text-slate-800">{review.userName}</h4>
                  <span className="text-xs text-slate-400">• {formatDate(review.createdAt)}</span>
                </div>
                
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                
                {/* Reply Action for Owner */}
                {isOwner && !review.ownerReply && replyingTo !== review.id && (
                  <button 
                    onClick={() => setReplyingTo(review.id)}
                    className="mt-3 text-sm font-medium text-brand hover:text-brand-dark transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    ตอบกลับในฐานะเจ้าของร้าน
                  </button>
                )}
              </div>

              {/* Reply Input Form */}
              {replyingTo === review.id && (
                <div className="mt-3 ml-6 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                    ร้าน
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="พิมพ์ข้อความตอบกลับ..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleSubmitReply(review.id)}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      ส่ง
                    </button>
                    <button 
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Reply Display */}
              {review.ownerReply && (
                <div className="mt-3 ml-6 sm:ml-12 flex gap-3 relative before:absolute before:-left-6 before:top-4 before:w-4 before:h-px before:bg-slate-200">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0 ring-4 ring-white shadow-sm z-10">
                    ร้าน
                  </div>
                  <div className="flex-1 bg-brand/5 border border-brand/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-brand text-sm">การตอบกลับจากเจ้าของร้าน</h4>
                      <span className="text-xs text-brand/60">• {formatDate(review.ownerReply.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{review.ownerReply.text}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerReviews;
