import React from 'react';
import { 
  Check, X, Play, Clock, UserPlus, Tag, Info, AlertCircle, 
  Calendar, Receipt, Package, Truck, MessageSquare, 
  Megaphone, ExternalLink, Image as ImageIcon 
} from 'lucide-react';

export default function TodoItem({ todo, isProcessing, isManagerTab, urgencyClass, handleAction }) {
  
  // 🌟 แมปปิ้งไอคอนให้ตรงกับประเภทงาน (รองรับทั้งตัวพิมพ์เล็ก-ใหญ่)
  const getIconForType = (type) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'STAFF_APPROVAL': return <UserPlus size={20} className="text-blue-500" />;
      case 'MANUAL_TASK': return <Calendar size={20} className="text-dh-accent" />;
      case 'PACKING_TASK': return <Package size={20} className="text-orange-500" />;
      case 'FOLLOW_UP': return <MessageSquare size={20} className="text-teal-500" />;
      case 'INVENTORY': return <Truck size={20} className="text-purple-500" />;
      case 'CLAIM_APPROVAL': 
      case 'RETURN_APPROVAL': return <AlertCircle size={20} className="text-rose-500" />;
      case 'AD_APPROVAL': return <Megaphone size={20} className="text-indigo-500" />; // 👈 เพิ่มหมวดหมู่งานโฆษณา
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
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">รอเริ่มงาน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse border border-blue-200">⏳ กำลังดำเนินการ</span>;
      case 'pending_manager': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200">👑 รอผู้จัดการอนุมัติ</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  // 🛡️ ฟังก์ชันกลางสำหรับจัดการการยกเลิก/ปฏิเสธงาน (UX Fail-Safe)
  const handleRejectClick = () => {
    const actionName = isManagerTab ? 'ปฏิเสธคำขอ' : 'ยกเลิกงาน';
    
    // ลูกเล่น: บังคับให้ใส่เหตุผล ไม่ให้ลักไก่ส่งค่าว่าง
    const reason = window.prompt(`⚠️ คุณกำลังจะ ${actionName}\n\nกรุณาระบุเหตุผลที่ชัดเจนเพื่อบันทึกลงระบบ (บังคับ):`);
    
    if (reason === null) return; // User กด Cancel ในหน้าต่าง Prompt
    
    if (reason.trim().length < 2) {
      alert('❌ กรุณาระบุเหตุผลให้ชัดเจนกว่านี้ (อย่างน้อย 2 ตัวอักษร)');
      return;
    }

    // ส่งโครงสร้างที่ถูกต้องให้ Todo.jsx
    handleAction(todo.id, 'reject', todo.type, { reason: reason.trim(), payload: todo.adPayload });
  };

  const isAdTask = todo.type?.toUpperCase() === 'AD_APPROVAL';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border ${urgencyClass} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600`}>
      
      {/* Loading Overlay (ป้องกันการกดเบิ้ลเวลาเน็ตช้า) */}
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
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-blue-100 dark:border-slate-700/50 line-clamp-3">
            {todo.description}
          </p>
        )}

        {/* 🌟 Quick Ad Preview (แสดงเฉพาะงานโฆษณา) */}
        {isAdTask && todo.adPayload && (
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl flex gap-3 items-center transition-all hover:bg-indigo-50">
            <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shadow-sm shrink-0 border border-slate-200 flex items-center justify-center">
              {todo.adPayload.imageUrl ? (
                <img src={todo.adPayload.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 truncate">
                งบ: {todo.adPayload.creditLimit || 0} แต้ม
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-white bg-indigo-500 shrink-0">
                  {todo.adPayload.platform || 'OTHER'}
                </span>
                <a 
                  href={todo.adPayload.targetUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 truncate"
                >
                  <ExternalLink size={10} /> ตรวจสอบลิงก์
                </a>
              </div>
            </div>
          </div>
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
              <span className={`font-medium flex items-center gap-1 ${todo.priority === 'High' ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                <Calendar size={12} /> {formatDate(todo.dueDate)}
              </span>
            </div>
          )}
          
          {todo.customerName && (
            <div className="flex flex-col gap-1 col-span-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">ลูกค้าที่เกี่ยวข้อง</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 inline-block w-fit">{todo.customerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (อัจฉริยะเปลี่ยนตามสถานะ) */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        {isManagerTab ? (
          // 👑 ปุ่มสำหรับ "แท็บผู้จัดการ" (อนุมัติ / ปฏิเสธ)
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
          // 👨‍🔧 ปุ่มสำหรับ "แท็บปฏิบัติการ" (เริ่มงาน / เสร็จสิ้น / ยกเลิก)
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