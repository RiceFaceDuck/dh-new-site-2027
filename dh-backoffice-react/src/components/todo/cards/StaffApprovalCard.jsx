import React from 'react';
import { UserPlus, Mail, Briefcase, Calendar, Check, X } from 'lucide-react';
import ManagerBadge from './ManagerBadge';

export default function StaffApprovalCard({ todo, isProcessing, isManagerTab, urgencyClass, handleAction, getStatusBadge, formatDate, handleRejectClick }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${urgencyClass} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600`}>
      
      {isManagerTab && <ManagerBadge text="อนุมัติพนักงานใหม่" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mb-2"></div>
          <span className="text-sm font-bold text-blue-500 animate-pulse">กำลังประมวลผล...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
            <UserPlus size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mt-1">
              {todo.title || 'อนุมัติพนักงานใหม่'}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              {getStatusBadge(todo.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 mb-5 mt-2">
        {todo.metadata && (
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-slate-800 dark:to-slate-700/50 border border-blue-100/80 dark:border-slate-600/80 p-4 rounded-2xl flex flex-col gap-3 transition-all">
            <div className="flex items-center gap-3 border-b border-blue-100/50 dark:border-slate-600/50 pb-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-inner">
                {todo.metadata.name ? todo.metadata.name.charAt(0).toUpperCase() : <UserPlus size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{todo.metadata.name || 'ไม่ระบุชื่อ'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={10} /> {todo.targetEmail || 'ไม่ระบุอีเมล'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ตำแหน่งที่ขอ</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 w-fit">
                  <Briefcase size={12} className="text-blue-500" />
                  <span className="capitalize">{todo.metadata.requestedRole || 'Staff'}</span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">เพศ</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 pl-1 mt-1">
                  {todo.metadata.gender === 'male' ? 'ชาย 👨' : todo.metadata.gender === 'female' ? 'หญิง 👩' : 'ไม่ระบุ 👤'}
                </span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">วันเริ่มงานที่ต้องการ</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pl-1 mt-0.5">
                  <Calendar size={13} /> {todo.metadata.startDate || 'ไม่ระบุ'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        {isManagerTab ? (
          <>
            <button 
              onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
              disabled={isProcessing}
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} strokeWidth={3} /> อนุมัติรับพนักงาน
            </button>
            <button 
              onClick={handleRejectClick}
              disabled={isProcessing}
              className="flex justify-center items-center gap-2 bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="ปฏิเสธคำขอ"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button 
            onClick={handleRejectClick}
            disabled={isProcessing}
            className="flex-1 flex justify-center items-center gap-2 bg-white border-2 border-slate-100 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="ยกเลิกคำขอ"
          >
            <X size={18} strokeWidth={2.5} /> ยกเลิกคำขอ
          </button>
        )}
      </div>
    </div>
  );
}
