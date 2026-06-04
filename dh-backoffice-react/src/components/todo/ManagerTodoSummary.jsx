/* eslint-disable */
import React from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ArrowRight, Loader2, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';

// 🚀 นำเข้า Hook อัจฉริยะที่เพิ่งสร้างใน Phase 3 เพื่อป้องกันการ Query ซ้ำซ้อน
import { useManagerTodo } from '../../pages/todo/hooks/useManagerTodo';

export default function ManagerTodoSummary() {
  // 📥 ใช้ State ส่วนกลางที่ประมวลผลไว้แล้ว (ลดการอ่าน Firebase R/W 100%)
  const { stats, loading } = useManagerTodo();

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col items-center justify-center min-h-[160px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Tasks...</span>
      </div>
    );
  }

  // ดึงสถิติรวมของโฆษณาทั้ง 3 ระบบ (นามบัตร, สินค้า, ป้าย) ที่รออนุมัติ
  const pendingCount = stats?.pendingAds || 0;
  const hasPending = pendingCount > 0;

  return (
    // ✨ [การจัดแสงเงา]: ใช้ shadow-indigo-500/10 เพื่อให้เป็น Soft Shadow ควบคู่กับ backdrop-blur-xl สไตล์ Glassmorphism (Enterprise Look)
    <div className={`relative overflow-hidden rounded-3xl p-6 lg:p-8 border transition-all duration-500 group backdrop-blur-xl ${
      hasPending 
        ? 'bg-gradient-to-br from-white/90 via-white/70 to-indigo-50/50 border-white/80 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1' 
        : 'bg-white/80 border-white/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5'
    }`}>
      
      {/* ✨ [ลูกเล่นวงกลมพื้นหลัง]: วงกลมแสงสีจางๆ 3 เลเยอร์ ซ้อนทับกัน (opacity ต่ำ + blur-3xl) ควบคุมขอบเขตด้วย overflow-hidden ด้านบน เพื่อสร้างมิติ Depth ให้พื้นหลัง */}
      <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        hasPending ? 'bg-rose-400/15 group-hover:bg-rose-400/25 group-hover:scale-110' : 'bg-slate-300/10'
      }`}></div>
      <div className={`absolute -bottom-16 -left-10 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        hasPending ? 'bg-indigo-400/15 group-hover:bg-indigo-400/25 group-hover:scale-110' : 'bg-slate-300/10'
      }`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-1000 delay-100 ${
        hasPending ? 'bg-purple-400/10 group-hover:bg-purple-400/20 group-hover:scale-150' : 'bg-transparent'
      }`}></div>

      <div className="relative z-10 flex flex-col h-full justify-between gap-5">
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl shadow-sm transition-colors duration-500 ${hasPending ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {hasPending ? <Megaphone size={22} className={hasPending ? 'animate-pulse' : ''} /> : <CheckCircle2 size={22} />}
            </div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight text-lg">ด่านตรวจโฆษณา</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <ShieldAlert size={12}/> Quality Control
              </p>
            </div>
          </div>
          
          {/* Status Indicator Badge */}
          {hasPending && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-rose-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-0.5">Action Required</span>
            </div>
          )}
        </div>

        {/* Content & Numbers */}
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black tracking-tighter transition-colors duration-500 ${hasPending ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500 drop-shadow-sm' : 'text-slate-300'}`}>
              {pendingCount}
            </span>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">รายการ</span>
          </div>
          <p className={`text-xs mt-2 font-medium flex items-center gap-1.5 transition-colors duration-500 ${hasPending ? 'text-indigo-600/80' : 'text-slate-400'}`}>
            {hasPending ? <><Activity size={14}/> มีโฆษณาใหม่รอการตรวจสอบและอนุมัติ</> : 'ตรวจสอบโฆษณาทั้งหมดครบถ้วนแล้ว'}
          </p>
        </div>

        {/* Action Button */}
        <Link 
          to="/todo" // 🚀 อัปเดตชี้ไปที่ศูนย์รวมงาน (To-do) ของผู้จัดการ
          className={`mt-4 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group w-full sm:w-auto overflow-hidden relative ${
            hasPending 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm'
          }`}
        >
          {/* Button inner shine effect for enterprise touch */}
          {hasPending && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>}
          <span className="relative z-10">{hasPending ? 'เปิดด่านตรวจสอบ' : 'ดูประวัติการอนุมัติ'}</span>
          <ArrowRight size={18} className={`relative z-10 transition-transform duration-300 ${hasPending ? 'group-hover:translate-x-1' : ''}`} />
        </Link>
        
      </div>
    </div>
  );
}