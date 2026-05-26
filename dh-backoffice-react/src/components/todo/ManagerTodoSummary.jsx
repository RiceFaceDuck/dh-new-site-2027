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
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Tasks...</span>
      </div>
    );
  }

  // ดึงสถิติรวมของโฆษณาทั้ง 3 ระบบ (นามบัตร, สินค้า, ป้าย) ที่รออนุมัติ
  const pendingCount = stats?.pendingAds || 0;
  const hasPending = pendingCount > 0;

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 lg:p-8 border transition-all duration-500 group ${
      hasPending 
        ? 'bg-gradient-to-br from-white via-indigo-50/30 to-rose-50/30 border-indigo-200/60 shadow-xl shadow-indigo-900/5 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1' 
        : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300'
    }`}>
      
      {/* ✨ Premium Background Decorative Elements */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${hasPending ? 'bg-rose-400/10 group-hover:bg-rose-400/20' : 'bg-slate-200/20'}`}></div>
      <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${hasPending ? 'bg-indigo-400/10 group-hover:bg-indigo-400/20' : 'bg-slate-200/20'}`}></div>

      <div className="relative z-10 flex flex-col h-full justify-between gap-5">
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl shadow-sm ${hasPending ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-rose-200 shadow-sm">
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
            <span className={`text-5xl font-black tracking-tighter ${hasPending ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500 drop-shadow-sm' : 'text-slate-300'}`}>
              {pendingCount}
            </span>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">รายการ</span>
          </div>
          <p className={`text-xs mt-2 font-medium flex items-center gap-1.5 ${hasPending ? 'text-indigo-600/80' : 'text-slate-400'}`}>
            {hasPending ? <><Activity size={14}/> มีโฆษณาใหม่รอการตรวจสอบและอนุมัติ</> : 'ตรวจสอบโฆษณาทั้งหมดครบถ้วนแล้ว'}
          </p>
        </div>

        {/* Action Button */}
        <Link 
          to="/todo" // 🚀 อัปเดตชี้ไปที่ศูนย์รวมงาน (To-do) ของผู้จัดการ
          className={`mt-4 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all group w-full sm:w-auto ${
            hasPending 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md hover:shadow-lg' 
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{hasPending ? 'เปิดด่านตรวจสอบ' : 'ดูประวัติการอนุมัติ'}</span>
          <ArrowRight size={18} className={`transition-transform ${hasPending ? 'group-hover:translate-x-1' : ''}`} />
        </Link>
        
      </div>
    </div>
  );
}