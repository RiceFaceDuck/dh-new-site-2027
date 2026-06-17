import React from 'react';
import { Inbox, HelpCircle, History, Plus } from 'lucide-react';

const TodoPageHeader = ({ navigate, setShowHelp, setShowNewTaskModal }) => {
  return (
    <div className="dh-header-gradient p-4 sm:p-6 relative z-10 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm hidden md:flex">
            <Inbox size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none whitespace-nowrap flex items-center gap-2">
              ศูนย์ปฏิบัติการ (Operations)
              <button onClick={() => setShowHelp(true)} className="text-white/70 hover:text-white transition-colors" title="คู่มือ">
                <HelpCircle className="w-5 h-5" />
              </button>
            </h1>
            <p className="text-[12px] text-slate-300 mt-1.5 font-bold uppercase tracking-wider hidden sm:block">
              จัดการงานเอกสาร, เคลมสินค้า, บัญชี และงานประจำวัน
            </p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={() => navigate('/todo/archive')}
            className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 text-white border border-slate-700/50 font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-[13px] shrink-0 whitespace-nowrap"
          >
            <History size={18} strokeWidth={3} /> ประวัติ / จัดเก็บ
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="px-5 py-2.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:shadow-[0_4px_15px_var(--dh-glow-color)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-[13px] shrink-0 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} /> สร้างงาน
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoPageHeader;
