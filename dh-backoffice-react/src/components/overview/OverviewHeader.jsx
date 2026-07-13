import { Sparkles, Download, HelpCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const OverviewHeader = ({ metrics, getGreeting, getMotivation, setShowGuide }) => {

  const handleExportPDF = () => {
    try {
      toast.loading('กำลังเตรียม PDF...', { id: 'pdf-toast' });
      setTimeout(() => {
        toast.dismiss('pdf-toast');
        window.print();
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('เกิดข้อผิดพลาดในการเปิดพิมพ์รายงาน');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 mb-2 shrink-0 z-20 relative print:hidden">
      
      <div className="relative z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-slate-500 font-bold text-sm tracking-wide">{getGreeting()}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 shadow-[0_2px_10px_rgba(16,185,129,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> SYSTEM LIVE
          </span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
          DH Command Center
        </h2>
        <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
          <Sparkles size={16} className="text-indigo-500" /> {getMotivation()}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 relative z-10 print:hidden mt-2 lg:mt-0">
        {metrics.pendingStaff > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl border border-amber-200/60 shadow-sm animate-bounce">
            <Users size={16} className="text-amber-600" />
            <span className="text-xs font-bold">{metrics.pendingStaff} รออนุมัติ</span>
          </div>
        )}
        
        <button 
          onClick={handleExportPDF}
          className="group flex items-center gap-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md active:scale-95 text-sm"
        >
          <Download size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:-translate-y-0.5 transition-all" />
          <span>Export Report</span>
        </button>
        <button 
          onClick={() => setShowGuide(true)}
          className="group flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:shadow-lg active:scale-95 text-sm"
        >
          <HelpCircle size={16} className="text-slate-300 group-hover:text-white transition-colors" />
          <span>คู่มือใช้งาน</span>
        </button>
      </div>
    </div>
  );
};
