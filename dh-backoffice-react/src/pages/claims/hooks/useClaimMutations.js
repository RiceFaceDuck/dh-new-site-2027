import { useState } from 'react';
import { claimService } from '../../../firebase/claimService';
import { auth } from '../../../firebase/config';

export function useClaimMutations(selectedRequest, setSelectedRequest, userProfile, handleClose) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeAction = async (actionFn) => {
    setIsProcessing(true);
    try {
      await actionFn();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('claim_badge_refresh'));
      }
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
        if (setSelectedRequest) setSelectedRequest(null);
        handleClose();
    }
  };

  const handleApprove = async (trackingNo, paymentData = null) => {
    const updatedPayload = {
      ...selectedRequest.payload,
      trackingNo
    };
    if (paymentData) {
      updatedPayload.differencePayment = paymentData;
      updatedPayload.isDifferencePaid = !!(paymentData.isDirectPaid || paymentData.useWallet);
      updatedPayload.differenceSlipUrl = paymentData.slipUrl || null;
      updatedPayload.differenceWalletAmount = paymentData.walletAmount || 0;
      updatedPayload.differenceDirectAmount = paymentData.directAmount || 0;
      updatedPayload.differencePaidAt = paymentData.confirmedAt || new Date().toISOString();
    }
    const taskToApprove = {
      ...selectedRequest,
      payload: updatedPayload
    };
    const userName = userProfile?.firstName || 'Manager';
    
    const success = await executeAction(
      () => claimService.approveRequest(taskToApprove, auth.currentUser.uid, userName)
    );
    if (success) {
      if (setSelectedRequest) setSelectedRequest(null);
      handleClose();
    }
    return success;
  };

  const handleMarkArrived = async () => {
    const userName = userProfile?.firstName || 'Manager';
    const success = await executeAction(
      () => claimService.markArrived(selectedRequest, auth.currentUser.uid, userName)
    );
    if (success) {
      if (setSelectedRequest) setSelectedRequest(null);
      handleClose();
    }
    return success;
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
    if (success) {
      if (setSelectedRequest) setSelectedRequest(null);
      handleClose();
    }
    return success;
  };

  const handleReject = async (reason) => {
    if (!reason) return;
    const userName = userProfile?.firstName || 'Manager';
    const success = await executeAction(
      () => claimService.rejectRequest(selectedRequest, reason, auth.currentUser.uid, userName)
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
