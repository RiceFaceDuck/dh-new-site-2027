import React from 'react';
import { Check, X, Play, Clock, UserPlus, Tag, Info, AlertCircle, Calendar, Receipt, Package, Truck, MessageSquare } from 'lucide-react';

export default function TodoItem({ todo, isProcessing, isManagerTab, urgencyClass, handleAction }) {
  
  // 🌟 แมปปิ้งไอคอนให้ตรงกับประเภทงาน
  const getIconForType = (type) => {
    switch (type) {
      case 'STAFF_APPROVAL': return <UserPlus size={20} className="text-blue-500" />;
      case 'MANUAL_TASK': return <Calendar size={20} className="text-dh-accent" />;
      case 'PACKING_TASK': return <Package size={20} className="text-orange-500" />;
      case 'FOLLOW_UP': return <MessageSquare size={20} className="text-teal-500" />;
      case 'INVENTORY': return <Truck size={20} className="text-purple-500" />;
      case 'CLAIM_APPROVAL': 
      case 'RETURN_APPROVAL': return <AlertCircle size={20} className="text-rose-500" />;
      default: return <Info size={20} className="text-slate-400" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    // รองรับทั้งแบบ Firestore Timestamp และ ISO String
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">รอเริ่มงาน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">กำลังดำเนินการ</span>;
      case 'pending_manager': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold">รอผู้จัดการอนุมัติ</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${urgencyClass} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md`}>
      
      {/* Loading Overlay (ป้องกันการกดเบิ้ลเวลาเน็ตช้า) */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dh-main"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
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
                <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">ด่วนมาก</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 mb-5">
        {todo.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 line-clamp-3">
            {todo.description}
          </p>
        )}

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
              <span className={`font-medium flex items-center gap-1 ${todo.priority === 'High' ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                <Calendar size={12} /> {formatDate(todo.dueDate)}
              </span>
            </div>
          )}
          
          {todo.customerName && (
            <div className="flex flex-col gap-1 col-span-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">ลูกค้าที่เกี่ยวข้อง</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{todo.customerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (อัจฉริยะเปลี่ยนตามสถานะ) */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        {isManagerTab ? (
          // ปุ่มสำหรับ "แท็บผู้จัดการ" (อนุมัติ / ปฏิเสธ)
          <>
            <button 
              onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
              disabled={isProcessing}
              className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              <Check size={16} strokeWidth={3} /> อนุมัติ
            </button>
            <button 
              onClick={() => {
                const reason = prompt('กรุณาระบุเหตุผลที่ปฏิเสธคำขอนี้:');
                if (reason !== null) handleAction(todo.id, 'reject', todo.type, { ...todo.payload, reason });
              }}
              disabled={isProcessing}
              className="flex justify-center items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              title="ปฏิเสธคำขอ"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          // ปุ่มสำหรับ "แท็บปฏิบัติการ" (เริ่มงาน / เสร็จสิ้น / ยกเลิก)
          <>
            {todo.status === 'todo' && (
              <button 
                onClick={() => handleAction(todo.id, 'start', todo.type)}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                <Play size={16} fill="currentColor" /> เริ่มดำเนินการ
              </button>
            )}
            
            {todo.status === 'in_progress' && (
              <button 
                onClick={() => handleAction(todo.id, 'complete', todo.type)}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
              >
                <Check size={16} strokeWidth={3} /> เสร็จสิ้นภารกิจ
              </button>
            )}
            
            <button 
              onClick={() => {
                const reason = prompt('กรุณาระบุเหตุผลที่ยกเลิกงานนี้:');
                if (reason !== null) handleAction(todo.id, 'reject', todo.type, { reason });
              }}
              disabled={isProcessing}
              className="flex justify-center items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              title="ยกเลิกงาน"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

    </div>
  );
}