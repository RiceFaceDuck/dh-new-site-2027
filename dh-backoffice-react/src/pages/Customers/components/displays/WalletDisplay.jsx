import { useCustomerFinancials } from '../../hooks/useCustomerFinancials';
import { Loader2 } from 'lucide-react';

/**
 * Component สำหรับแสดงผลยอด "DH ค้างยอด" (Wallet Balance)
 * สามารถนำไปวางใน Table Row หรือ Detail Panel ได้ทันที
 */
export default function WalletDisplay({ customerId, customer, className = '', showSymbol = false, live = false }) {
  const targetId = live ? (customerId || customer?.id || customer?.uid) : null;
  const { walletBalance, loading } = useCustomerFinancials(targetId);

  // ถ้าเป็น table row หรือไม่ live ให้ใช้ค่าจาก customer ตรงๆ ได้ทันที
  const balance = live 
    ? (loading ? (customer?.walletBalance ?? customer?.dhWallet ?? 0) : (walletBalance ?? 0))
    : Number(customer?.walletBalance ?? customer?.dhWallet ?? customer?.creditBalance ?? 0);

  if (live && loading && targetId && walletBalance === undefined) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Loader2 size={14} className="animate-spin text-slate-300" />
      </div>
    );
  }

  const formatted = balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = showSymbol ? '฿' : '';

  return (
    <span 
      translate="no" 
      className={`notranslate font-mono tracking-tight ${
        className || (balance > 0 ? 'text-rose-600 font-bold text-[13px]' : 'text-slate-400 font-normal text-[12px]')
      }`}
    >
      {symbol}{formatted}
    </span>
  );
}