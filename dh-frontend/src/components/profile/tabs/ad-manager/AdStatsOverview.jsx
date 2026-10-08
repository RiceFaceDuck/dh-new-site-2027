 
import { Wallet, Plus, Activity, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

const AdStatsOverview = ({ userCredit, onOpenForm }) => {
  // Helper สำหรับจัดฟอร์แมตตัวเลข
  const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num || 0);

  return (
    <div className="relative overflow-hidden bg-slate-100/90 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 💰 Credit & Wallet Section */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center shadow-xs relative">
            <Wallet size={28} className="text-indigo-600" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              Available Credits <Sparkles size={12} className="text-amber-500"/>
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                {formatNumber(userCredit)}
              </p>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-200/80 px-2 py-0.5 rounded-md">PTS</span>
            </div>
          </div>
        </div>

        {/* 📊 Trust Indicators & Action Button */}
        <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-5">
          
          {/* Trust Badges (Corporate Vibe) */}
          <div className="hidden sm:flex gap-5 mr-2">
            <div className="flex flex-col items-end justify-center pr-5 border-r border-slate-300/70">
               <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
                 <Activity size={12} className="text-emerald-600"/> Ad Engine
               </span>
               <span className="text-sm font-bold text-emerald-600 tracking-wide">ACTIVE</span>
            </div>
            <div className="flex flex-col items-end justify-center pr-3 border-r border-slate-300/70">
               <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
                 <ShieldCheck size={12} className="text-indigo-600"/> Protection
               </span>
               <span className="text-sm font-bold text-indigo-600 tracking-wide">ZERO-LEAK</span>
            </div>
          </div>

          {/* Action Button: Create Campaign */}
          <button 
            onClick={onOpenForm}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2.5 group whitespace-nowrap active:scale-95"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> 
            สร้างแคมเปญโฆษณา
          </button>
        </div>

      </div>
      
      {/* ℹ️ Transparency Note */}
      <div className="relative z-10 mt-6 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 font-medium space-y-1">
          <p>* <strong className="text-emerald-700">ค่ามองเห็น (Impression)</strong>: ระบบสะสมยอดวิวครบ 100 ครั้ง ถึงจะหักพอยต์โฆษณา 1 รอบ (ตามที่กำหนดในหลังบ้าน)</p>
          <p>* <strong className="text-indigo-700">ค่าคลิก (Click)</strong>: หักพอยต์ทันทีที่มีคนกดดูโปรไฟล์หรือสินค้าของคุณ</p>
        </div>
        <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg w-max border border-slate-200/80 uppercase tracking-widest shadow-2xs">
          <TrendingUp size={14} className="text-indigo-600"/> Real-time Smart Tracking
        </div>
      </div>
    </div>
  );
};

export default AdStatsOverview;