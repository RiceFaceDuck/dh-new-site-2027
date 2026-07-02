import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Info, HelpCircle, UserPlus, Calendar, Package, Truck, MessageSquare, Megaphone } from 'lucide-react';
import { useManagerTodo } from '../../todo/hooks/useManagerTodo';
import { managerActionService } from '../../../firebase/managerActionService';
import { auth } from '../../../firebase/config';

// Import New Formal Cards
import FormalAdApprovalCard from '../../../components/todo/manager/cards/FormalAdApprovalCard';
import FormalStaffApprovalCard from '../../../components/todo/manager/cards/FormalStaffApprovalCard';
import FormalGenericTodoCard from '../../../components/todo/manager/cards/FormalGenericTodoCard';
import FormalWholesaleCard from '../../../components/todo/manager/cards/FormalWholesaleCard';
import FormalKnowledgeCard from '../../../components/todo/manager/cards/FormalKnowledgeCard';
import FormalLeaveApprovalCard from '../../../components/todo/manager/cards/FormalLeaveApprovalCard';

// Premium Skeleton Loader
const PremiumSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-md p-5 shadow-sm border border-slate-200 dark:border-slate-700 h-[120px] flex items-center animate-pulse">
    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md shrink-0 mr-4"></div>
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
    </div>
  </div>
);

// In-App Documentation Panel (AGENTS.md Rule)
const InAppDocPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden transition-all">
      <div 
        className="px-4 py-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-slate-700">
          <HelpCircle size={18} className="text-blue-600" />
          <h3 className="font-bold text-sm tracking-wide">คู่มือการใช้งาน: ระบบอนุมัติผู้จัดการ (Manager Approvals)</h3>
        </div>
        <span className="text-xs font-bold text-blue-600">{isOpen ? 'ซ่อนคู่มือ' : 'อ่านคู่มือ'}</span>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-slate-200 text-sm text-slate-700 space-y-4 bg-white">
          <div>
            <strong className="text-slate-800 flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span> ตำรา / คำอธิบาย:
            </strong>
            <p className="pl-3 text-slate-600">ระบบนี้ใช้สำหรับรวบรวมคำขอทั้งหมดที่ต้องการการตัดสินใจจากผู้จัดการ เช่น การอนุมัติราคาส่ง B2B, อนุมัติพนักงานใหม่, อนุมัติโฆษณา และการตรวจสอบความรู้</p>
          </div>
          <div>
            <strong className="text-slate-800 flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> วิธีการใช้งาน (How-to):
            </strong>
            <ol className="list-decimal pl-7 text-slate-600 space-y-1">
              <li>คลิกที่แถบรายการเพื่อ <strong>"กางออก"</strong> และดูรายละเอียดของคำขอ (ระบบจะดึงข้อมูลเมื่อคลิกเพื่อประหยัดทรัพยากร)</li>
              <li>ตรวจสอบข้อมูลให้ครบถ้วน เช่น นามบัตรลูกค้า หรือข้อมูลการขออนุมัติ</li>
              <li>กดปุ่ม <strong>"อนุมัติ"</strong> เพื่อยืนยัน หรือ <strong>"ปฏิเสธ"</strong> หากข้อมูลไม่ถูกต้อง</li>
            </ol>
          </div>
          <div>
            <strong className="text-slate-800 flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span> เทคนิคการใช้งาน (Tips & Tricks):
            </strong>
            <ul className="list-disc pl-7 text-slate-600 space-y-1">
              <li>กดที่แถบรายการซ้ำเพื่อ <strong>พับเก็บ</strong> ช่วยให้หน้าจอไม่รก</li>
              <li>ป้ายกำกับ <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px]">URGENT</span> หมายถึงงานด่วน ควรจัดการก่อน</li>
            </ul>
          </div>
          <div className="bg-rose-50 p-3 rounded-md border border-rose-100">
            <strong className="text-rose-800 flex items-center gap-1.5 mb-1">
              <AlertCircle size={14} /> ตัวอย่างผลลัพธ์ (Expected Results):
            </strong>
            <p className="text-rose-700 text-xs leading-relaxed">
              เมื่อกด "ปฏิเสธ" ระบบจะบังคับให้คุณกรอกเหตุผล เพื่อบันทึกลง History Log เสมอ การอนุมัติราคาส่งจะคำนวณยอดสุทธิใหม่ให้ทันที
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ManagerTaskSection() {
  const { 
    managerTodos, 
    loading, 
    error, 
    updateTaskStatus, 
    deleteManagerTask,
    processingId
  } = useManagerTodo();

  const handleAction = async (taskId, action, type, payload) => {
    if (action === 'delete') {
      await deleteManagerTask(taskId);
      return;
    }
    
    // 🌟 SRP Refactoring: Delegate to the dedicated service
    try {
      const adminId = auth.currentUser?.uid || 'Admin';
      const originalTask = managerTodos.find(t => t.id === taskId);
      if (!originalTask) throw new Error("ไม่พบข้อมูลงานต้นฉบับ");

      let newStatus = '';

      if (action === 'approve') {
        const result = await managerActionService.handleApproval(taskId, type, payload, originalTask, adminId);
        newStatus = result.newStatus;
      } else if (action === 'reject') {
        const result = await managerActionService.handleRejection(taskId, type, payload, originalTask, adminId, payload?.reason);
        newStatus = result.newStatus;
      }
      
      if (newStatus) {
        await updateTaskStatus(taskId, newStatus);
      }
    } catch (err) {
      console.error(`Failed to handle ${action} for ${type}`, err);
      alert("เกิดข้อผิดพลาดในการดำเนินการ: " + err.message);
    }
  };

  // --- Helper Functions mapped from TodoItem.jsx ---
  const getIconForType = (type) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'STAFF_APPROVAL': return <UserPlus size={20} className="text-blue-600" />;
      case 'LEAVE_APPROVAL': return <Calendar size={20} className="text-orange-600" />;
      case 'MANUAL_TASK': return <Calendar size={20} className="text-indigo-600" />;
      case 'PACKING_TASK': return <Package size={20} className="text-orange-600" />;
      case 'FOLLOW_UP': return <MessageSquare size={20} className="text-teal-600" />;
      case 'INVENTORY': return <Truck size={20} className="text-purple-600" />;
      case 'CLAIM_APPROVAL': 
      case 'CANCEL_CLAIM_APPROVAL':
      case 'CANCEL_RETURN_APPROVAL':
      case 'PRODUCT_DELETE_APPROVAL':
      case 'BILL_CANCEL_APPROVAL':
      case 'RETURN_APPROVAL': return <AlertCircle size={20} className="text-rose-600" />;
      case 'AD_APPROVAL': 
      case 'USER_SKU_APPROVAL':
      case 'BILLBOARD_APPROVAL': return <Megaphone size={20} className="text-indigo-600" />; 
      default: return <Info size={20} className="text-slate-400" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 tracking-wider">WAITING</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse border border-blue-200 tracking-wider">IN PROGRESS</span>;
      case 'pending_manager': 
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200 tracking-wider">PENDING MGR</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const createRejectHandler = (todo) => () => {
    const reason = window.prompt(`⚠️ คุณกำลังจะ ปฏิเสธคำขอ\n\nกรุณาระบุเหตุผลที่ชัดเจนเพื่อบันทึกลงระบบ (บังคับ):`);
    if (reason === null) return;
    if (reason.trim().length < 2) {
      alert('❌ กรุณาระบุเหตุผลให้ชัดเจนกว่านี้ (อย่างน้อย 2 ตัวอักษร)');
      return;
    }
    handleAction(todo.id, 'reject', todo.type, { 
      ...(todo.payload || {}),
      orderId: todo.orderId || todo.payload?.orderId,
      reason: reason.trim(), 
      adPayload: todo.adPayload 
    });
  };

  const getUrgencyClass = (priority) => {
    return priority === 'High' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500';
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <InAppDocPanel />
        <div className="grid grid-cols-1 gap-4">
          <PremiumSkeleton />
          <PremiumSkeleton />
          <PremiumSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-rose-50 rounded-md border border-rose-200 min-h-[200px]">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-sm font-bold text-rose-800">พบปัญหาการดึงข้อมูล</h3>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!managerTodos || managerTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px] animate-in fade-in slide-in-from-bottom-4 relative z-10 w-full">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <div className="w-28 h-28 bg-gradient-to-br from-emerald-50 to-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100 relative z-10">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight text-center">ALL CAUGHT UP</h3>
        <p className="text-sm text-slate-500 font-medium text-center leading-relaxed">
          ไม่มีรายการที่รอการอนุมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      <InAppDocPanel />

      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-wide">
          <ClipboardList className="w-5 h-5 text-slate-700" />
          MANAGER APPROVALS
        </h2>
        <span className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-md shadow-sm">
          {managerTodos.length} ITEMS
        </span>
      </div>
      
      <div className="flex flex-col">
        {managerTodos.map(task => {
          const type = (task.type || task.taskType || '').toUpperCase();
          const isWholesale = type === 'WHOLESALE_REQUEST' || type === 'WHOLESALE_APPROVAL';
          const isAdTask = ['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL'].includes(type);
          const isStaffApprovalTask = type === 'STAFF_APPROVAL';
          const isLeaveApprovalTask = type === 'LEAVE_APPROVAL';
          
          const props = {
            todo: task,
            task: task, 
            isProcessing: processingId === task.id,
            isManagerTab: true,
            urgencyClass: getUrgencyClass(task.priority),
            handleAction: handleAction,
            getStatusBadge: getStatusBadge,
            formatDate: formatDate,
            handleRejectClick: createRejectHandler(task),
            getIconForType: getIconForType
          };

          if (isWholesale) {
            return <FormalWholesaleCard key={task.id} {...props} />;
          }
          if (type === 'PRODUCT_KNOWLEDGE_APPROVAL') {
            return <FormalKnowledgeCard key={task.id} {...props} />;
          }
          if (isStaffApprovalTask) {
            return <FormalStaffApprovalCard key={task.id} {...props} />;
          }
          if (isLeaveApprovalTask) {
            return <FormalLeaveApprovalCard key={task.id} {...props} />;
          }
          if (isAdTask) {
            return <FormalAdApprovalCard key={task.id} {...props} />;
          }
          
          return <FormalGenericTodoCard key={task.id} {...props} />;
        })}
      </div>
    </div>
  );
}