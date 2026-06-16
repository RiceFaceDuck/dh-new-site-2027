import React from 'react';
import { AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { useManagerTodo } from '../../todo/hooks/useManagerTodo';
import TodoItem from '../../../components/todo/TodoItem';
import WholesaleCard from '../../../components/todo/WholesaleCard';
import KnowledgeApprovalCard from '../../../components/todo/KnowledgeApprovalCard';

// Premium Skeleton Loader
const PremiumSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 h-[220px] flex flex-col justify-between animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-20 bg-slate-100 dark:bg-slate-900/50 rounded-xl"></div>
    </div>
    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1"></div>
    </div>
  </div>
);

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
    
    // 🌟 THE FIX: Process user approval logic before completing task
    if (type === 'STAFF_APPROVAL' && action === 'approve') {
        try {
            const { auth } = await import('../../../firebase/config');
            const { userService } = await import('../../../firebase/userService');
            
            const adminId = auth.currentUser?.uid || 'Admin';
            const targetUid = payload.targetUid;
            const newRole = payload.metadata?.requestedRole || 'staff';
            
            // 1. Update Role
            await userService.updateUserRole(adminId, targetUid, newRole);
            
            // 2. Grant Active & Staff Status
            await userService.updateUserProfile(targetUid, { 
                isStaff: true, 
                isActive: true, 
                roles: [newRole.charAt(0).toUpperCase() + newRole.slice(1)] 
            });
        } catch (err) {
            console.error("Failed to update user profile during staff approval", err);
            // Optionally could throw here to stop task completion if critical
        }
    }

    if (type === 'PRODUCT_KNOWLEDGE_APPROVAL' && action === 'approve') {
        try {
            const { auth } = await import('../../../firebase/config');
            const { productKnowledgeAdminService } = await import('../../../firebase/productKnowledgeAdminService');
            const adminId = auth.currentUser?.uid || 'Admin';
            
            const originalTask = managerTodos.find(t => t.id === taskId);
            if (!originalTask) throw new Error("ไม่พบข้อมูลงานต้นฉบับ");

            // Pass the original task object, which contains id, payload, createdByUid, etc.
            await productKnowledgeAdminService.approveKnowledgeTask(originalTask, adminId);
            return; // approveKnowledgeTask changes status already via transaction
        } catch (err) {
            console.error("Failed to approve product knowledge", err);
            alert("เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่: " + err.message);
            return;
        }
    }

    let newStatus = '';
    if (action === 'approve') newStatus = 'completed';
    if (action === 'reject') newStatus = 'rejected';
    
    if (newStatus) {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  const getUrgencyClass = (priority) => {
    return priority === 'High' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500';
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
        </div>
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
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50 min-h-[200px] animate-in zoom-in-95">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-sm font-bold text-red-800 dark:text-red-400">พบปัญหาการดึงข้อมูล</h3>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!managerTodos || managerTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px] animate-in fade-in slide-in-from-bottom-4 relative z-10 w-full">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <div className="w-28 h-28 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/40 dark:to-slate-800 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 dark:border-emerald-800 relative z-10">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight text-center">ยอดเยี่ยม! ไม่มีงานค้าง</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
          รายการที่ต้องอนุมัติทั้งหมด<br/>ถูกจัดการเรียบร้อยแล้ว
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          รายการอนุมัติของผู้จัดการ
        </h2>
        <span className="px-3 py-1.5 text-xs font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-sm">
          {managerTodos.length} รายการ
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-5">
        {managerTodos.map(task => {
          const type = task.type || task.taskType;
          const isWholesale = type === 'wholesale_request' || type === 'WHOLESALE_APPROVAL';
          
          const props = {
            todo: task,
            task: task, // KnowledgeApprovalCard expects 'task' prop
            isProcessing: processingId === task.id,
            isManagerTab: true,
            urgencyClass: getUrgencyClass(task.priority),
            handleAction: handleAction
          };

          if (isWholesale) {
            return <WholesaleCard key={task.id} {...props} />;
          }
          if (type === 'PRODUCT_KNOWLEDGE_APPROVAL') {
            return <KnowledgeApprovalCard key={task.id} {...props} />;
          }
          return <TodoItem key={task.id} {...props} />;
        })}
      </div>
    </div>
  );
}