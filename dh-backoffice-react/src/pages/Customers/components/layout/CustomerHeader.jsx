import React from 'react';
import { Search, Filter, RefreshCw, UserPlus, Wallet, Star, FileText, Coins } from 'lucide-react';

export default function CustomerHeader({ 
  searchTerm, 
  onSearchChange, 
  dateFilter, 
  onDateFilterChange, 
  quickFilter,          // 💎 NEW: รับค่า State ตัวกรองอัจฉริยะ
  onQuickFilterChange,  // 💎 NEW: รับฟังก์ชันเปลี่ยนตัวกรองอัจฉริยะ
  onRefresh, 
  isRefreshing, 
  onAddCustomer 
}) {
  return (
    <div className="bg-dh-base p-4 border-b border-dh-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between sticky top-0 z-20 shadow-sm">
      
      {/* ฝั่งซ้าย: ระบบค้นหา */}
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dh-muted group-focus-within:text-dh-accent transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสลูกค้า..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-dh-border rounded-xl focus:ring-2 focus:ring-dh-accent/20 focus:border-dh-accent outline-none text-sm shadow-sm transition-all text-dh-main placeholder:text-dh-muted/70"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* ฝั่งขวา: ตัวกรองและปุ่มต่างๆ */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
        
        {/* 💎 NEW: ตัวกรองอัจฉริยะ (Smart Filters) */}
        <div className="relative flex-1 md:flex-none min-w-[170px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            {quickFilter === 'has_wallet' ? <Wallet size={16} className="text-emerald-500" /> :
             quickFilter === 'is_partner' ? <Star size={16} className="text-blue-500" /> :
             quickFilter === 'has_tax' ? <FileText size={16} className="text-indigo-500" /> :
             quickFilter === 'has_points' ? <Coins size={16} className="text-amber-500" /> :
             <Filter size={16} className="text-dh-muted" />}
          </div>
          <select 
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-dh-border rounded-xl text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 appearance-none shadow-sm font-bold cursor-pointer transition-all"
            value={quickFilter || 'all'}
            onChange={(e) => onQuickFilterChange && onQuickFilterChange(e.target.value)}
          >
            <option value="all">หมวดหมู่ทั้งหมด</option>
            <option value="has_wallet">💰 มีเงินค้าง (Wallet)</option>
            <option value="has_points">🪙 มีแต้มสะสม (Points)</option>
            <option value="is_partner">🤝 พาร์ทเนอร์ (Partner)</option>
            <option value="has_tax">📝 พร้อมออกบิล (Tax Info)</option>
          </select>
        </div>

        {/* ตัวกรองวันที่ (ของเดิม) */}
        <div className="relative flex-1 md:flex-none min-w-[160px] hidden sm:block">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-dh-muted" size={16} />
          <select 
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-dh-border rounded-xl text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 appearance-none shadow-sm font-medium cursor-pointer transition-all"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            <option value="all">เวลาทั้งหมด</option>
            <option value="30days">30 วันล่าสุด</option>
            <option value="thisMonth">เพิ่มเดือนนี้</option>
          </select>
        </div>

        {/* ปุ่ม Refresh */}
        <button 
          onClick={() => onRefresh(false)} 
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-dh-border text-dh-muted hover:text-dh-main hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm disabled:opacity-50"
          title="ดึงข้อมูลใหม่"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin text-dh-accent" : ""} />
        </button>

        {/* ปุ่มเพิ่มลูกค้าใหม่ */}
        <button 
          onClick={onAddCustomer}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-dh-accent hover:bg-dh-accent-hover text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          <UserPlus size={18} />
          <span>เพิ่มลูกค้าใหม่</span>
        </button>
      </div>

    </div>
  );
}