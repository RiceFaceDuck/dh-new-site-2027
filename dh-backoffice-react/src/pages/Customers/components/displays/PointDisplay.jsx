import { useCustomerFinancials } from '../../hooks/useCustomerFinancials';
import { Loader2 } from 'lucide-react';

/**
 * Component สำหรับแสดงผลคะแนนสะสม (Credit Points)
 * นำไปใช้ใน Table Row หรือ Detail Panel เพื่อให้แสดงผลแบบ Real-time
 */
export default function PointDisplay({ customerId, customer, className = '', live = false }) {
  const targetId = live ? (customerId || customer?.id || customer?.uid) : null;
  const { creditPoints, loading } = useCustomerFinancials(targetId);

  let points = live 
    ? (loading ? (customer?.totalAccumulatedPoints ?? customer?.creditPoints ?? 0) : (creditPoints ?? 0))
    : Number(customer?.totalAccumulatedPoints ?? customer?.creditPoints ?? customer?.points ?? 0);

  if (live && loading && targetId && creditPoints === undefined) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Loader2 size={14} className="animate-spin text-slate-300" />
      </div>
    );
  }

  const formatted = points.toLocaleString('th-TH');

  return (
    <span 
      translate="no" 
      className={`notranslate font-mono tracking-tight ${
        className || (points > 0 ? 'text-amber-600 font-bold text-[13px]' : 'text-slate-400 font-normal text-[12px]')
      }`}
    >
      {formatted}
    </span>
  );
}