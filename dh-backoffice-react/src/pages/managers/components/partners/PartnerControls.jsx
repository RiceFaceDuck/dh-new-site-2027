import React from 'react';
import { Search } from 'lucide-react';

export default function PartnerControls({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
      {/* Search */}
      <div className="relative w-full lg:w-1/3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อร้าน, ชื่อคนติดต่อ, อีเมล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0870B8]/50 text-sm font-medium"
        />
      </div>

      {/* Filter */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
            statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
            statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ออนไลน์
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
            statusFilter === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ถูกระงับ
        </button>
      </div>
    </div>
  );
}
