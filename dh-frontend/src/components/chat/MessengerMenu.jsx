import React from 'react';
import { AlertCircle, MessageCircle, MapPin, ExternalLink } from 'lucide-react';

const MessengerMenu = ({ error, handleFindNearestPartner }) => {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-medium p-3 rounded-xl flex items-start gap-2 shadow-sm">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">คุณต้องการติดต่อเรื่องใด?</p>
      </div>
      <a href="https://lin.ee/your-line-id" target="_blank" rel="noreferrer" className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 shadow-inner">
          <MessageCircle size={22} />
        </div>
        <div className="text-left flex-1">
          <h4 className="font-bold text-sm text-slate-800">ติดต่อแอดมิน DH Notebook</h4>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">สอบถามสั่งซื้อสินค้า / เคลมประกัน</p>
        </div>
        <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
      </a>
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
      <button onClick={handleFindNearestPartner} className="w-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 shadow-inner">
          <MapPin size={22} />
        </div>
        <div className="text-left flex-1">
          <h4 className="font-bold text-sm text-slate-800">หาร้านซ่อมใกล้ฉัน</h4>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">ค้นหาพาร์ทเนอร์ผ่านระบบ GPS</p>
        </div>
      </button>
    </div>
  );
};

export default MessengerMenu;
