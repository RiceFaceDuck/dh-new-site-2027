import React, { useState, useEffect } from 'react';
import { Wrench, ArrowLeftRight, Printer, X } from 'lucide-react';
import { auth } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';
import { useClaimActions } from '../../hooks/useClaimActions';

import CustomerInfo from './CustomerInfo';
import ProductInfo from './ProductInfo';
import ImageGallery from './ImageGallery';
import ModalFooter from './ModalFooter';
import ClaimStepper from './ClaimStepper';
import PremiumDialog from '../../../../components/common/PremiumDialog';

export default function ClaimDetailModal({ 
  selectedRequest, 
  setSelectedRequest, 
  handlePrint, 
  handleQuickCopy, 
  copiedText,
  getStatusDisplay
}) {
  const [trackingNo, setTrackingNo] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

  // Freebie penalty states
  const [freebieReturned, setFreebieReturned] = useState(true);
  const [freebiePenaltyAmount, setFreebiePenaltyAmount] = useState(0);

  useEffect(() => {
    if (selectedRequest) {
      setTrackingNo(selectedRequest.payload?.trackingNo || '');
      setFreebieReturned(true);
      setFreebiePenaltyAmount(0);
    }
  }, [selectedRequest]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedRequest(null);
      setIsClosing(false);
    }, 200);
  };

  const {
    isProcessing,
    handleRequestCancel,
    handleApprove,
    handleMarkArrived,
    handleComplete,
    handleReject
  } = useClaimActions(selectedRequest, setSelectedRequest, userProfile, handleClose);

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

  const confirmAction = (config) => {
    setDialogConfig({
      ...config,
      isOpen: true,
      onCancel: () => setDialogConfig({ isOpen: false }),
      onConfirm: async (val) => {
        setDialogConfig({ isOpen: false });
        if (config.actionFn) {
          await config.actionFn(val);
        }
      }
    });
  };

  const onAskCancel = () => {
    confirmAction({
      title: 'ยกเลิกคำร้อง',
      message: 'กรุณาระบุเหตุผลที่ต้องการยกเลิกคำร้องนี้',
      type: 'warning',
      requireInput: true,
      inputPlaceholder: 'เหตุผลการยกเลิก...',
      actionFn: handleRequestCancel
    });
  };

  const onAskApprove = () => {
    const isReturn = selectedRequest.type === 'RETURN_APPROVAL';
    if (isReturn && !trackingNo) {
        confirmAction({
            title: 'แจ้งเตือน',
            message: 'คุณยังไม่ได้ระบุเลขพัสดุสำหรับคืนสินค้า หากไม่มีให้ข้ามไป ยืนยันการดำเนินการหรือไม่?',
            type: 'warning',
            actionFn: () => handleApprove(trackingNo)
        });
        return;
    }
    confirmAction({
      title: 'อนุมัติคำร้อง',
      message: 'คุณต้องการอนุมัติคำร้องนี้ใช่หรือไม่? ระบบจะเปลี่ยนสถานะเป็น "รอรับของ"',
      type: 'prompt',
      actionFn: () => handleApprove(trackingNo)
    });
  };

  const onAskMarkArrived = () => {
    confirmAction({
      title: 'รับสินค้าเรียบร้อย',
      message: 'ยืนยันการรับสินค้าจากลูกค้า ระบบจะเปลี่ยนสถานะเป็น "กำลังตรวจสอบ"',
      type: 'prompt',
      actionFn: handleMarkArrived
    });
  };

  const onAskComplete = () => {
    const isReturn = selectedRequest.type === 'RETURN_APPROVAL';
    
    // Check if freebies were returned
    if (isReturn && selectedRequest.payload?.hasFreebies && !freebieReturned && freebiePenaltyAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินค่าปรับของแถม หรือกดยืนยันว่าได้รับของแถมคืนแล้ว');
      return;
    }

    confirmAction({
      title: 'เสร็จสิ้นกระบวนการ',
      message: isReturn 
        ? 'ระบบจะทำการ "คืนเงิน" และ "เพิ่มสต๊อก" ทันที ยืนยันใช่หรือไม่?'
        : 'ระบบจะทำการ "ตัดสต๊อกสินค้าใหม่" เพื่อมอบให้ลูกค้า ยืนยันใช่หรือไม่?',
      type: 'success',
      actionFn: () => handleComplete({ freebieReturned, freebiePenaltyAmount })
    });
  };

  const onAskReject = () => {
    confirmAction({
      title: 'ไม่อนุมัติคำร้อง',
      message: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ',
      type: 'warning',
      requireInput: true,
      inputPlaceholder: 'เหตุผล...',
      actionFn: handleReject
    });
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
          <ClaimStepper status={selectedRequest.status} isCancel={selectedRequest.type.startsWith('CANCEL_')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mt-4">
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
              freebieReturned={freebieReturned}
              setFreebieReturned={setFreebieReturned}
              freebiePenaltyAmount={freebiePenaltyAmount}
              setFreebiePenaltyAmount={setFreebiePenaltyAmount}
            />
          </div>
          
          <ImageGallery images={selectedRequest.payload.images} />
        </div>

        <ModalFooter 
          selectedRequest={selectedRequest}
          isManager={isManager}
          isProcessing={isProcessing}
          handleRequestCancel={onAskCancel}
          handleApprove={onAskApprove}
          handleMarkArrived={onAskMarkArrived}
          handleComplete={onAskComplete}
          handleReject={onAskReject}
          setSelectedRequest={handleClose}
        />

      </div>
      
      <PremiumDialog {...dialogConfig} />
    </div>
  );
}
