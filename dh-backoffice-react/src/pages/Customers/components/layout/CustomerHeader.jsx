import React from 'react';
import { Search, Filter, RefreshCw, UserPlus, Loader2 } from 'lucide-react';

export default function CustomerHeader({ 
  searchTerm, 
  onSearchChange, 
  dateFilter, 
  onDateFilterChange, 
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
        {searchTerm && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dh-muted hover:text-dh-main bg-gray-100 rounded-full p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ฝั่งขวา: ตัวกรองและปุ่มเครื่องมือ */}
      <div className="flex w-full md:w-auto items-center gap-2">
        {/* Dropdown กรองวันที่ */}
        <div className="relative flex-1 md:flex-none">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-dh-muted pointer-events-none" size={16} />
          <select 
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-dh-border rounded-xl text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 appearance-none shadow-sm font-medium cursor-pointer"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            <option value="all">ลูกค้าทั้งหมด</option>
            <option value="30days">อัปเดต 30 วันล่าสุด</option>
            <option value="thisMonth">เพิ่มเดือนนี้</option>
          </select>
        </div>

        {/* ปุ่ม Refresh */}
        <button 
          onClick={() => onRefresh(false)} // false = บังคับดึงข้อมูลใหม่จาก Firebase ไม่ใช้ Cache
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-dh-border text-dh-muted hover:text-dh-main hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm disabled:opacity-50"
          title="ดึงข้อมูลใหม่"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin text-dh-accent" : ""} />
        </button>

        {/* ปุ่มเพิ่มลูกค้าใหม่ */}
        <button 
          onClick={onAddCustomer}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-dh-accent hover:bg-dh-accent-hover text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 text-sm"
        >
          <UserPlus size={18} strokeWidth={2.5}/>
          <span className="hidden sm:inline">เพิ่มลูกค้า</span>
        </button>
      </div>
    </div>
  );
}