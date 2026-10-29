import { Wallet, Plus, Activity, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';

const AdStatsOverview = ({ userCredit, onOpenForm }) => {
  // Helper สำหรับจัดฟอร์แมตตัวเลข
  const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num || 0);
  const isOutOfCredit = Number(userCredit || 0) <= 0;

  return (
    <div className="relative overflow-hidden bg-slate-100/90 rounded-md p-6 md:p-8 shadow-sm border border-slate-200/90 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 💰 Credit & Wallet Section */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white border border-slate-200/80 rounded-md flex items-center justify-center shadow-xs relative">
            <Wallet size={28} className={isOutOfCredit ? "text-amber-500" : "text-indigo-600"} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              {isOutOfCredit ? (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              )}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              Available Credits <Sparkles size={12} className="text-amber-500"/>
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-black tracking-tight ${isOutOfCredit ? 'text-amber-600' : 'text-slate-900'}`}>
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
                 <Activity size={12} className={isOutOfCredit ? "text-amber-500" : "text-emerald-600"}/> Ad Engine
               </span>
               <span className={`text-sm font-bold tracking-wide ${isOutOfCredit ? "text-amber-600" : "text-emerald-600"}`}>
                 {isOutOfCredit ? "OUT OF CREDIT" : "ACTIVE"}
               </span>
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
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2.5 group whitespace-nowrap active:scale-95"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> 
            สร้างแคมเปญโฆษณา
          </button>
        </div>

      </div>

      {/* ⚠️ Out-of-Credit Notification Banner */}
      {isOutOfCredit && (
        <div className="relative z-10 mt-5 p-4 rounded-md bg-amber-50/90 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">เครดิตโฆษณาของคุณหมดแล้ว (0 Pts)</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                โฆษณาและหมุดร้านของคุณถูกพักการแสดงผลชั่วคราวเพื่อป้องกันค่าใช้จ่ายส่วนเกิน กรุณาติดต่อทีมงานเพื่อเติมเครดิตโฆษณา
              </p>
            </div>
          </div>
          <a
            href="https://lin.ee/qvpMIb6"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            ติดต่อเติมเครดิต
          </a>
        </div>
      )}
    </div>
  );
};

export default AdStatsOverview;
