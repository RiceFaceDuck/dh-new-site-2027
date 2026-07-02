import React from 'react';
import { Info, AlertCircle, Calendar, Package, Truck, MessageSquare, Megaphone, UserPlus, Briefcase, Mail, Check, X, Play, ExternalLink, Image as ImageIcon, Clock } from 'lucide-react';
import StaffApprovalCard from './cards/StaffApprovalCard';
import AdApprovalCard from './cards/AdApprovalCard';
import GenericTodoCard from './cards/GenericTodoCard';

export default function TodoItem({ todo, isProcessing, isManagerTab, urgencyLevel, handleAction }) {
  
  // 🌟 แมปปิ้งไอคอนให้ตรงกับประเภทงาน (รองรับทั้งตัวพิมพ์เล็ก-ใหญ่)
  const getIconForType = (type) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'STAFF_APPROVAL': return <UserPlus size={20} className="text-blue-500" />;
      case 'MANUAL_TASK': return <Calendar size={20} className="text-dh-accent" />;
      case 'PACKING_TASK': return <Package size={20} className="text-orange-500" />;
      case 'FOLLOW_UP': return <MessageSquare size={20} className="text-teal-500" />;
      case 'INVENTORY': return <Truck size={20} className="text-purple-500" />;
      case 'CLAIM_APPROVAL': 
      case 'CANCEL_CLAIM_APPROVAL':
      case 'CANCEL_RETURN_APPROVAL':
      case 'PRODUCT_DELETE_APPROVAL':
      case 'BILL_CANCEL_APPROVAL':
      case 'RETURN_APPROVAL': return <AlertCircle size={20} className="text-rose-500" />;
      case 'AD_APPROVAL': 
      case 'USER_SKU_APPROVAL':
      case 'BILLBOARD_APPROVAL': return <Megaphone size={20} className="text-indigo-500" />; 
      default: return <Info size={20} className="text-slate-400" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    // รองรับทั้งแบบ Firestore Timestamp และ ISO String
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">รอเริ่มงาน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse border border-blue-200">⏳ กำลังดำเนินการ</span>;
      case 'pending_manager': 
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200">👑 รอผู้จัดการอนุมัติ</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  // 🛡️ ฟังก์ชันกลางสำหรับจัดการการยกเลิก/ปฏิเสธงาน (UX Fail-Safe)
  const handleRejectClick = () => {
    const actionName = isManagerTab ? 'ปฏิเสธคำขอ' : 'ยกเลิกงาน';
    
    // ลูกเล่น: บังคับให้ใส่เหตุผล ไม่ให้ลักไก่ส่งค่าว่าง
    const reason = window.prompt(`⚠️ คุณกำลังจะ ${actionName}\n\nกรุณาระบุเหตุผลที่ชัดเจนเพื่อบันทึกลงระบบ (บังคับ):`);
    
    if (reason === null) return; // User กด Cancel ในหน้าต่าง Prompt
    
    if (reason.trim().length < 2) {
      alert('❌ กรุณาระบุเหตุผลให้ชัดเจนกว่านี้ (อย่างน้อย 2 ตัวอักษร)');
      return;
    }

    // ส่งโครงสร้างที่ถูกต้องให้ Todo.jsx โดยนำ payload เดิมไปส่งรวมด้วย
    handleAction(todo.id, 'reject', todo.type, { 
      ...(todo.payload || {}), // ดึง payload เก่าติดไปด้วยสำหรับ Service ที่ต้องการ (เช่น claimService)
      orderId: todo.orderId || todo.payload?.orderId,
      reason: reason.trim(), 
      adPayload: todo.adPayload 
    });
  };

  const type = todo.type?.toUpperCase() || todo.taskType?.toUpperCase();
  const isAdTask = ['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL'].includes(type);
  const isStaffApprovalTask = type === 'STAFF_APPROVAL';

  const props = {
    todo, isProcessing, isManagerTab, urgencyLevel, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType
  };

  if (isStaffApprovalTask) {
    return <StaffApprovalCard {...props} />;
  }

  if (isAdTask) {
    return <AdApprovalCard {...props} />;
  }

  return <GenericTodoCard {...props} />;
}