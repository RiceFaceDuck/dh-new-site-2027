import React from 'react';
import { useCustomerFinancials } from '../../hooks/useCustomerFinancials';
import { Loader2 } from 'lucide-react';

/**
 * Component สำหรับแสดงผลยอด "DH ค้างยอด" (Wallet Balance)
 * สามารถนำไปวางใน Table Row หรือ Detail Panel ได้ทันที
 */
export default function WalletDisplay({ customerId, className = '' }) {
  // ดึงข้อมูล Real-time ผ่าน Custom Hook ที่สร้างไว้ในขั้นตอนที่ 2
  const { walletBalance, loading } = useCustomerFinancials(customerId);

  // สถานะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Loader2 size={14} className="animate-spin text-slate-300" />
      </div>
    );
  }

  // กรณีมียอด DH ค้างยอด
  if (walletBalance > 0) {
    return (
      <span className={`text-[13px] font-mono font-bold text-emerald-600 tracking-tight ${className}`}>
        ฿{walletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
      </span>
    );
  }

  // กรณีไม่มียอด (0.00)
  return (
    <span className={`text-[12px] font-mono font-normal text-slate-300 ${className}`}>
      0.00
    </span>
  );
}