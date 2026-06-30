import { useState } from 'react';
import { claimService } from '../../../firebase/claimService';
import { auth } from '../../../firebase/config';

export function useClaimActions(selectedRequest, setSelectedRequest, userProfile, handleClose) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeAction = async (actionFn, successMsg) => {
    setIsProcessing(true);
    try {
      await actionFn();
      // Use a custom event or a nice toast if available, otherwise fallback
      // For now, we will return success to the caller to handle UI
      return true;
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestCancel = async (reason) => {
    if (!reason) return;
    const userName = userProfile ? `${userProfile.firstName} (${userProfile.nickname})` : auth.currentUser.email;
    const success = await executeAction(
      () => claimService.requestCancelTodo(selectedRequest, reason, auth.currentUser.uid, userName)
    );
    if (success) {
        alert('ส่งคำร้องขอยกเลิกไปยังผู้จัดการสำเร็จ\n\nสถานะจะเปลี่ยนเป็น "ยกเลิกสมบูรณ์" เมื่อผู้จัดการอนุมัติ (ระบบจะดึงสต๊อกกลับคืนให้อัตโนมัติ)');
        handleClose();
    }
  };

  const handleApprove = async (trackingNo) => {
    // Note: The warning for missing trackingNo is already handled by PremiumDialog in ClaimDetailModal.
    const taskToApprove = {
      ...selectedRequest,
      payload: { ...selectedRequest.payload, trackingNo }
    };
    const userName = userProfile?.firstName || 'Manager';
    
    const success = await executeAction(
      () => claimService.approveRequest(taskToApprove, auth.currentUser.uid, userName)
    );
    if (success) handleClose();
  };

  const handleMarkArrived = async () => {
    const userName = userProfile?.firstName || 'Manager';
    const success = await executeAction(
      () => claimService.markArrived(selectedRequest, auth.currentUser.uid, userName)
    );
    if (success) handleClose();
  };

  const handleComplete = async (options = {}) => {
    const userName = userProfile?.firstName || 'Manager';
    const taskToComplete = {
      ...selectedRequest,
      payload: { ...selectedRequest.payload, ...options }
    };
    const success = await executeAction(
      () => claimService.completeRequest(taskToComplete, auth.currentUser.uid, userName)
    );
    if (success) handleClose();
  };

  const handleReject = async (reason) => {
    if (!reason) return;
    const success = await executeAction(
      () => claimService.rejectRequest(selectedRequest, reason, auth.currentUser.uid)
    );
    if (success) handleClose();
  };

  return {
    isProcessing,
    handleRequestCancel,
    handleApprove,
    handleMarkArrived,
    handleComplete,
    handleReject
  };
}
