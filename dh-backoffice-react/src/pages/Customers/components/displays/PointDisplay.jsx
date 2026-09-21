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
    ? (loading ? (customer?.creditPoints ?? customer?.totalAccumulatedPoints ?? 0) : (creditPoints ?? 0))
    : Number(customer?.creditPoints ?? customer?.totalAccumulatedPoints ?? customer?.points ?? 0);

  // Bonus calculation from 30D sales if available
  const sales30Days = Number(customer?.sales30Days || customer?.stats?.sales30Days || customer?.totalSpent || 0);
  if (sales30Days > 100) {
    const calcPoints = Math.floor(sales30Days / 100);
    if (calcPoints > points) {
      points = calcPoints;
    }
  }

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