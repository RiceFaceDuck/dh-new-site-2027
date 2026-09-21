import { useState, useEffect } from 'react';
import { Wrench, ArrowLeftRight, Printer, X } from 'lucide-react';
import { auth } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';
import { useClaimMutations } from '../../hooks/useClaimMutations';

import CustomerInfo from './CustomerInfo';
import ProductInfo from './ProductInfo';
import ImageGallery from './ImageGallery';
import ModalFooter from './ModalFooter';
import ClaimStepper from './ClaimStepper';
import PremiumDialog from '../../../../components/common/PremiumDialog';
import GuidePanel from '../../../../components/common/GuidePanel';

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
  const [warrantyConfig, setWarrantyConfig] = useState(null);

  // Freebie penalty states
  const [freebieReturned, setFreebieReturned] = useState(true);
  const [freebiePenaltyAmount, setFreebiePenaltyAmount] = useState(0);

  useEffect(() => {
    if (selectedRequest) {
      setTrackingNo(selectedRequest.payload?.trackingNo || '');
      setFreebieReturned(true);
      setFreebiePenaltyAmount(0);
      
      // Load warranty settings
      import('../../../../firebase/warrantyService').then(({ warrantyService }) => {
        warrantyService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);
      }).catch(console.error);
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
  } = useClaimMutations(selectedRequest, setSelectedRequest, userProfile, handleClose);

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
            message: 'คุณยังไม่ได้ระบุเลขพัสดุสำหรับคืนสินค้า (กรอกเลขพัสดุด้านล่าง หรือหากไม่มีให้เว้นว่างเพื่อข้าม)',
            type: 'warning',
            requireInput: true,
            allowEmptyInput: true,
            inputPlaceholder: 'ระบุเลขพัสดุคืนสินค้า (ถ้ามี)...',
            actionFn: (inputTracking) => {
              const finalTracking = typeof inputTracking === 'string' && inputTracking.trim() ? inputTracking.trim() : trackingNo;
              if (typeof inputTracking === 'string' && inputTracking.trim()) {
                setTrackingNo(inputTracking.trim());
              }
              return handleApprove(finalTracking);
            }
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

    if (isReturn) {
      confirmAction({
        title: 'เสร็จสิ้นกระบวนการ (คืนเงิน)',
        message: 'ระบบจะทำการ "คืนเงิน" และ "เพิ่มสต๊อก" ทันที ยืนยันใช่หรือไม่?',
        type: 'success',
        actionFn: () => handleComplete({ freebieReturned, freebiePenaltyAmount })
      });
    } else {
      confirmAction({
        title: 'เสร็จสิ้นกระบวนการ (ส่งเปลี่ยนสินค้า)',
        message: 'ระบบจะทำการ "ตัดสต๊อกสินค้าใหม่" เพื่อมอบให้ลูกค้า กรุณาระบุเลขพัสดุสำหรับส่งของเปลี่ยน (ถ้ามี)',
        type: 'success',
        requireInput: true,
        inputPlaceholder: 'เลขพัสดุ...',
        actionFn: (returnTrackingNo) => handleComplete({ returnTrackingNo: returnTrackingNo || 'รับที่ร้าน' })
      });
    }
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
    <div className={`fixed inset-0 z-100 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-dh-base w-full max-w-4xl rounded-2xl shadow-dh-elevated overflow-hidden flex flex-col max-h-[90vh] transition-transform duration-200 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-dh-surface border-b border-dh-border flex justify-between items-center shrink-0 shadow-xs z-10 relative">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'bg-linear-to-br from-orange-100 to-orange-50 text-orange-600 border border-orange-200 dark:from-orange-900/40 dark:to-orange-900/10 dark:border-orange-800' : 'bg-linear-to-br from-purple-100 to-purple-50 text-purple-600 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/10 dark:border-purple-800'}`}>
              {(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? <Wrench className="w-4.5 h-4.5"/> : <ArrowLeftRight className="w-4.5 h-4.5"/>}
            </div>
            <div>
              <h2 className="text-[16px] font-black text-dh-main tracking-wide">
                รายละเอียด{(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'การแจ้งเคลม/ซ่อม' : 'การคืนสินค้า'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-dh-muted bg-dh-base px-2 py-0.5 rounded-sm border border-dh-border shadow-inner">Ref: {selectedRequest.payload?.claimId || selectedRequest.payload?.returnId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2.5 bg-dh-surface hover:bg-dh-base border border-dh-border text-dh-main rounded-xl shadow-xs hover:shadow-sm transition-all active:scale-95 group"><Printer className="w-4 h-4 group-hover:text-dh-accent transition-colors" /></button>
            <button onClick={handleClose} className="p-2.5 text-dh-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative bg-linear-to-b from-transparent to-dh-surface/30">
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
              warrantyConfig={warrantyConfig}
            />
          </div>
          
          <ImageGallery images={selectedRequest.payload.images} />
          
          {/* GuidePanel In-App Documentation */}
          <div className="mt-6 border-t border-dh-border pt-4">
            <GuidePanel 
              title="ระบบเคลมเปลี่ยนรุ่นสินค้า (Swap SKU)"
              description="ระบบช่วยสลับสินค้าเป็นสินค้าอื่น (Swap SKU) พร้อมคิดราคาของใหม่และคืนเงินของเก่าเข้า Wallet อัตโนมัติ"
              howTo={[
                "ตรวจสอบอาการเสียและระยะรับประกันของสินค้าเดิมที่แสดงผลบนหน้าจอ",
                "กดอนุมัติ (Approve) ➡️ พนักงานหน้าร้านกดได้รับของเสีย (Mark Arrived) สต๊อกของเสียเดิมจะเพิ่มเข้าระบบคลัง",
                "กดเสร็จสิ้นกระบวนการ (Complete) ➡️ ระบบจะดึงเงินสินค้าเดิมคืนเข้า Wallet และหักเงินสินค้าใหม่จาก Wallet ลูกค้า เพื่อสร้างบิลใบเสร็จการขายใหม่รันเลขต่อเนื่องอัตโนมัติ"
              ]}
              tips={[
                "กรณีสินค้าต่างประเภทกัน ระบบจะแจ้งเตือนความเข้ากันไม่ได้ของของแถม แนะนำให้ตรวจสอบกับลูกค้าและระบุค่าปรับ (Penalty) เพื่อหักเงินคืนหากลูกค้าไม่ได้คืนของแถม",
                "วันหมดอายุประกันของสินค้าตัวใหม่สามารถตั้งค่าขยายหรือปรับเปลี่ยนได้อิสระ โดยมีค่าเริ่มต้นตามระยะเวลาประกันที่เหลือของตัวเดิม"
              ]}
              expectedResult="ยอดเงินสะสมในกระเป๋า Wallet ของลูกค้าจะมีการทำธุรกรรม 2 รายการ (REFUND และ SPEND) และ Order บิลขายใหม่จะรันเลขต่อเนื่องกับ POS เพื่อบันทึกประวัติการรับประกันอย่างถูกต้อง"
            />
          </div>
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
