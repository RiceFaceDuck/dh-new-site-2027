import React from 'react';
import { Phone, Building2, Crown, User, Star, TrendingUp } from 'lucide-react';

export default function CustomerRow({ customer, isSelected, onSelect }) {
  // ฟังก์ชันสำหรับจัดรูปแบบสีและไอคอนตามระดับของลูกค้า (Rank/Role)
  const getRankBadge = (rank) => {
    const r = rank?.toLowerCase() || 'customer';
    if (r.includes('vip')) {
      return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Crown size={12} className="mr-1" /> };
    }
    if (r.includes('partner')) {
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Star size={12} className="mr-1" /> };
    }
    if (r.includes('wholesale')) {
      return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Building2 size={12} className="mr-1" /> };
    }
    return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <User size={12} className="mr-1" /> };
  };

  const badge = getRankBadge(customer.rank || customer.role);
  const displayName = customer.accountName || customer.displayName || 'ไม่มีชื่อ';
  const displayCode = customer.customerCode || '';

  return (
    <div 
      onClick={() => onSelect(customer)}
      className={`
        p-4 border-b border-dh-border cursor-pointer transition-all duration-200
        hover:bg-dh-surface/80 group flex justify-between items-start gap-4
        ${isSelected ? 'bg-dh-surface border-l-4 border-l-dh-accent' : 'border-l-4 border-l-transparent bg-dh-base'}
      `}
    >
      {/* ฝั่งซ้าย: ข้อมูลหลัก (ชื่อ, รหัส, ผู้ติดต่อ, ขนส่ง) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-semibold text-dh-main truncate text-base">
            {displayName}
          </span>
          {displayCode && (
            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md whitespace-nowrap">
              {displayCode}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dh-muted mt-1">
          {(customer.contactName || customer.phone) && (
            <div className="flex items-center gap-1.5">
              <Phone size={14} className="text-dh-muted/70" />
              <span className="truncate max-w-[180px]">
                {customer.contactName} {customer.phone && `(${customer.phone})`}
              </span>
            </div>
          )}
          
          {customer.logisticProvider && (
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-dh-muted/70" />
              <span className="truncate max-w-[150px]">{customer.logisticProvider}</span>
            </div>
          )}
        </div>
      </div>

      {/* ฝั่งขวา: สถานะบัญชี และ ข้อมูลสถิติ */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className={`flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-sm ${badge.color}`}>
          {badge.icon}
          {(customer.rank || customer.role || 'Customer').toUpperCase()}
        </div>
        
        {customer.stats?.totalSales > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            <TrendingUp size={12} />
            ยอดซื้อ ฿{customer.stats.totalSales.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}