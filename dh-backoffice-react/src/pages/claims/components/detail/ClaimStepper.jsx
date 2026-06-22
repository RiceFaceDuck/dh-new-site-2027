import React from 'react';
import { CheckCircle2, Clock, Package, AlertCircle } from 'lucide-react';

export default function ClaimStepper({ status, isCancel }) {
  if (isCancel || status === 'rejected' || status === 'cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/30 p-3 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <div>
          <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">รายการนี้ถูกยกเลิก/ปฏิเสธ</h4>
          <p className="text-xs text-rose-600/80 dark:text-rose-500">คำร้องขอนี้ถูกยุติกระบวนการแล้ว</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'pending_manager', label: 'รับเรื่อง', icon: Clock },
    { id: 'waiting_item', label: 'รอรับของ', icon: Package },
    { id: 'processing', label: 'ตรวจสอบ', icon: Clock },
    { id: 'completed', label: 'เสร็จสิ้น', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  // 'approved' is legacy but we handle it
  if (status === 'approved') return null; 

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
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 w-16">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
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
