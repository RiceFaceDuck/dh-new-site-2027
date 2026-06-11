import React from 'react';
import { Clock, Calendar, Check, X, Play } from 'lucide-react';
import ManagerBadge from './ManagerBadge';

export default function GenericTodoCard({ todo, isProcessing, isManagerTab, urgencyClass, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${urgencyClass} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600`}>
      
      {isManagerTab && <ManagerBadge />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-dh-main mb-2"></div>
          <span className="text-sm font-bold text-dh-main animate-pulse">กำลังประมวลผล...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
            {getIconForType(todo.type)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
              {todo.title || 'งานทั่วไป'}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              {getStatusBadge(todo.status)}
              {todo.priority === 'High' && (
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md shadow-sm">🔥 ด่วนมาก</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 mb-5">
        {todo.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 line-clamp-3 leading-relaxed">
            {todo.description}
          </p>
        )}

        {/* Footer Data Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">วันที่สร้าง</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Clock size={12} /> {formatDate(todo.createdAt || todo.requestedAt)}
            </span>
          </div>
          
          {todo.dueDate && (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">กำหนดเสร็จ</span>
              <span className={`font-medium flex items-center gap-1 ${todo.priority === 'High' ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                <Calendar size={12} /> {formatDate(todo.dueDate)}
              </span>
            </div>
          )}
          
          {todo.customerName && (
            <div className="flex flex-col gap-1 col-span-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">ลูกค้าที่เกี่ยวข้อง</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 inline-block w-fit shadow-sm">{todo.customerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        {isManagerTab ? (
          <>
            <button 
              onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
              disabled={isProcessing}
              className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} strokeWidth={3} /> อนุมัติคำขอ
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
          <>
            {todo.status === 'todo' && (
              <button 
                onClick={() => handleAction(todo.id, 'start', todo.type)}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} fill="currentColor" /> เริ่มดำเนินการ
              </button>
            )}
            
            {todo.status === 'in_progress' && (
              <button 
                onClick={() => handleAction(todo.id, 'complete', todo.type)}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} strokeWidth={3} /> เสร็จสิ้นภารกิจ
              </button>
            )}
            
            <button 
              onClick={handleRejectClick}
              disabled={isProcessing}
              className="flex justify-center items-center gap-2 bg-white border-2 border-slate-100 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="ยกเลิกงานนี้"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
