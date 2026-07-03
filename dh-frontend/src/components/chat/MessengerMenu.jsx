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
      <button onClick={handleFindNearestPartner} className="relative overflow-hidden w-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-md shadow-emerald-500/20 transform hover:-translate-y-0.5 border border-emerald-400">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner backdrop-blur-sm relative z-10">
          <MapPin size={22} />
        </div>
        <div className="text-left flex-1 relative z-10">
          <h4 className="font-extrabold text-[15px] text-white drop-shadow-md tracking-wide">ติดต่อช่างใกล้คุณ ทันที</h4>
          <p className="text-xs text-emerald-50 mt-0.5 font-medium flex items-center gap-1.5 group-hover:text-white transition-colors group-hover:translate-x-0.5 duration-300">
            ค้นหาผู้ให้บริการ ผ่านระบบ GPS
            <span className="relative flex h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </p>
        </div>
      </button>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <div className="w-full bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
            <MessageCircle size={22} />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-sm text-slate-800">ติดต่อแอดมิน DH Notebook</h4>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">สอบถามสั่งซื้อสินค้า / เคลมประกัน</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={import.meta.env.VITE_LINE_OA_URL || "https://lin.ee/qvpMIb6"} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#00B900] hover:bg-[#009900] text-white rounded-xl text-xs font-bold transition-all shadow-sm">
            <span>LINE Official</span>
            <ExternalLink size={12} />
          </a>
          <a href={import.meta.env.VITE_FB_MESSENGER_URL || "https://m.me/420556081419367"} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-bold transition-all shadow-sm">
            <span>Messenger</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MessengerMenu;
