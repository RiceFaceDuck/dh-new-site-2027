import { useState } from 'react';
import { Star, MessageCircle, Loader2, Send, ThumbsUp, MoreHorizontal, Sparkles, X } from 'lucide-react';
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
  const [lightboxImage, setLightboxImage] = useState(null);

  const {
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
    imageFile,
    imagePreview,
    isCompressing,
    handleImageSelect,
    handleRemoveImage,
    handleQuickReview,
    quickReviews,
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

      {/* Modern Clean Review Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-start gap-3">
          <img 
            src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=0D8ABC&color=fff`} 
            alt="User" 
            className="w-10 h-10 rounded-full border border-slate-200 shadow-2xs shrink-0 mt-1"  
            loading="lazy" 
          />
          <div className="flex-1 min-w-0">
            {/* Star Rating Header */}
            <div className="flex items-center gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-hidden transform transition-transform hover:scale-110"
                >
                  <Star 
                    size={20} 
                    className={`transition-colors ${
                      (hoverRating || rating) >= star 
                        ? "text-amber-400 fill-amber-400" 
                        : "text-slate-300 hover:text-amber-400"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-400 font-medium ml-1.5">
                {rating === 5 ? 'ยอดเยี่ยมมาก' : rating === 4 ? 'ดีมาก' : rating === 3 ? 'พอใช้' : rating === 2 ? 'ควรปรับปรุง' : 'แย่มาก'}
              </span>
            </div>

            {/* 💬 Quick Reviews: ชิปคำพูดธรรมชาติแท้จริงสำหรับสินค้า */}
            {quickReviews && quickReviews.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className="text-[11px] text-slate-400 font-medium mr-1">เลือกคำด่วน:</span>
                {quickReviews.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReview(phrase)}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200/70 text-slate-600 transition-all cursor-pointer font-medium select-none shadow-2xs"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            )}

            {/* Modern Input Box with Enclosed Attachment & Submit Button */}
            <div className="bg-white rounded-[2px] border border-slate-200 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 shadow-2xs p-3">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={currentUser ? "แบ่งปันประสบการณ์การใช้งานสินค้านี้..." : "กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวสินค้า..."}
                disabled={submitting || !currentUser}
                className="w-full bg-transparent border-none focus:outline-hidden focus:ring-0 resize-none h-20 text-slate-700 placeholder-slate-400 p-0 text-sm leading-relaxed disabled:opacity-50"
              />

              {/* Enclosed Action Bar (Left: Attachment Icon & Preview, Right: Submit Button) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                <div className="flex items-center gap-2.5">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="product-review-image"
                    accept="image/*"
                    disabled={!currentUser || submitting}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageSelect(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* 📸 Image Attachment Icon Button (styled as blue picture icon) */}
                  <label
                    htmlFor={currentUser ? "product-review-image" : undefined}
                    onClick={() => { if (!currentUser) handleSubmit(); }}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-[6px] bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 cursor-pointer transition-colors shadow-2xs group ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="แนบรูปภาพสินค้า (บีบอัดขนาดอัตโนมัติ)"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    ) : (
                      <svg className="w-4 h-4 text-sky-600 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </label>

                  {/* Image Preview Thumbnail with Close Button */}
                  {imagePreview && (
                    <div className="relative inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-[2px]">
                      <img
                        src={imagePreview}
                        alt="Thumbnail preview"
                        className="w-7 h-7 object-cover rounded-[2px] border border-slate-200"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">แนบภาพแล้ว</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
                        title="ยกเลิกรูปภาพ"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    {reviewText.length > 0 ? `${reviewText.length} ตัวอักษร` : ''}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || isCompressing || !currentUser || !reviewText.trim()}
                    className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      <>
                        <span>ส่งรีวิว</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {!currentUser && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                *กรุณาเข้าสู่ระบบก่อนถึงจะสามารถให้คะแนนและรีวิวสินค้าได้
              </p>
            )}
          </div>
        </div>
      </form>

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

              {/* 📸 Attached Product Review Image */}
              {comment.imageUrl && (
                <div className="mt-2 mb-3">
                  <img
                    src={comment.imageUrl}
                    alt="Product review attachment"
                    className="max-h-44 sm:max-h-56 rounded-[2px] border border-slate-200 object-cover cursor-pointer hover:opacity-95 transition-opacity shadow-2xs"
                    onClick={() => setLightboxImage(comment.imageUrl)}
                    loading="lazy"
                  />
                </div>
              )}
              
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

      {/* 🔍 Lightbox สำหรับดูรูปภาพรีวิวสินค้าขนาดใหญ่ */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img 
              src={lightboxImage} 
              alt="Enlarged product review" 
              className="max-w-full max-h-[85vh] object-contain rounded-[2px] shadow-2xl" 
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 p-1 flex items-center gap-1 text-sm"
            >
              <X className="w-5 h-5" /> ปิด
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
