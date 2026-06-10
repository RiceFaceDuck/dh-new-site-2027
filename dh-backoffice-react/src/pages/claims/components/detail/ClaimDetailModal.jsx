import React, { useState, useEffect } from 'react';
import { Wrench, ArrowLeftRight, Printer, X } from 'lucide-react';
import { claimService } from '../../../../firebase/claimService';
import { auth } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';

import CustomerInfo from './CustomerInfo';
import ProductInfo from './ProductInfo';
import ImageGallery from './ImageGallery';
import ModalFooter from './ModalFooter';

export default function ClaimDetailModal({ 
  selectedRequest, 
  setSelectedRequest, 
  handlePrint, 
  handleQuickCopy, 
  copiedText
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [trackingNo, setTrackingNo] = useState(selectedRequest.payload?.trackingNo || '');
  const [userProfile, setUserProfile] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const profile = await userService.getUserProfile(auth.currentUser.uid);
        setUserProfile(profile);
      }
    };
    fetchProfile();
  }, []);

  const isManager = userProfile && ['Manager', 'Owner', 'manager', 'owner', 'admin', 'Admin', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'].includes(userProfile.role);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedRequest(null);
      setIsClosing(false);
    }, 200);
  };

  const handleRequestCancel = async () => {
    const reason = window.prompt('กรุณาระบุเหตุผลที่ต้องการขอยกเลิกรายการนี้:');
    if (!reason) return;
    
    setIsProcessing(true);
    try {
      const userName = userProfile ? `${userProfile.firstName} (${userProfile.nickname})` : auth.currentUser.email;
      await claimService.requestCancelTodo(selectedRequest, reason, auth.currentUser.uid, userName);
      alert('ส่งคำร้องขอยกเลิกไปยังผู้จัดการสำเร็จ\n\nสถานะจะเปลี่ยนเป็น "ยกเลิกสมบูรณ์" เมื่อผู้จัดการอนุมัติ (ระบบจะดึงสต๊อกกลับคืนให้อัตโนมัติ)');
      handleClose();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('คุณต้องการอนุมัติรายการนี้ใช่หรือไม่?')) return;
    
    const isReturn = selectedRequest.type === 'RETURN_APPROVAL';
    if (isReturn && !trackingNo) {
        if (!window.confirm('ยังไม่ได้ระบุเลขพัสดุสำหรับคืนสินค้า คุณต้องการดำเนินการต่อหรือไม่?')) return;
    }

    setIsProcessing(true);
    try {
      const taskToApprove = {
        ...selectedRequest,
        payload: {
          ...selectedRequest.payload,
          trackingNo: trackingNo 
        }
      };
      await claimService.approveRequest(taskToApprove, auth.currentUser.uid, userProfile?.firstName || 'Manager');
      alert('อนุมัติรายการเรียบร้อย');
      handleClose();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติ:');
    if (!reason) return;
    setIsProcessing(true);
    try {
      await claimService.rejectRequest(selectedRequest, reason, auth.currentUser.uid);
      alert('ปฏิเสธรายการเรียบร้อย');
      handleClose();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedRequest) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-[4px] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-dh-base w-full max-w-4xl rounded-2xl shadow-dh-elevated overflow-hidden flex flex-col max-h-[90vh] transition-transform duration-200 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-dh-surface border-b border-dh-border flex justify-between items-center shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 border border-orange-200 dark:from-orange-900/40 dark:to-orange-900/10 dark:border-orange-800' : 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/10 dark:border-purple-800'}`}>
              {(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? <Wrench className="w-4.5 h-4.5"/> : <ArrowLeftRight className="w-4.5 h-4.5"/>}
            </div>
            <div>
              <h2 className="text-[16px] font-black text-dh-main tracking-wide">
                รายละเอียด{(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'การแจ้งเคลม/ซ่อม' : 'การคืนสินค้า'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-dh-muted bg-dh-base px-2 py-0.5 rounded border border-dh-border shadow-inner">Ref: {selectedRequest.payload?.claimId || selectedRequest.payload?.returnId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2.5 bg-dh-surface hover:bg-dh-base border border-dh-border text-dh-main rounded-xl shadow-sm hover:shadow transition-all active:scale-95 group"><Printer className="w-4 h-4 group-hover:text-dh-accent transition-colors" /></button>
            <button onClick={handleClose} className="p-2.5 text-dh-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative bg-gradient-to-b from-transparent to-dh-surface/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            <CustomerInfo 
              selectedRequest={selectedRequest}
              copiedText={copiedText}
              handleQuickCopy={handleQuickCopy}
            />
            <ProductInfo 
              selectedRequest={selectedRequest}
              isManager={isManager}
              trackingNo={trackingNo}
              setTrackingNo={setTrackingNo}
              copiedText={copiedText}
              handleQuickCopy={handleQuickCopy}
            />
          </div>
          
          <ImageGallery images={selectedRequest.payload.images} />
        </div>

        <ModalFooter 
          selectedRequest={selectedRequest}
          isManager={isManager}
          isProcessing={isProcessing}
          handleRequestCancel={handleRequestCancel}
          handleApprove={handleApprove}
          handleReject={handleReject}
          setSelectedRequest={handleClose}
        />

      </div>
    </div>
  );
}
