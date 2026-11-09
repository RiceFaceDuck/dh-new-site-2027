import React from 'react';
import { Eye } from 'lucide-react';

/**
 * ป้ายแสดงยอดการเข้าชมหน้าร้านพาร์ทเนอร์ (All-time & Today Views)
 * ตามหลัก Calm UI (ป้ายนิ่ง ไม่กระพริบ ไร้แอนิเมชัน) และ Border Radius 0.1 (rounded-[2px])
 * 
 * @param {Object} props
 * @param {number} [props.viewCount=0] ยอดเข้าชมสะสมทั้งหมด
 * @param {number} [props.todayViewCount=0] ยอดเข้าชมวันนี้
 * @param {{ allTime?: number, today?: number }} [props.views] ออบเจกต์สถิติสแต็กคู่
 * @param {string} [props.className] Class เสริม
 */
const StoreViewBadge = ({
  viewCount = 0,
  todayViewCount = 0,
  views = null,
  className = ''
}) => {
  const allTimeVal = Number(views?.allTime ?? viewCount ?? 0);
  const todayVal = Number(views?.today ?? todayViewCount ?? 0);

  const formattedViews = allTimeVal.toLocaleString();
  const formattedToday = todayVal.toLocaleString();

  return (
    <div
      title={`ยอดเข้าชมหน้าร้านทั้งหมด: ${formattedViews} ครั้ง (วันนี้: ${formattedToday} ครั้ง)`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/90 rounded-[2px] select-none ${className}`}
    >
      <Eye size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
      <span>
        เข้าชม <strong className="font-semibold text-slate-700">{formattedViews}</strong> ครั้ง
        <span className="text-slate-300 mx-1">•</span>
        <span className="text-slate-500">วันนี้ <strong className="font-medium text-slate-700">{formattedToday}</strong></span>
      </span>
    </div>
  );
};

export default React.memo(StoreViewBadge);
