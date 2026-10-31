import React from 'react';
import { Heart } from 'lucide-react';

/**
 * ปุ่มกดไลก์แบบแยกชิ้นส่วน (Separate Button & Display Badge)
 * รองรับ 2 เลย์เอาต์:
 * 1. horizontal: แนวนอนคู่กัน สำหรับหน้าจอ PC (ปุ่มหัวใจ + ป้ายตัวเลข)
 * 2. vertical-stacked: เรียงแนวตั้ง 2 บรรทัด สำหรับจอมือถือ (บรรทัด 2: ป้ายตัวเลข, บรรทัด 3: ปุ่มหัวใจ)
 * 
 * @param {Object} props
 * @param {number} props.likeCount จำนวนไลก์ปัจจุบัน
 * @param {boolean} props.isLiked สถานะว่าเคยกดไลก์แล้วหรือไม่
 * @param {boolean} props.isLiking กำลังประมวลผลอยู่หรือไม่
 * @param {Function} props.onToggleLike ฟังก์ชันสลับสถานะไลก์
 * @param {'horizontal' | 'vertical-stacked'} [props.layout='horizontal'] รูปแบบการจัดวาง
 * @param {string} [props.className] Class เสริม
 */
const StoreLikeButton = ({
  likeCount = 0,
  isLiked = false,
  isLiking = false,
  onToggleLike,
  layout = 'horizontal',
  className = ''
}) => {
  // 📱 เลย์เอาต์แนวตั้งสำหรับจอมือถือ (บรรทัด 2: ตัวเลข, บรรทัด 3: ปุ่มหัวใจ)
  if (layout === 'vertical-stacked') {
    return (
      <div className={`flex flex-col items-center gap-1.5 select-none ${className}`}>
        {/* บรรทัด 2: ข้อมูลตัวเลข ถูกใจ X */}
        <div
          title={`จำนวนผู้ถูกใจ: ${Number(likeCount).toLocaleString()} คน`}
          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[2px] border transition-colors ${
            isLiked
              ? 'bg-rose-50/80 border-rose-300 text-rose-700'
              : 'bg-slate-50 border-slate-200/90 text-slate-600'
          }`}
        >
          <span>
            ถูกใจ <strong className="font-semibold">{Number(likeCount).toLocaleString()}</strong>
          </span>
        </div>

        {/* บรรทัด 3: ปุ่มกดหัวใจ ( ❤️ ) */}
        <button
          type="button"
          onClick={onToggleLike}
          disabled={isLiking}
          title={isLiked ? 'ยกเลิกถูกใจร้านค้านี้' : 'กดถูกใจร้านค้านี้'}
          className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-90 hover:scale-110 ${
            isLiked
              ? 'bg-rose-600 ring-2 ring-rose-400 ring-offset-1 shadow-md shadow-rose-200'
              : 'bg-[#f43f5e] hover:bg-rose-600 hover:shadow-sm'
          }`}
        >
          <Heart
            size={16}
            className="fill-white text-white transition-transform duration-200 group-hover:scale-110"
          />
        </button>
      </div>
    );
  }

  // 🖥️ เลย์เอาต์แนวนอนสำหรับหน้าจอ PC (ปุ่มหัวใจ + ป้ายตัวเลข)
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* 🔴 1. ปุ่มหัวใจทรงกลมสีแดงสด */}
      <button
        type="button"
        onClick={onToggleLike}
        disabled={isLiking}
        title={isLiked ? 'ยกเลิกถูกใจร้านค้านี้' : 'กดถูกใจร้านค้านี้'}
        className={`group relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-90 hover:scale-110 ${
          isLiked
            ? 'bg-rose-600 ring-2 ring-rose-400 ring-offset-1 shadow-md shadow-rose-200'
            : 'bg-[#f43f5e] hover:bg-rose-600 hover:shadow-sm'
        }`}
      >
        <Heart
          size={14}
          className="fill-white text-white transition-transform duration-200 group-hover:scale-110"
        />
      </button>

      {/* 🏷️ 2. กรอบแสดงผล "ถูกใจ X" */}
      <div
        title={`จำนวนผู้ถูกใจ: ${Number(likeCount).toLocaleString()} คน`}
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-[2px] border transition-colors ${
          isLiked
            ? 'bg-rose-50/80 border-rose-300 text-rose-700'
            : 'bg-slate-50 border-slate-200/90 text-slate-600'
        }`}
      >
        <span>
          ถูกใจ <strong className="font-semibold">{Number(likeCount).toLocaleString()}</strong>
        </span>
      </div>
    </div>
  );
};

export default React.memo(StoreLikeButton);
