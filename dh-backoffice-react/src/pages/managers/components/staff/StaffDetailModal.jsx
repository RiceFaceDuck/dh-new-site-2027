import React from 'react';
import { 
  Users, ShieldAlert, Phone, User, Calendar, ShieldCheck, 
  Activity, BarChart, Target, Star, Clock, X, Mail
} from 'lucide-react';
import { SUPER_ADMINS } from '../../../../firebase/userService';

export default function StaffDetailModal({ viewingStaff, setViewingStaff }) {
  if (!viewingStaff) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh] animate-in zoom-in-95 relative">
        
        <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            <button onClick={() => setViewingStaff(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-colors z-10">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center -mt-16 mb-6">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-xl shadow-indigo-500/10 flex items-center justify-center overflow-hidden mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
              {viewingStaff.photoURL ? (
                <img src={viewingStaff.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Users size={48} className="text-indigo-300" strokeWidth={1.5} />
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center">
              {viewingStaff.displayName || viewingStaff.firstName || 'ไม่ระบุชื่อ'}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <Mail size={14}/> {viewingStaff.email}
            </p>
            <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                {viewingStaff.role || viewingStaff.computedRole || 'Staff'}
                </span>
                {SUPER_ADMINS.includes(viewingStaff.email) && (
                    <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm gap-1">
                        <ShieldAlert size={14} /> Owner
                    </span>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Phone size={12}/> เบอร์ติดต่อ</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{viewingStaff.phone || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><User size={12}/> เพศ</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {viewingStaff.gender === 'male' ? 'ชาย' : viewingStaff.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar size={12}/> เริ่มงาน</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{viewingStaff.startDate || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ShieldCheck size={12}/> สถานะบัญชี</p>
                <p className={`text-sm font-bold flex items-center gap-1.5 ${viewingStaff.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${viewingStaff.isActive ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                  {viewingStaff.isActive ? 'ปกติ' : 'ถูกระงับ'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Activity className="text-indigo-500" size={18}/> ประสิทธิภาพการทำงาน (KPI)
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[3px] rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:opacity-0 cursor-crosshair">
                    <BarChart className="text-indigo-600 mb-2" size={32} strokeWidth={1.5} />
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">ระบบประเมินผล KPI</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center px-4 font-medium">สถิติการทำงานรายบุคคล จะเปิดใช้งานในเฟสถัดไป<br/><span className="text-[10px] opacity-70">(เอาเมาส์ชี้เพื่อดูตัวอย่างดีไซน์)</span></p>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-indigo-500/5 rotate-12"><Target size={80}/></div>
                  <Target className="mx-auto mb-2 text-indigo-400 relative z-10" size={24} strokeWidth={1.5}/>
                  <p className="text-[11px] font-bold text-slate-500 relative z-10 uppercase">บิลที่ดูแลสำเร็จ</p>
                  <p className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 relative z-10">124 <span className="text-[11px] text-emerald-500 font-bold ml-1">+12%</span></p>
                </div>
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-amber-500/5 rotate-12"><Star size={80}/></div>
                  <Star className="mx-auto mb-2 text-amber-400 relative z-10" size={24} strokeWidth={1.5}/>
                  <p className="text-[11px] font-bold text-slate-500 relative z-10 uppercase">ความพึงพอใจ</p>
                  <p className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 relative z-10">4.8 <span className="text-[11px] text-slate-400 font-bold ml-1">/ 5.0</span></p>
                </div>
                <div className="col-span-2 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-inner"><Clock size={20}/></div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">เวลาตอบสนองเฉลี่ย (SLA)</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight">14 นาที 20 วินาที</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold shadow-sm">ระดับดีเยี่ยม</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
