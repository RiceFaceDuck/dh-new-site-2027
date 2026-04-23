import React from 'react';
import { UserPlus, Phone, TrendingUp, TrendingDown, Crown, Shield, Star, Award } from 'lucide-react';

export default function CustomerListItem({ customer, isSelected, onClick }) {
  
  // 🌟 ดึงข้อมูล 30 Days Stats ออกมาเตรียมแสดงผล
  const sales30 = customer.stats?.last30DaysSales || 0;
  const returns30 = customer.stats?.last30DaysReturnAmount || 0;
  
  // 🌟 Logic การประมวลผลตำแหน่ง และ VIP
  const isVIP = customer.rank === 'VIP' || customer.role === 'VIP';
  const rankDisplay = customer.rank && customer.rank !== 'Customer' ? customer.rank : '';
  const roleDisplay = customer.role && customer.role !== 'Customer' ? customer.role : '';

  return (
    <div 
      onClick={onClick}
      className={`p-3 mb-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected 
          ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
          : 'bg-white border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md hover:bg-gray-50/50'
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* Avatar Section */}
        <div className="relative shrink-0 mt-1">
          {customer.isManualAccount ? (
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-inner">
              {customer.accountName?.charAt(0) || <UserPlus size={16}/>}
            </div>
          ) : (
            customer.photoURL ? (
              <img src={customer.photoURL} alt="profile" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
                {customer.displayName?.charAt(0) || customer.accountName?.charAt(0) || 'C'}
              </div>
            )
          )}
          {/* VIP Indicator Dot on Avatar */}
          {isVIP && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm" title="VIP Customer">
              <Star size={10} fill="currentColor" />
            </div>
          )}
        </div>

        {/* Data Section */}
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800 text-sm truncate pr-2" title={customer.accountName || customer.displayName}>
              {customer.accountName || customer.displayName || 'ไม่มีชื่อร้าน'}
            </h3>
          </div>
          
          <div className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-2 truncate">
            <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{customer.customerCode || customer.id.substring(0,6)}</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><Phone size={10}/> {customer.phone || '-'}</span>
          </div>

          {/* 🌟 Ranks & Titles (ยศ / ฉายา / VIP) */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {isVIP && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 text-yellow-900 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shadow-sm">
                <Crown size={10} className="text-yellow-600"/> VIP
              </span>
            )}
            {!isVIP && rankDisplay && (
              <span className="flex items-center gap-1 bg-purple-100 border border-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shadow-sm">
                <Shield size={10}/> {rankDisplay}
              </span>
            )}
            {roleDisplay && roleDisplay !== rankDisplay && (
              <span className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-800 text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm">
                <Award size={10} className="text-gray-600"/> ฉายา: {roleDisplay}
              </span>
            )}
          </div>
          
          {/* 🌟 30 Days Stats (ยอดขาย / ยอดคืน) - เน้นกรอบให้ชัดเจนขึ้นลดความขาวโพลน */}
          <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-gray-50/80 rounded-lg border border-gray-200 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500"/> ยอดขาย (30 วัน)
              </span>
              <span className={`text-sm font-black mt-1 ${sales30 > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                ฿{sales30.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col border-l border-gray-300 pl-2.5">
              <span className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1">
                <TrendingDown size={12} className="text-red-400"/> ยอดคืน (30 วัน)
              </span>
              <span className={`text-sm font-black mt-1 ${returns30 > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                ฿{returns30.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}