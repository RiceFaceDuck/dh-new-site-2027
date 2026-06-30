import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Send, Sparkles, Star, Loader2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { productReviewService } from '../../firebase/productReviewService';
import { useToast } from '../../context/ToastContext';

export default function ProductCommunitySection({ productId, reviewCount = 0, averageRating = 0 }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (productId) {
      loadComments(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadComments = async (isInitial = false) => {
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
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      showToast("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว", "warning");
      return;
    }
    
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
      setReviewText('');
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
      // Revert on error
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: currentLikes, hasLikedLocal: false } : c
      ));
      showToast("ไม่สามารถกดถูกใจได้", "error");
    }
  };

  // Helper component for Star Rating (Display)
  const StarDisplay = ({ val }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={12} 
            className={star <= val ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-50/30 p-6 md:p-8 flex flex-col h-full border-t border-slate-200 mt-0 shadow-inner">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyber-blue to-indigo-500 flex items-center justify-center text-white shadow-md">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Community & Reviews
              <span className="bg-cyber-blue/10 text-cyber-blue text-xs px-2 py-0.5 rounded-full font-bold">{reviewCount}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StarDisplay val={Math.round(averageRating)} />
              <p className="text-xs font-bold text-slate-700">{averageRating.toFixed(1)} <span className="text-slate-400 font-normal">/ 5.0</span></p>
            </div>
          </div>
        </div>
        
        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors group">
            <Heart size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button className="p-2 text-slate-400 hover:text-cyber-blue hover:bg-blue-50 rounded-full transition-colors group">
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-xl border border-slate-300 p-4 mb-8 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-700">ให้คะแนนสินค้าชิ้นนี้</span>
          <div className="flex gap-1 cursor-pointer">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                size={22} 
                className={`transition-all hover:scale-110 ${
                  (hoverRating || rating) >= star 
                    ? "text-amber-400 fill-amber-400" 
                    : "text-slate-300 hover:text-amber-400"
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 to-indigo-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white rounded-xl border border-slate-200 p-1 flex items-center shadow-sm focus-within:border-cyber-blue focus-within:ring-1 focus-within:ring-cyber-blue transition-all">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ml-2 shrink-0 border border-slate-100">
              <img 
                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=0D8ABC&color=fff`} 
                alt="Me" 
                className="w-full h-full object-cover" 
              />
            </div>
            <input 
              type="text" 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder={currentUser ? "เขียนความคิดเห็น หรือสอบถามข้อมูล..." : "กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว..."} 
              disabled={submitting || !currentUser}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 outline-none text-slate-700 placeholder-slate-400 disabled:opacity-50"
            />
            <button 
              onClick={handleSubmit}
              disabled={submitting || !currentUser}
              className="bg-cyber-blue text-white p-2.5 rounded-lg mr-1 hover:bg-blue-600 transition-colors flex items-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-bold hidden sm:inline-block pl-2">POST</span>
                  <Send size={16} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
        {!currentUser && (
          <p className="text-xs text-amber-500 mt-2 font-medium px-2">
            *คุณต้องล็อกอินก่อนถึงจะสามารถให้คะแนนและรีวิวสินค้าได้
          </p>
        )}
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {comments.length === 0 && !loading && (
          <div className="text-center text-slate-400 py-10 text-sm">
            ยังไม่มีความคิดเห็นสำหรับสินค้านี้ เป็นคนแรกที่รีวิวสิ!
          </div>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="group/comment flex gap-4 animate-fade-in">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
              {comment.verified && (
                <div className="absolute -bottom-1 -right-1 bg-cyber-emerald text-white rounded-full p-0.5 border-2 border-white shadow-sm" title="DH Verified Buyer">
                  <Sparkles size={10} />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">{comment.userName}</span>
                  {comment.verified && <span className="text-[10px] font-bold text-cyber-emerald bg-emerald-50 px-1.5 py-0.5 rounded-sm">VERIFIED</span>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{comment.timeAgo || "เมื่อสักครู่"}</span>
              </div>
              
              <div className="mb-2">
                <StarDisplay val={comment.rating} />
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-2 break-words">
                {comment.text}
              </p>
              
              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <button 
                  onClick={() => handleLike(comment.id, comment.likes, comment.hasLikedLocal)}
                  className={`flex items-center gap-1.5 transition-colors group/like ${comment.hasLikedLocal ? 'text-cyber-blue' : 'hover:text-cyber-blue'}`}
                >
                  <ThumbsUp size={14} className="group-hover/like:-translate-y-0.5 transition-transform" /> 
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                  <span className="hidden sm:inline-block">Like</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
                  <MessageCircle size={14} /> Reply
                </button>
                <button className="ml-auto opacity-0 group-hover/comment:opacity-100 hover:bg-slate-100 p-1 rounded-full transition-all">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 size={24} className="animate-spin text-cyber-blue" />
          </div>
        )}
      </div>

      {/* Footer Action */}
      {hasMore && (
        <button 
          onClick={() => loadComments(false)}
          disabled={loading}
          className="w-full mt-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-cyber-blue hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "โหลดความคิดเห็นเพิ่มเติม"}
        </button>
      )}

    </div>
  );
}
