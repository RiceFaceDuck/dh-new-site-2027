import { useState, useCallback } from 'react';
import { auth, db } from '../../../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { todoService } from '../../../firebase/todoService';
import { claimService } from '../../../firebase/claimService';
import toast from 'react-hot-toast';

/**
 * 🎯 Hook Controller จัดการ Action Routing และ Dispatching ของระบบ To-do ส่วนกลาง
 * สกัด Business Logic, Error Dialog และการประสานงานข้าม Service ออกจาก UI Presentational Component
 */
export const useTodoActionDispatcher = ({ todos = [], activeTodos = [], updateTodoStatus }) => {
  const [processingId, setProcessingId] = useState(null);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

  const handleAction = useCallback(async (taskId, action, actionType, payload = {}) => {
    setProcessingId(taskId);
    try {
      const fullTask = (todos || activeTodos).find(t => t.id === taskId);
      const currentUser = auth.currentUser;
      const currentUid = currentUser?.uid || 'Admin';
      const currentName = currentUser?.displayName || 'Admin';

      if (action === 'approve') {
        if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType === 'EXCHANGE_APPROVAL' || actionType?.startsWith('CANCEL_')) {
          if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
          await claimService.approveRequest(fullTask, currentUid, currentName);
        } else if (actionType === 'wholesale_request' || actionType === 'WHOLESALE_APPROVAL') {
          const { managerActionService } = await import('../../../firebase/managerActionService');
          const result = await managerActionService.handleApproval(taskId, actionType, payload, fullTask, currentUid);
          if (result?.success && result?.newStatus && updateTodoStatus) {
            await updateTodoStatus(taskId, result.newStatus);
          }
        } else if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD', 'BUSINESS_CARD_AD_APPROVAL'].includes(actionType)) {
          const { managerActionService } = await import('../../../firebase/managerActionService');
          const result = await managerActionService.handleApproval(taskId, actionType, payload, fullTask, currentUid);
          if (result?.success) {
            toast.success("✅ อนุมัติข้อมูลร้านค้า/โฆษณาเรียบร้อยแล้ว");
          }
        }
      } else if (action === 'reject') {
        if (actionType === 'WHOLESALE_APPROVAL' || actionType === 'wholesale_request') {
          await todoService.rejectWholesale(taskId, payload.orderId);
        } else if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType === 'EXCHANGE_APPROVAL' || actionType?.startsWith('CANCEL_')) {
          if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
          await claimService.rejectRequest(fullTask, payload.reason || 'ปฏิเสธโดยแอดมิน', currentUid);
        } else if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD', 'BUSINESS_CARD_AD_APPROVAL'].includes(actionType)) {
          const { managerActionService } = await import('../../../firebase/managerActionService');
          const result = await managerActionService.handleRejection(taskId, actionType, payload, fullTask, currentUid, payload.reason || 'ข้อมูลไม่ผ่านเกณฑ์');
          if (result?.success) {
            toast.success("ปฏิเสธคำขอเรียบร้อยแล้ว");
          }
        } else {
          await todoService.rejectTask(taskId, payload.reason);
        }
      } else if (action === 'start') {
        await todoService.startTask(taskId);
      } else if (action === 'complete') {
        await todoService.completeTask(taskId);
      } else if (action === 'markArrived') {
        if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType === 'EXCHANGE_APPROVAL' || actionType?.startsWith('CANCEL_')) {
          if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
          if (payload.trackingNo) {
            fullTask.payload = { ...fullTask.payload, trackingNo: payload.trackingNo };
            await updateDoc(doc(db, getCollectionPath('todos'), taskId), { 'payload.trackingNo': payload.trackingNo });
          }
          await claimService.markArrived(fullTask, currentUid, currentName);
        }
      }
    } catch (error) {
      console.error(`Error performing ${action} on task ${taskId}:`, error);
      const errMsg = error.message || '';

      if (errMsg.includes('ไม่พบออเดอร์') || errMsg.includes('ไม่พบข้อมูล') || errMsg.includes('not found')) {
        setDialogConfig({
          isOpen: true,
          title: '⚠️ เกิดข้อผิดพลาด: ออเดอร์หลักอาจถูกลบไปแล้ว',
          message: `รหัสงาน: ${taskId.slice(-6).toUpperCase()}\n\nต้องการลบงานค้างนี้ทิ้งถาวรหรือไม่?`,
          type: 'warning',
          onConfirm: async () => {
            setDialogConfig(prev => ({ ...prev, isOpen: false }));
            try {
              await deleteDoc(doc(db, getCollectionPath('todos'), taskId));
              toast.success('🗑️ ลบงานที่ค้างออกจากระบบเรียบร้อยแล้ว');
            } catch (deleteError) {
              toast.error(`ลบงานไม่สำเร็จ: ${deleteError.message}`);
            }
          },
          onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
        });
      } else {
        toast.error(`ทำรายการไม่สำเร็จ: ${errMsg}`);
      }
    } finally {
      setProcessingId(null);
    }
  }, [todos, activeTodos, updateTodoStatus]);

  return {
    processingId,
    dialogConfig,
    setDialogConfig,
    handleAction
  };
};
