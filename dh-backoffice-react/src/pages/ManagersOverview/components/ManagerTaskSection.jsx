import { useState } from 'react';
import { 
  AlertCircle, CheckCircle2, ClipboardCheck, Info, HelpCircle, 
  UserPlus, Calendar, Package, Truck, MessageSquare, Megaphone, ShieldCheck 
} from 'lucide-react';
import { useManagerTodo } from '../../todo/hooks/useManagerTodo';
import { managerActionService } from '../../../firebase/managerActionService';
import { auth } from '../../../firebase/config';

import TodoItem from '../../../components/todo/TodoItem';
import WholesaleCard from '../../../components/todo/WholesaleCard';

// 💎 Premium Skeleton Loader
const PremiumSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-200 dark:border-slate-700 h-[80px] flex items-center animate-pulse">
    <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0 mr-3"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-sm w-1/2"></div>
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-sm w-1/3"></div>
    </div>
  </div>
);

// 📖 In-App Documentation Modal (ตรงกับ Production)
const ManagerDocModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
            <ClipboardCheck size={18} className="text-blue-600 dark:text-blue-400" />
            <span>คู่มือการใช้งาน: ระบบอนุมัติผู้จัดการ</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <strong className="text-slate-800 dark:text-white block mb-1">💡 คำอธิบาย:</strong>
            <p className="leading-relaxed">ระบบรวบรวมคำขอที่ต้องการการตัดสินใจจากผู้จัดการ (อนุมัติราคาส่ง, พนักงานใหม่, โฆษณา, ประกันหมวดใหม่ ฯลฯ)</p>
          </div>
          <div>
            <strong className="text-slate-800 dark:text-white block mb-1">📌 วิธีใช้งาน:</strong>
            <ol className="list-decimal pl-5 space-y-1">
              <li>ตรวจสอบข้อมูลในรายการคำขอ</li>
              <li>กดปุ่ม <strong>"อนุมัติ"</strong> เพื่อยืนยัน หรือ <strong>"ปฏิเสธ"</strong> หากไม่ถูกต้อง</li>
              <li>สำหรับงานตั้งค่าประกัน สามารถกด <strong>"ตั้งค่าประกัน ↗"</strong> เพื่อไปยังหน้าตั้งค่าโดยตรง</li>
            </ol>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
            <strong className="text-rose-800 dark:text-rose-300 block mb-0.5">⚠️ ข้อควรระวัง:</strong>
            <p className="text-rose-700 dark:text-rose-400 text-[11px]">การปฏิเสธคำขอ ต้องกรอกเหตุผลบันทึกลง History Log เสมอ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ManagerTaskSection() {
  const [isDocOpen, setIsDocOpen] = useState(false);
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
      case 'STAFF_APPROVAL': return <UserPlus size={16} className="text-blue-600" />;
      case 'LEAVE_APPROVAL': return <Calendar size={16} className="text-orange-600" />;
      case 'MANUAL_TASK': return <Calendar size={16} className="text-indigo-600" />;
      case 'PACKING_TASK': return <Package size={16} className="text-orange-600" />;
      case 'FOLLOW_UP': return <MessageSquare size={16} className="text-teal-600" />;
      case 'INVENTORY': return <Truck size={16} className="text-purple-600" />;
      case 'CLAIM_APPROVAL': 
      case 'EXCHANGE_APPROVAL':
      case 'CANCEL_CLAIM_APPROVAL':
      case 'CANCEL_EXCHANGE_APPROVAL':
      case 'CANCEL_RETURN_APPROVAL':
      case 'PRODUCT_DELETE_APPROVAL':
      case 'BILL_CANCEL_APPROVAL':
      case 'RETURN_APPROVAL': return <AlertCircle size={16} className="text-rose-600" />;
      case 'AD_APPROVAL': 
      case 'USER_SKU_APPROVAL':
      case 'BILLBOARD_APPROVAL': return <Megaphone size={16} className="text-indigo-600" />; 
      default: return <Info size={16} className="text-slate-400" />;
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

  const getStatusBadge = (status, taskType) => {
    if (taskType?.startsWith('CANCEL_') && (status === 'pending_manager' || status === 'pending')) {
      return (
        <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
          🚨 รออนุมัติยกเลิก
        </span>
      );
    }
    switch (status) {
      case 'todo': 
        return (
          <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 dark:border-slate-600 shadow-2xs">
            รอเริ่มงาน
          </span>
        );
      case 'in_progress': 
      case 'processing': 
        return (
          <span className="bg-slate-100/90 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
            ⏳ กำลังดำเนินการ
          </span>
        );
      case 'waiting_item': 
        return (
          <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
            📦 รอพัสดุมาถึง
          </span>
        );
      case 'pending_manager': 
      case 'pending': 
        return (
          <span className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
            👑 รอผู้จัดการอนุมัติ
          </span>
        );
      default: 
        return (
          <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-2xs">
            {status}
          </span>
        );
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
      <div className="p-4 space-y-3">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2 animate-pulse mb-4"></div>
        <div className="flex flex-col gap-2.5">
          <PremiumSkeleton />
          <PremiumSkeleton />
          <PremiumSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 flex flex-col items-center justify-center p-6 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
        <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300">พบปัญหาการดึงข้อมูล</h3>
        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!managerTodos || managerTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[300px] relative z-10 w-full text-center">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50 mb-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 tracking-tight">ALL CAUGHT UP</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          ไม่มีรายการที่รอการอนุมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 h-full flex flex-col min-h-0 space-y-3 animate-in fade-in duration-300">
      <ManagerDocModal isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />

      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            การอนุมัติของผู้จัดการ
          </h2>
          <button 
            onClick={() => setIsDocOpen(true)}
            title="อ่านคู่มือการใช้งาน"
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <span className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-full shadow-2xs">
          {managerTodos.length} รายการ
        </span>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-2 flex flex-col gap-3.5">
        {managerTodos.map(task => {
          const type = (task.type || task.taskType || '').toUpperCase();
          const isWholesale = type === 'WHOLESALE_REQUEST' || type === 'WHOLESALE_APPROVAL';
          
          const urgencyClass = getUrgencyClass(task.priority);
          let urgencyLevel = 'low';
          if (urgencyClass.includes('red')) urgencyLevel = 'high';
          else if (urgencyClass.includes('orange')) urgencyLevel = 'medium';

          const props = {
            todo: task,
            isProcessing: processingId === task.id,
            isManagerTab: true,
            urgencyLevel,
            handleAction,
            getStatusBadge: (status) => getStatusBadge(status, task.type || task.taskType),
            formatDate,
            handleRejectClick: () => createRejectHandler(task)(),
            getIconForType
          };

          if (isWholesale) {
            return (
              <div key={task.id} className="shrink-0">
                <WholesaleCard {...props} />
              </div>
            );
          }
          
          return (
            <div key={task.id} className="shrink-0">
              <TodoItem {...props} />
            </div>
          );
        })}
      </div>
    </div>
  );
}