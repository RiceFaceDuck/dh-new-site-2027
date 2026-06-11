import React from 'react';
import { Megaphone, ExternalLink, Image as ImageIcon, Clock, Calendar, Check, X } from 'lucide-react';
import ManagerBadge from './ManagerBadge';

export default function AdApprovalCard({ todo, isProcessing, isManagerTab, urgencyClass, handleAction, getStatusBadge, formatDate, handleRejectClick }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${urgencyClass} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600`}>
      
      {isManagerTab && <ManagerBadge text="อนุมัติโฆษณา" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-500 mb-2"></div>
          <span className="text-sm font-bold text-indigo-500 animate-pulse">กำลังประมวลผล...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
            <Megaphone size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mt-1">
              {todo.title || 'ฝากโฆษณาสินค้า'}
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
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100 dark:border-slate-700/50 line-clamp-3">
            {todo.description}
          </p>
        )}

        {/* Ad Preview */}
        {todo.adPayload && (
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl flex gap-3 items-center transition-all hover:bg-indigo-50 group">
            <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shadow-sm shrink-0 border border-slate-200 flex items-center justify-center transition-transform group-hover:scale-105">
              {todo.adPayload.imageUrl ? (
                <img src={todo.adPayload.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300 truncate">
                งบประมาณ: <span className="text-indigo-600 dark:text-indigo-400">{todo.adPayload.creditLimit || 0}</span> แต้ม
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold text-white bg-indigo-500 shrink-0 shadow-sm">
                  {todo.adPayload.platform || 'OTHER'}
                </span>
                {todo.adPayload.targetUrl && (
                  <a 
                    href={todo.adPayload.targetUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md"
                  >
                    <ExternalLink size={12} /> ตรวจสอบลิงก์โฆษณา
                  </a>
                )}
              </div>
            </div>
          </div>
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
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Account ลูกค้า</span>
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
              <Check size={16} strokeWidth={3} /> อนุมัติโฆษณา
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
            title="ยกเลิกงานนี้"
          >
            <X size={18} strokeWidth={2.5} /> ยกเลิกคำขอ
          </button>
        )}
      </div>
    </div>
  );
}
