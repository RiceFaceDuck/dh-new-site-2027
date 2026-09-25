import { CheckCircle2, Clock, Package, AlertCircle, Ban, ArrowLeftRight, Undo2, Wrench } from 'lucide-react';

export default function ClaimStepper({ status, isCancel, type = '', isSwapSku = false }) {
  if (status === 'cancelled') {
    return (
      <div className="bg-slate-100 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
        <Ban className="w-5 h-5 text-slate-500 shrink-0" />
        <div>
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">คำร้องนี้ถูกยกเลิกแล้ว</h4>
          <p className="text-xs text-slate-500">กระบวนการดำเนินการถูกยกเลิกเรียบร้อย</p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/30 p-3.5 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <div>
          <h4 className="text-sm font-black text-rose-700 dark:text-rose-400">คำร้องนี้ไม่ผ่านการอนุมัติ</h4>
          <p className="text-xs text-rose-600/80 dark:text-rose-500">ผู้จัดการได้ปฏิเสธคำร้องขอนี้</p>
        </div>
      </div>
    );
  }

  if (isCancel || type?.startsWith('CANCEL_')) {
    return (
      <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30 p-3.5 rounded-xl flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
        <div>
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">คำร้องขอยกเลิก (รอผู้จัดการพิจารณา)</h4>
          <p className="text-xs text-amber-700/80 dark:text-amber-400">อยู่ระหว่างรอผู้จัดการอนุมัติคำขอยกเลิกรายการ</p>
        </div>
      </div>
    );
  }

  const isExchange = type === 'EXCHANGE_APPROVAL' || isSwapSku;
  const isReturn = type === 'RETURN_APPROVAL';

  const steps = [
    { id: 'pending_manager', label: 'รับเรื่อง', icon: Clock },
    { 
      id: 'waiting_item', 
      label: isExchange ? 'รอรับของเดิม' : isReturn ? 'รอรับของคืน' : 'รอรับของเคลม', 
      icon: Package 
    },
    { id: 'processing', label: 'กำลังตรวจ', icon: isExchange ? ArrowLeftRight : isReturn ? Undo2 : Wrench },
    { 
      id: 'completed', 
      label: isExchange ? 'เปลี่ยนของใหม่' : isReturn ? 'คืนเงินสำเร็จ' : 'เสร็จสิ้น', 
      icon: CheckCircle2 
    }
  ];

  const statusStepMap = {
    'pending': 0,
    'pending_manager': 0,
    'waiting_item': 1,
    'arrived': 2,
    'processing': 2,
    'approved': 3,
    'completed': 3
  };

  const activeIndex = statusStepMap[status] !== undefined ? statusStepMap[status] : 0;
  const isAllCompleted = status === 'completed' || status === 'approved';

  return (
    <div className="w-full py-4 px-2">
      <div className="relative flex justify-between">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dh-border -translate-y-1/2 z-0"></div>
        
        {/* Active Line Progress */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-dh-accent -translate-y-1/2 z-0 transition-all duration-500 ease-out"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeIndex || (index === activeIndex && isAllCompleted);
          const isActive = index === activeIndex && !isAllCompleted;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 w-20">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs
                ${isCompleted ? 'bg-dh-accent text-white border border-dh-accent shadow-dh-accent/20' : 
                  isActive ? 'bg-dh-surface text-dh-accent border-2 border-dh-accent shadow-md animate-pulse' : 
                  'bg-dh-base text-dh-muted border border-dh-border'}`}
              >
                <Icon className={`w-4 h-4 ${isCompleted ? 'scale-110' : isActive ? 'animate-bounce' : ''}`} />
              </div>
              <span className={`text-[10px] font-bold text-center transition-colors
                ${isCompleted || isActive ? 'text-dh-main' : 'text-dh-muted'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
