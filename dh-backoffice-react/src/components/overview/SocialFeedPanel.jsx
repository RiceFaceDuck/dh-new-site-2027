import React from 'react';
import { MessageCircle, Heart, Share2, ThumbsUp, Activity, MessageSquare } from 'lucide-react';

export const SocialFeedPanel = () => {
  // Mocked data for Social Movement
  const socialEvents = [
    { id: 1, type: 'review', user: 'คุณลูกค้า น่ารัก', text: 'สินค้าคุณภาพดีมาก จัดส่งไว แอดมินตอบคำถามเคลียร์ดีค่ะ', time: '5 นาทีที่แล้ว', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 2, type: 'like', user: 'Somchai', text: 'กดถูกใจสินค้า "ASUS ROG Screen"', time: '12 นาทีที่แล้ว', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 3, type: 'comment', user: 'Nuttapong', text: 'สอบถามครับ ตัวนี้ใส่กับรุ่น Swift 3 ได้ไหมครับ?', time: '35 นาทีที่แล้ว', icon: MessageCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 4, type: 'heart', user: 'Wiriya', text: 'กดหัวใจบทความ "วิธีเช็คแบตเตอรี่เสื่อม"', time: '1 ชม. ที่แล้ว', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 5, type: 'share', user: 'Ploy', text: 'แชร์โปรโมชั่นลดราคาประจำเดือนไปที่ Facebook', time: '2 ชม. ที่แล้ว', icon: Share2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  ];

  return (
    <div className="bg-dh-surface rounded-md shadow-dh-card border border-dh-border p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-dh-border">
        <div>
          <h3 className="text-xl font-black text-dh-main flex items-center gap-2">
            <Activity className="text-pink-500" size={24} strokeWidth={2.5} />
            ความเคลื่อนไหว Social
          </h3>
          <p className="text-xs text-dh-muted mt-1 font-medium">กิจกรรมล่าสุดจากหน้าเว็บหลัก (Real-time)</p>
        </div>
        <div className="animate-pulse flex items-center justify-center w-10 h-10 rounded-md bg-pink-500/10 text-pink-500 border border-pink-500/20 print:hidden">
          <Heart size={20} className="fill-current" />
        </div>
      </div>

      <div className="relative pl-3">
        {/* เส้นเชื่อม Timeline */}
        <div className="absolute top-4 bottom-4 left-[23px] w-0.5 bg-dh-border rounded-full print:hidden"></div>

        <div className="space-y-5">
          {socialEvents.map((event, index) => (
            <div key={event.id} className="flex gap-4 items-start group relative">
              {/* จุดวงกลมบน Timeline */}
              <div className="mt-1.5 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-dh-surface shadow-sm transition-all duration-300 ${index === 0 ? `${event.color} border-current shadow-md group-hover:scale-110` : 'border-dh-border text-dh-muted group-hover:border-dh-accent group-hover:text-dh-accent'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? `bg-current animate-ping` : 'bg-transparent'}`}></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0 bg-dh-base border border-dh-border p-3.5 rounded-md hover:border-pink-500/30 hover:shadow-md transition-all group-hover:bg-dh-surface">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-black text-dh-main flex items-center gap-2">
                    {event.user}
                    <span className={`flex items-center justify-center w-5 h-5 rounded-md ${event.bg} ${event.color} ${event.border} border shadow-sm`}>
                      <event.icon size={10} />
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-dh-muted flex items-center gap-1 shrink-0 bg-dh-surface px-2 py-1 rounded-sm border border-dh-border shadow-sm">
                    {event.time}
                  </p>
                </div>
                <p className="text-xs font-medium text-dh-main/80 line-clamp-2 leading-relaxed">
                  {event.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
