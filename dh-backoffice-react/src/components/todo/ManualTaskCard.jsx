import React from 'react';
import { Clock, CalendarCheck } from 'lucide-react';

/**
 * ManualTaskCard Component
 * รับผิดชอบการแสดงผลรายละเอียดงานทั่วไป (MANUAL_TASK) รวมถึงกำหนดวันส่งงาน
 */
export default function ManualTaskCard({ payload }) {
  if (!payload) return null;

  return (
    <div className="mt-4 ml-0 xl:ml-12 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 shadow-sm animate-in fade-in">
      <div className="flex items-center gap-3">
         <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg shrink-0">
           <CalendarCheck size={20} className="text-dh-accent" />
         </div>
         
         <div>
            <p className="text-[10px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-0.5">
              รายละเอียดงานที่ต้องทำ
            </p>
            
            {/* ตรวจสอบว่ามีการกำหนดวันส่งงานหรือไม่ */}
            {payload.dueDate ? (
              <div className="flex items-center gap-1.5 text-sm font-black text-dh-accent">
                <Clock size={14} /> กำหนดส่ง: {new Date(payload.dueDate).toLocaleString('th-TH', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })} น.
              </div>
            ) : (
              <p className="text-sm font-medium text-orange-700 dark:text-orange-500">
                ไม่ได้กำหนดวันส่งงาน (เปิดกว้าง)
              </p>
            )}
         </div>
      </div>

      {/* แสดงข้อมูลการมอบหมาย (ถ้ามีและไม่ใช่ all) */}
      {payload.assignedTo && payload.assignedTo !== 'all' && (
         <div className="mt-3 pt-2 border-t border-orange-100 dark:border-orange-900/30">
           <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/50 px-2 py-1 rounded">
             มอบหมายให้: {payload.assignedTo}
           </span>
         </div>
      )}
    </div>
  );
}