import React from 'react';
import { Plus, History, HelpCircle } from 'lucide-react';

/**
 * TodoHeader Component
 * รับผิดชอบ: ส่วนหัวของหน้า Todo สรุปยอด และเป็นจุดเรียก Action (สร้าง, ประวัติ, คู่มือ)
 */
export default function TodoHeader({ todoCount, onOpenCreate, onOpenHistory, onOpenHelp }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-dh-main tracking-tight flex items-center gap-2">
          To-do <span className="text-dh-accent">Approvals</span>
        </h1>
        <p className="text-sm text-dh-muted mt-1 font-medium flex items-center gap-2">
          ด่านตรวจสอบและอนุมัติรายการ 
          {todoCount > 0 && (
            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm animate-in zoom-in">
              ค้าง {todoCount} รายการ
            </span>
          )}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenCreate} 
          className="bg-dh-main hover:bg-dh-main/90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm outline-none"
        >
          <Plus size={18} /> สั่งงานใหม่
        </button>
        
        <button 
          onClick={onOpenHistory} 
          className="bg-white dark:bg-slate-800 text-dh-main hover:bg-slate-50 dark:hover:bg-slate-700 border border-dh-border font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm outline-none"
        >
          <History size={18} /> ประวัติงาน
        </button>
        
        <button 
          onClick={onOpenHelp} 
          className="p-2 text-dh-muted hover:text-dh-accent bg-white dark:bg-slate-800 border border-dh-border rounded-lg shadow-sm transition-colors outline-none"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </div>
  );
}