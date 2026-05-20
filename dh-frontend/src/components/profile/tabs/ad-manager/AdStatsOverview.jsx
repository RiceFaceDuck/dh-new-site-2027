/* eslint-disable react/prop-types */
import React from 'react';
import { Store, Plus } from 'lucide-react';

const AdStatsOverview = ({ userCredit, onOpenForm }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-[#0870B8]/10 p-5 rounded-2xl border border-[#0870B8]/20">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#0870B8]">
          <Store size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Credit Point ของคุณ</p>
          <p className="text-2xl font-black text-[#0870B8]">{userCredit.toLocaleString()} <span className="text-base font-medium text-slate-600">แต้ม</span></p>
        </div>
      </div>
      <button 
        onClick={onOpenForm}
        className="w-full sm:w-auto px-6 py-3 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} /> ลงโฆษณาสินค้าใหม่
      </button>
    </div>
  );
};

export default AdStatsOverview;