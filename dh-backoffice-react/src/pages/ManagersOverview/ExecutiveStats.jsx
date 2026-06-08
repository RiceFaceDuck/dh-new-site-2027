import React from 'react';
import { Users, Crown } from 'lucide-react';

/**
 * 📊 ส่วนแสดงสถิติภาพรวม (Executive Stats)
 * รับ Props ข้อมูล `stats` มาจาก useManagerDashboard
 */
const ExecutiveStats = ({ stats, onOpenStaffModal, onOpenVipModal }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* 👥 Card 1: พนักงานใหม่รออนุมัติ */}
      <div 
        onClick={onOpenStaffModal}
        className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl border border-orange-200 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[12px] font-bold text-[var(--dh-text-muted)] uppercase tracking-wider mb-1">พนักงานใหม่ (รออนุมัติ)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[var(--dh-text-main)]">{stats?.pendingStaffCount || 0}</h3>
            <span className="text-sm font-medium text-orange-500">คน</span>
          </div>
        </div>
      </div>

      {/* 👑 Card 3: ลูกค้า VIP */}
      <div 
        onClick={onOpenVipModal}
        className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
          <Crown size={24} />
        </div>
        <div>
          <p className="text-[12px] font-bold text-[var(--dh-text-muted)] uppercase tracking-wider mb-1">ลูกค้าระดับ VIP</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[var(--dh-text-main)]">{stats?.vipCount || 0}</h3>
            <span className="text-sm font-medium text-amber-500">ราย</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveStats;
