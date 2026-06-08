import React from 'react';
import { useCustomerFinancials } from '../../hooks/useCustomerFinancials';
import { Loader2 } from 'lucide-react';

/**
 * Component สำหรับแสดงผลคะแนนสะสม (Credit Points)
 * นำไปใช้ใน Table Row หรือ Detail Panel เพื่อให้แสดงผลแบบ Real-time
 */
export default function PointDisplay({ customerId, className = '' }) {
  // ดึงข้อมูล Real-time ผ่าน Custom Hook ที่สร้างไว้
  const { creditPoints, loading } = useCustomerFinancials(customerId);

  // สถานะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Loader2 size={14} className="animate-spin text-slate-300" />
      </div>
    );
  }

  // กรณีมีแต้มสะสม
  if (creditPoints > 0) {
    return (
      <span className={`text-[13px] font-mono font-bold text-amber-600 tracking-tight ${className}`}>
        {creditPoints.toLocaleString('th-TH')}
      </span>
    );
  }

  // กรณีไม่มีแต้มสะสม (0 แต้ม)
  return (
    <span className={`text-[12px] font-mono font-normal text-slate-300 ${className}`}>
      -
    </span>
  );
}