import { Star, MessageCircle, Loader2, Send, ThumbsUp, MoreHorizontal, Sparkles } from 'lucide-react';
import { useProductReviews } from '../../pages/hooks/useProductReviews';
import useInView from '../../hooks/useInView';

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

export default function ProductCommunitySection({ productId, reviewCount = 0, averageRating = 0 }) {
  const [inViewRef, inView] = useInView({ rootMargin: '200px 0px' });
  const {
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
    loadMore,
    handleSubmit,
    handleLike
  } = useProductReviews(productId, reviewCount, inView);

  return (
    <div ref={inViewRef} className="bg-slate-50/50 p-4 md:p-6 flex flex-col h-full border-t border-slate-200 mt-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <MessageCircle size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                ความคิดเห็นและรีวิว
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 leading-none">
                {reviewCount}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {reviewCount > 0 ? (
                <>
                  <StarDisplay val={Math.round(averageRating)} />
                  <p className="text-xs font-bold text-slate-700">
                    {Number(averageRating || 0).toFixed(1)} <span className="text-slate-400 font-normal">/ 5.0</span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-400">ยังไม่มีรีวิว ร่วมแชร์ประสบการณ์เป็นคนแรก</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-md border border-slate-200 p-3.5 mb-6 shadow-xs">
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
          
          <div className="relative bg-white rounded-md border border-slate-200 p-1 flex items-center shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ml-2 shrink-0 border border-slate-100">
              <img 
                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=0D8ABC&color=fff`} 
                alt="Me" 
                className="w-full h-full object-contain" 
               loading="lazy" />
            </div>
            <input 
              ref={reviewTextRef}
              type="text" 
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder={currentUser ? "เขียนความคิดเห็น หรือสอบถามข้อมูล..." : "กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว..."} 
              disabled={submitting || !currentUser}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 outline-hidden text-slate-700 placeholder-slate-400 disabled:opacity-50"
            />
            <button 
              onClick={handleSubmit}
              disabled={submitting || !currentUser}
              className="bg-blue-600 text-white p-2 rounded-md mr-1 hover:bg-blue-700 transition-colors flex items-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
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
              <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full object-contain border border-slate-200 shadow-xs"  loading="lazy" />
              {comment.verified && (
                <div className="absolute -bottom-1 -right-1 bg-cyber-emerald text-white rounded-full p-0.5 border-2 border-white shadow-xs" title="DH Verified Buyer">
                  <Sparkles size={10} />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">{comment.userName}</span>
                  {comment.verified && <span className="text-[10px] font-bold text-cyber-emerald bg-emerald-50 px-1.5 py-0.5 rounded-xs">VERIFIED</span>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{comment.timeAgo || "เมื่อสักครู่"}</span>
              </div>
              
              <div className="mb-2">
                <StarDisplay val={comment.rating} />
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-2 wrap-break-word">
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
          onClick={loadMore}
          disabled={loading}
          className="w-full mt-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-cyber-blue hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "โหลดความคิดเห็นเพิ่มเติม"}
        </button>
      )}

    </div>
  );
}
