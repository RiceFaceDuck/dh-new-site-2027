import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';

// 🚀 THE FIX [Clean Architecture]: นำเข้า Hook ของผู้จัดการที่เบาและแก้บั๊คเรียบร้อยแล้ว
import { useManagerTodo } from '../../todo/hooks/useManagerTodo';

// 📦 นำเข้า UI Cards สำหรับแสดงผลงานรูปแบบต่างๆ
import TodoItem from '../../../components/todo/TodoItem';
import WholesaleCard from '../../../components/todo/WholesaleCard';

export default function ManagerTaskSection() {
  // ดึงข้อมูลและฟังก์ชันจัดการ (ลบ/อัปเดต) จาก Hook ที่เชื่อมกับ managerTodoService โดยตรง
  const { 
    managerTodos, 
    loading, 
    error, 
    updateTaskStatus, 
    deleteManagerTask 
  } = useManagerTodo();

  // ----------------------------------------------------------------------
  // 1. สถานะกำลังโหลดข้อมูล
  // ----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm min-h-[200px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-500 tracking-wide animate-pulse">
          กำลังประมวลผลงานของ Manager...
        </span>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 2. สถานะเกิดข้อผิดพลาด
  // ----------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl border border-red-100 min-h-[200px]">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-sm font-bold text-red-800">พบปัญหาการดึงข้อมูล</h3>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 3. สถานะไม่มีงานค้าง (Empty State)
  // ----------------------------------------------------------------------
  if (!managerTodos || managerTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/60 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 shadow-sm min-h-[200px]">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">เยี่ยมมาก! ไม่มีงานค้าง</h3>
        <p className="text-sm text-slate-500 mt-1">รายการที่ต้องอนุมัติทั้งหมดถูกจัดการเรียบร้อยแล้ว</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 4. แสดงผลรายการงาน (Task List)
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header ส่วนของงาน */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
          รายการอนุมัติและงานของผู้จัดการ
        </h2>
        <span className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
          {managerTodos.length} รายการ
        </span>
      </div>
      
      {/* กางรายการ Task Cards */}
      <div className="grid grid-cols-1 gap-4">
        {managerTodos.map(task => {
          const type = task.type || task.taskType;
          
          // 🚀 THE FIX [Bug Fix ลบ/ยกเลิก]: 
          // เราส่ง deleteManagerTask(task.id) ลงไปให้ Card ย่อยใช้งานโดยตรง
          
          // ตรวจสอบชนิดของงานเพื่อ Render Card ให้ตรงประเภท
          if (type === 'wholesale_request' || type === 'WHOLESALE_APPROVAL') {
            return (
              <WholesaleCard 
                key={task.id} 
                task={task} 
                onUpdateStatus={(newStatus, payload) => updateTaskStatus(task.id, newStatus, payload)} 
                onDelete={() => deleteManagerTask(task.id)}
              />
            );
          }
          
          // Fallback: หากเป็นงานประเภทอื่น (เช่น AD_APPROVAL, STAFF_APPROVAL) ให้ใช้ TodoItem มาตรฐาน
          return (
            <TodoItem 
              key={task.id} 
              todo={task} 
              onUpdateStatus={(newStatus, payload) => updateTaskStatus(task.id, newStatus, payload)} 
              onDelete={() => deleteManagerTask(task.id)}
            />
          );
        })}
      </div>
    </div>
  );
}