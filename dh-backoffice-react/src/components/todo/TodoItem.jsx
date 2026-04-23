import React from 'react';
import { Check, X, Clock, UserPlus, Tag, Info, AlertCircle, Calendar, Receipt } from 'lucide-react';
import WholesaleCard from './WholesaleCard';
import PaymentCard from './PaymentCard';

export default function TodoItem({ todo, processingId, handleApprove, handleReject, fetchedPrices, wholesaleInputs, setWholesaleInputs }) {
  
  const getIconForType = (type) => {
    switch (type) {
      case 'STAFF_APPROVAL': return <UserPlus size={18} className="text-blue-500" />;
      case 'WHOLESALE_APPROVAL': return <Tag size={18} className="text-indigo-500" />;
      case 'PAYMENT_VERIFICATION': return <Receipt size={18} className="text-emerald-500" />;
      case 'KNOWLEDGE_UPDATE_APPROVAL': return <Info size={18} className="text-purple-500" />;
      case 'MANUAL_TASK': return <Calendar size={18} className="text-dh-accent" />;
      default: return <AlertCircle size={18} className="text-slate-400" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toMillis) return '-';
    const date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  // ✨ แทนที่คำสั่งแสดงผลตรงตามข้อกำหนดใหม่ (โดยไม่แก้ Database จริง)
  const displayTitle = todo.title ? todo.title.replace('ขอราคาส่ง (B2B)', 'ขอราคาส่ง จากลูกค้าหน้าเว็บ') : 'คำร้องขอไม่มีชื่อ';

  return (
    <div className={`p-4 flex flex-col transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${processingId === todo.id ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
        <div className="flex-1 flex gap-3 items-start min-w-0 w-full">
          <div className="mt-1 bg-white dark:bg-slate-900 border border-dh-border p-2 rounded-lg shrink-0 shadow-sm">
            {getIconForType(todo.type)}
          </div>
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-sm text-dh-main truncate">{displayTitle}</h4>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                todo.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 dark:bg-slate-800 text-dh-muted'
              }`}>
                {todo.type === 'PAYMENT_VERIFICATION' ? 'ตรวจสอบยอดโอน' : todo.type.replace('_APPROVAL', '')}
              </span>
            </div>
            <p className="text-xs text-dh-muted whitespace-pre-line line-clamp-2">{todo.description}</p>
            
            {todo.type === 'MANUAL_TASK' && todo.payload?.dueDate && (
              <div className="mt-2 text-[11px] text-dh-accent font-medium flex items-center gap-1">
                <Clock size={12} /> กำหนดส่ง: {new Date(todo.payload.dueDate).toLocaleString('th-TH')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between w-full xl:w-auto xl:justify-end gap-4 shrink-0 pl-12 xl:pl-0">
          <div className="flex items-center gap-1.5 text-[11px] text-dh-muted whitespace-nowrap">
            <Clock size={12} /> {formatDate(todo.createdAt)}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleApprove(todo)}
              title={todo.type === 'PAYMENT_VERIFICATION' ? 'ยืนยันรับยอดโอน' : 'ดำเนินการเสร็จสิ้น / อนุมัติ'}
              className={`flex items-center gap-1.5 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-sm text-white hover:-translate-y-0.5 active:translate-y-0 ${todo.type === 'PAYMENT_VERIFICATION' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
            >
              <Check size={16} strokeWidth={3} /> {todo.type === 'PAYMENT_VERIFICATION' ? 'ยืนยันรับยอดโอน' : 'อนุมัติราคาส่ง'}
            </button>
            <button 
              onClick={() => handleReject(todo.id)}
              title="ปฏิเสธ / ยกเลิก"
              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 px-3 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {todo.type === 'WHOLESALE_APPROVAL' && todo.payload && (
        <WholesaleCard 
          todo={todo} 
          fetchedData={fetchedPrices[todo.id]} 
          inputs={wholesaleInputs[todo.id] || {}} 
          setWholesaleInputs={setWholesaleInputs} 
        />
      )}

      {todo.type === 'PAYMENT_VERIFICATION' && todo.payload && (
         <PaymentCard todo={todo} />
      )}
    </div>
  );
}