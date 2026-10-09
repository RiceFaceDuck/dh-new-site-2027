import { useState } from 'react';
import toast from 'react-hot-toast';
import PremiumDialog from '../common/PremiumDialog';
import { Info, AlertCircle, Calendar, Package, Truck, MessageSquare, Megaphone, UserPlus, ShieldCheck } from 'lucide-react';
import { formatDate } from 'dh-shared';
import StaffApprovalCard from './cards/StaffApprovalCard';
import AdApprovalCard from './cards/AdApprovalCard';
import StoreProfileApprovalCard from './cards/StoreProfileApprovalCard';
import GenericTodoCard from './cards/GenericTodoCard';
import LeaveApprovalCard from './cards/LeaveApprovalCard';
import KnowledgeCard from './cards/KnowledgeCard';
import PromotionCard from './cards/PromotionCard';


export default function TodoItem({ todo, isProcessing, isManagerTab, urgencyLevel, handleAction }) {
  
  // 🌟 แมปปิ้งไอคอนให้ตรงกับประเภทงาน (รองรับทั้งตัวพิมพ์เล็ก-ใหญ่)
  const getIconForType = (type) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'WARRANTY_SETUP': return <ShieldCheck size={20} className="text-amber-500" />;
      case 'STAFF_APPROVAL': return <UserPlus size={20} className="text-blue-500" />;
      case 'MANUAL_TASK': return <Calendar size={20} className="text-dh-accent" />;
      case 'PACKING_TASK': return <Package size={20} className="text-orange-500" />;
      case 'FOLLOW_UP': return <MessageSquare size={20} className="text-teal-500" />;
      case 'INVENTORY': return <Truck size={20} className="text-purple-500" />;
      case 'CLAIM_APPROVAL': 
      case 'EXCHANGE_APPROVAL':
      case 'CANCEL_CLAIM_APPROVAL':
      case 'CANCEL_EXCHANGE_APPROVAL':
      case 'CANCEL_RETURN_APPROVAL':
      case 'PRODUCT_DELETE_APPROVAL':
      case 'BILL_CANCEL_APPROVAL':
      case 'RETURN_APPROVAL': return <AlertCircle size={20} className="text-rose-500" />;
      case 'AD_APPROVAL': 
      case 'USER_SKU_APPROVAL':
      case 'BILLBOARD_APPROVAL':
      case 'APPROVE_PARTNER_AD':
      case 'APPROVE_BILLBOARD_AD':
      case 'BUSINESS_CARD_AD_APPROVAL': return <Megaphone size={20} className="text-indigo-500" />; 
      default: return <Info size={20} className="text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const isCancelRequest = todo.type?.startsWith('CANCEL_');
    if (isCancelRequest && (status === 'pending_manager' || status === 'pending')) {
      return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200">🚨 รออนุมัติยกเลิก</span>;
    }
    switch (status) {
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">รอเริ่มงาน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse border border-blue-200">⏳ กำลังดำเนินการ</span>;
      case 'pending_manager': 
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200">👑 รอผู้จัดการอนุมัติ</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

  // 🛡️ ฟังก์ชันกลางสำหรับจัดการการยกเลิก/ปฏิเสธงาน (UX Fail-Safe)
  const handleRejectClick = () => {
    const actionName = isManagerTab ? 'ปฏิเสธคำขอ' : 'ยกเลิกงาน';
    
    setDialogConfig({
      isOpen: true,
      title: `⚠️ คุณกำลังจะ ${actionName}`,
      message: 'กรุณาระบุเหตุผลที่ชัดเจนเพื่อบันทึกลงระบบ (บังคับ):',
      type: 'warning',
      requireInput: true,
      allowEmptyInput: false,
      inputPlaceholder: 'ระบุเหตุผล (อย่างน้อย 2 ตัวอักษร)...',
      onConfirm: (reason) => {
        if (typeof reason !== 'string' || reason.trim().length < 2) {
          toast.error('❌ กรุณาระบุเหตุผลให้ชัดเจนกว่านี้ (อย่างน้อย 2 ตัวอักษร)');
          return;
        }
        setDialogConfig({ ...dialogConfig, isOpen: false });
        
        // ส่งโครงสร้างที่ถูกต้องให้ Todo.jsx โดยนำ payload เดิมไปส่งรวมด้วย
        handleAction(todo.id, 'reject', todo.type, { 
          ...(todo.payload || {}), // ดึง payload เก่าติดไปด้วยสำหรับ Service ที่ต้องการ (เช่น claimService)
          orderId: todo.orderId || todo.payload?.orderId,
          reason: reason.trim(), 
          adPayload: todo.adPayload 
        });
      },
      onCancel: () => setDialogConfig({ ...dialogConfig, isOpen: false })
    });
  };

  const type = todo.type?.toUpperCase() || todo.taskType?.toUpperCase();
  const isAdTask = ['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD', 'BUSINESS_CARD_AD_APPROVAL'].includes(type);
  const isStaffApprovalTask = type === 'STAFF_APPROVAL';
  const isLeaveApprovalTask = type === 'LEAVE_APPROVAL';
  const isKnowledgeTask = type === 'PRODUCT_KNOWLEDGE_APPROVAL';
  const isPromotionTask = type === 'PROMOTION_ALERT' || todo.type === 'promotion_alert' || (todo.title && todo.title.includes('แจ้งโปรโมชัน'));

  const props = {
    todo, isProcessing, isManagerTab, urgencyLevel, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType
  };

  if (isPromotionTask) {
    return (
      <>
        <PromotionCard 
          todo={todo} 
          formatDate={formatDate} 
          handleAction={handleAction} 
          isProcessing={isProcessing} 
          handleRejectClick={handleRejectClick} 
        />
        <PremiumDialog {...dialogConfig} />
      </>
    );
  }

  if (isStaffApprovalTask) {
    return (
      <>
        <StaffApprovalCard {...props} />
        <PremiumDialog {...dialogConfig} />
      </>
    );
  }

  if (isAdTask) {
    const adData = todo.adPayload || todo.adDetails || todo.payload?.adPayload || todo.payload?.adDetails;
    const isStoreProfileTask = 
      type === 'BUSINESS_CARD_AD_APPROVAL' ||
      adData?.type === 'BUSINESS_CARD' ||
      todo.targetSkuId?.startsWith('AD-CARD-') ||
      todo.id?.includes('AD-CARD') ||
      Boolean(adData?.phone || adData?.services || adData?.latitude);

    if (isStoreProfileTask) {
      return (
        <>
          <StoreProfileApprovalCard {...props} />
          <PremiumDialog {...dialogConfig} />
        </>
      );
    }

    return (
      <>
        <AdApprovalCard {...props} />
        <PremiumDialog {...dialogConfig} />
      </>
    );
  }

  if (isLeaveApprovalTask) {
    return (
      <>
        <LeaveApprovalCard {...props} />
        <PremiumDialog {...dialogConfig} />
      </>
    );
  }

  if (isKnowledgeTask) {
    return (
      <>
        <KnowledgeCard {...props} />
        <PremiumDialog {...dialogConfig} />
      </>
    );
  }

  return (
    <>
      <GenericTodoCard {...props} />
      <PremiumDialog {...dialogConfig} />
    </>
  );
}