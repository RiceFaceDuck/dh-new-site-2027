import React from 'react';
import { Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Send, Sparkles, Star } from 'lucide-react';

export default function ProductCommunitySection() {
  const mockComments = [
    {
      id: 1,
      user: "ช่างแอร์ตำนาน",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      text: "อะไหล่ตัวนี้ใช้ทนมากครับ สั่งไปใส่ให้ลูกค้า 3 ตัวแล้ว ยังไม่มีปัญหาเลย แนะนำครับ!",
      likes: 12,
      time: "2 ชั่วโมงที่แล้ว",
      verified: true,
      rating: 5
    },
    {
      id: 2,
      user: "DIY Master",
      avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
      text: "ตอนแรกนึกว่าจะใส่ยาก พอดีดูคลิปสอนประกอบของทางร้าน ทำตามได้สบายๆ เลย 👍",
      likes: 5,
      time: "1 วันที่แล้ว",
      verified: false,
      rating: 4
    },
    {
      id: 3,
      user: "NongNat Service",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
      text: "จัดส่งไวมาก แพ็คของมาแน่นหนาดีครับ",
      likes: 24,
      time: "3 วันที่แล้ว",
      verified: true,
      rating: 5
    }
  ];

  // Helper component for Star Rating
  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={12} 
            className={star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
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
              <span className="bg-cyber-blue/10 text-cyber-blue text-xs px-2 py-0.5 rounded-full font-bold">128</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={5} />
              <p className="text-xs font-bold text-slate-700">4.8 <span className="text-slate-400 font-normal">/ 5.0</span></p>
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
                className="text-slate-300 hover:text-amber-400 hover:fill-amber-400 transition-all hover:scale-110" 
              />
            ))}
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 to-indigo-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white rounded-xl border border-slate-200 p-1 flex items-center shadow-sm focus-within:border-cyber-blue focus-within:ring-1 focus-within:ring-cyber-blue transition-all">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ml-2 shrink-0">
              <img src="https://ui-avatars.com/api/?name=ME&background=0D8ABC&color=fff" alt="Me" className="w-full h-full object-cover" />
            </div>
            <input 
              type="text" 
              placeholder="เขียนความคิดเห็น หรือสอบถามข้อมูล..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 outline-none text-slate-700 placeholder-slate-400"
            />
            <button className="bg-cyber-blue text-white p-2.5 rounded-lg mr-1 hover:bg-blue-600 transition-colors flex items-center gap-2 group/btn">
              <span className="text-sm font-bold hidden sm:inline-block pl-2">POST</span>
              <Send size={16} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {mockComments.map((comment) => (
          <div key={comment.id} className="group/comment flex gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img src={comment.avatar} alt={comment.user} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
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
                  <span className="font-bold text-sm text-slate-800">{comment.user}</span>
                  {comment.verified && <span className="text-[10px] font-bold text-cyber-emerald bg-emerald-50 px-1.5 py-0.5 rounded-sm">VERIFIED</span>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{comment.time}</span>
              </div>
              
              <div className="mb-2">
                <StarRating rating={comment.rating} />
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-2">
                {comment.text}
              </p>
              
              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <button className="flex items-center gap-1.5 hover:text-cyber-blue transition-colors group/like">
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
      </div>

      {/* Footer Action */}
      <button className="w-full mt-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-cyber-blue hover:bg-blue-50 transition-colors">
        โหลดความคิดเห็นเพิ่มเติม
      </button>

    </div>
  );
}
