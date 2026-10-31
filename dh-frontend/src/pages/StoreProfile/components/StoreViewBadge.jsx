import React from 'react';
import { Eye } from 'lucide-react';

/**
 * ป้ายแสดงยอดการเข้าชมหน้าร้านพาร์ทเนอร์ (All-time Views)
 * ตามหลัก Calm UI (ป้ายนิ่ง ไม่กระพริบ) และ Border Radius 0.1 (rounded-[2px])
 * 
 * @param {Object} props
 * @param {number} props.viewCount ยอดเข้าชมสะสม
 * @param {string} [props.className] Class เสริม
 */
const StoreViewBadge = ({
  viewCount = 0,
  className = ''
}) => {
  const formattedViews = Number(viewCount || 0).toLocaleString();

  return (
    <div
      title={`ยอดเข้าชมหน้าร้านทั้งหมด: ${formattedViews} ครั้ง`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/90 rounded-[2px] select-none ${className}`}
    >
      <Eye size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
      <span>
        เข้าชม <strong className="font-semibold text-slate-700">{formattedViews}</strong> ครั้ง
      </span>
    </div>
  );
};

export default React.memo(StoreViewBadge);
