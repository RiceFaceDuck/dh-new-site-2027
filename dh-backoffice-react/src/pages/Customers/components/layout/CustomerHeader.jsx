import React from 'react';
import { Search, Filter, RefreshCw, UserPlus, Wallet, Star, FileText, Coins, HelpCircle } from 'lucide-react';

export default function CustomerHeader({ 
  searchTerm, 
  onSearchChange, 
  dateFilter, 
  onDateFilterChange, 
  quickFilter,          // 💎 NEW: รับค่า State ตัวกรองอัจฉริยะ
  onQuickFilterChange,  // 💎 NEW: รับฟังก์ชันเปลี่ยนตัวกรองอัจฉริยะ
  onRefresh, 
  isRefreshing, 
  onAddCustomer,
  onGuideOpen,
  onRunMigration
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 dh-header-gradient px-3 md:px-4 py-2 shrink-0 z-20 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] border-b border-dh-border sticky top-0 transition-colors duration-300">
      
      {/* ฝั่งซ้าย: ระบบค้นหา */}
      <div className="relative w-full md:w-80 group shrink-0">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
          <Search size={16} />
        </span>
        <input 
          type="text" 
          placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสลูกค้า..." 
          className="pl-9 pr-4 py-2 h-[36px] bg-white border border-slate-200 rounded-md w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* ฝั่งขวา: ตัวกรองและปุ่มต่างๆ */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2 w-full flex-1">
        
        {/* 💎 NEW: ตัวกรองอัจฉริยะ (Smart Filters) */}
        <div className="relative flex-1 md:flex-none min-w-[150px]">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            {quickFilter === 'has_wallet' ? <Wallet size={14} className="text-emerald-500" /> :
             quickFilter === 'is_partner' ? <Star size={14} className="text-blue-500" /> :
             quickFilter === 'has_tax' ? <FileText size={14} className="text-indigo-500" /> :
             quickFilter === 'has_points' ? <Coins size={14} className="text-amber-500" /> :
             <Filter size={14} className="text-slate-400" />}
          </div>
          <select 
            className="w-full pl-8 pr-6 py-2 h-[36px] bg-white border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none shadow-sm font-bold cursor-pointer transition-all"
            value={quickFilter || 'all'}
            onChange={(e) => onQuickFilterChange && onQuickFilterChange(e.target.value)}
          >
            <option value="all">หมวดหมู่ทั้งหมด</option>
            <option value="has_wallet">💰 มีเงินค้าง</option>
            <option value="has_points">🪙 มีแต้มสะสม</option>
            <option value="is_partner">🤝 พาร์ทเนอร์</option>
            <option value="has_tax">📝 พร้อมออกบิล</option>
          </select>
        </div>

        {/* ตัวกรองวันที่ (ของเดิม) */}
        <div className="relative flex-1 md:flex-none min-w-[130px] hidden sm:block">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={14} />
          <select 
            className="w-full pl-8 pr-6 py-2 h-[36px] bg-white border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none shadow-sm font-medium cursor-pointer transition-all"
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
          className="w-[36px] h-[36px] flex items-center justify-center bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-md transition-colors backdrop-blur-sm shadow-sm shrink-0 disabled:opacity-50"
          title="ดึงข้อมูลใหม่"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin text-cyan-300" : ""} />
        </button>

        {/* ปุ่มคู่มือ */}
        <button 
          onClick={onGuideOpen}
          className="h-[36px] px-3 flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-md font-bold text-xs transition-colors shadow-sm shrink-0"
          title="คู่มือการใช้งาน"
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">คู่มือ</span>
        </button>

        {/* ปุ่มเพิ่มลูกค้าใหม่ */}
        <button 
          onClick={onAddCustomer}
          className="h-[36px] px-4 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-bold text-xs transition-all shadow-lg active:scale-95 ring-1 ring-cyan-400/50 shrink-0"
        >
          <UserPlus size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">เพิ่มลูกค้าใหม่</span>
        </button>

        {/* ปุ่มกวาดล้างข้อมูล (Migration) - แสดงเฉพาะช่วงล้างระบบ */}
        <button 
          onClick={onRunMigration}
          className="h-[36px] px-3 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-bold text-xs transition-all shadow-lg active:scale-95 ring-1 ring-rose-400/50 shrink-0"
          title="ล้างข้อมูลอดีตที่ตกค้าง (Migration)"
        >
          <RefreshCw size={14} strokeWidth={2.5} className="text-white" />
          <span className="hidden sm:inline text-[10px]">Clean DB</span>
        </button>
      </div>

    </div>
  );
}