import React, { useState, useEffect, useRef } from 'react';
import { useClaimDetailData } from './useClaimDetailData';
import { useClaimMutations } from './useClaimMutations';
import { driveService } from '../../../firebase/driveService';

export function useClaimDetailController(
  selectedRequest, 
  setSelectedRequest, 
  handlePrint, 
  initialCustomerProfile = null, 
  initialWarrantyConfig = null
) {
  const [trackingNo, setTrackingNo] = useState('');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
  const [freebieReturned, setFreebieReturned] = useState(true);
  const [freebiePenaltyAmount, setFreebiePenaltyAmount] = useState(0);
  const timerRef = useRef(null);

  const {
    customerProfile,
    itemProduct,
    swapProduct,
    warrantyConfig,
    userProfile,
    isManager
  } = useClaimDetailData(selectedRequest, initialCustomerProfile, initialWarrantyConfig);

  useEffect(() => {
    if (selectedRequest) {
      setTrackingNo(selectedRequest.payload?.trackingNo || '');
      setFreebieReturned(true);
      setFreebiePenaltyAmount(0);
    }
  }, [selectedRequest]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
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
    setIsApproveModalOpen(true);
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
    const isExchange = selectedRequest.type === 'EXCHANGE_APPROVAL' || selectedRequest.originalType === 'EXCHANGE_APPROVAL' || selectedRequest.payload?.isSwapSku;
    const qty = Number(selectedRequest?.payload?.qty || 1);

    if (isReturn && selectedRequest.payload?.hasFreebies && !freebieReturned && freebiePenaltyAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินค่าปรับของแถม หรือกดยืนยันว่าได้รับของแถมคืนแล้ว');
      return;
    }

    const currentSku = selectedRequest?.payload?.sku || 'สินค้า';
    const swapSku = selectedRequest?.payload?.swapSku || '';
    const sellableStock = Number(itemProduct?.stockQuantity ?? itemProduct?.quantity ?? 0);
    const defectStock = Number(itemProduct?.defectQuantity ?? 0);
    const swapSellableStock = Number(swapProduct?.stockQuantity ?? swapProduct?.quantity ?? 0);

    const completionOptions = [
      {
        id: 'defective',
        label: '🔴 สินค้าเสีย (ชำรุด / ขายไม่ได้)',
        description: (
          <div className="flex flex-col gap-1.5 mt-1 text-xs">
            <div className="bg-rose-50/80 dark:bg-rose-950/40 p-1.5 rounded-sm border border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-200">
              • สต๊อกขายปกติ <span className="font-mono font-bold text-rose-700 dark:text-rose-300">[{currentSku}]</span>: จาก <b>{sellableStock}</b> ➡️ <span className="font-black text-rose-600 dark:text-rose-400">{sellableStock} ชิ้น (+0)</span> (ไม่เพิ่มคลังขาย)
            </div>
            <div className="text-slate-600 dark:text-slate-300 px-1">
              • คลังสินค้าชำรุด: <b>{defectStock} ชิ้น</b> (สะสม +{qty} ชิ้น)
            </div>
            {isExchange && swapSku && (
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded-sm border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                • ตัดสต๊อกของใหม่ <span className="font-mono font-bold">[{swapSku}]</span>: จาก <b>{swapSellableStock}</b> ➡️ <span className="font-black text-blue-600 dark:text-blue-400">{Math.max(0, swapSellableStock - qty)} ชิ้น (-{qty})</span>
              </div>
            )}
          </div>
        ),
        badge: 'แนะนำกรณีของเสีย',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-black'
      },
      {
        id: 'good',
        label: '🟢 สินค้าดี (สภาพปกติ / ขายต่อได้)',
        description: (
          <div className="flex flex-col gap-1.5 mt-1 text-xs">
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-1.5 rounded-sm border border-emerald-200 dark:border-emerald-900/40 text-slate-700 dark:text-slate-200">
              • สต๊อกขายปกติ <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">[{currentSku}]</span>: จาก <b>{sellableStock}</b> จะเป็น <span className="font-black text-emerald-600 dark:text-emerald-400">{sellableStock + qty} ชิ้น (+{qty} ทันที)</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 px-1">
              • คลังสินค้าชำรุด: จาก <b>{defectStock}</b> ➡️ <span className="font-black text-blue-600 dark:text-blue-400">{Math.max(0, defectStock - qty)} ชิ้น (-{qty} ย้ายออก)</span>
            </div>
            {isExchange && swapSku && (
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded-sm border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                • ตัดสต๊อกของใหม่ <span className="font-mono font-bold">[{swapSku}]</span>: จาก <b>{swapSellableStock}</b> ➡️ <span className="font-black text-blue-600 dark:text-blue-400">{Math.max(0, swapSellableStock - qty)} ชิ้น (-{qty})</span>
              </div>
            )}
          </div>
        ),
        badge: 'นำกลับมาขายต่อได้',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-black'
      }
    ];

    if (isReturn) {
      confirmAction({
        title: 'เสร็จสิ้นกระบวนการ (คืนสินค้า & คืนเงิน)',
        message: 'กรุณาเลือกสภาพสินค้าที่ได้รับคืน ระบบจะโอนเงินคืนเข้า Wallet ลูกค้าและสิ้นสุดกระบวนการทันที (การคืนสินค้า จบในขั้นตอนนี้ ไม่ต้องส่งงานต่อฝ่ายจัดแพ็ค)',
        type: 'success',
        confirmText: 'ยืนยันเสร็จสิ้นกระบวนการ (คืนเงินเข้า Wallet)',
        options: completionOptions,
        defaultOption: 'defective',
        actionFn: async (result) => {
          const itemCondition = typeof result === 'string' ? result : (result?.selectedOption || 'defective');
          if (handlePrint) handlePrint();
          return handleComplete({ freebieReturned, freebiePenaltyAmount, itemCondition });
        }
      });
    } else {
      confirmAction({
        title: isExchange ? 'เสร็จสิ้นกระบวนการ (เปลี่ยนสินค้า)' : 'เสร็จสิ้นกระบวนการ (ส่งเปลี่ยนสินค้าเคลม)',
        message: 'กรุณาเลือกสภาพสินค้าเดิมที่ส่งคืน และระบุเลขพัสดุสำหรับส่งของเปลี่ยนให้ลูกค้า',
        type: 'success',
        confirmText: 'ยืนยัน และ print เพื่อส่งงานต่อไปยังจัดแพ็ค',
        requireInput: true,
        allowEmptyInput: false,
        inputLabel: '📦 กรอกเลขพัสดุ หรือ ข้อความอ้างอิงการส่งคืน',
        inputHelpText: '* หากส่งคืนให้ลูกค้าทางพัสดุ ให้ระบุเลขพัสดุ / หากลูกค้ารับที่หน้าร้าน ให้กดปุ่ม "🏢 รับที่หน้าร้าน"',
        quickPresets: ['🏢 รับที่หน้าร้าน', '🚚 Flash Express', '🚚 KEX (Kerry)', '🚚 ไปรษณีย์ไทย (EMS)'],
        inputPlaceholder: 'กรอกเลขพัสดุ หรือ ข้อความอ้างอิงการส่งคืน เช่น TH123456... หรือกดปุ่มรับที่หน้าร้าน',
        options: completionOptions,
        defaultOption: 'defective',
        actionFn: async (result) => {
          let returnTracking = '';
          let itemCondition = 'defective';
          if (typeof result === 'object' && result) {
            returnTracking = result.input?.trim() || '';
            itemCondition = result.selectedOption || 'defective';
          } else if (typeof result === 'string' && result.trim()) {
            returnTracking = result.trim();
          }

          if (!returnTracking) {
            alert('กรุณาระบุเลขพัสดุ หรือกดปุ่ม "🏢 รับที่หน้าร้าน" เพื่อดำเนินการต่อ');
            return;
          }

          if (handlePrint) handlePrint();
          return handleComplete({ returnTrackingNo: returnTracking, itemCondition });
        }
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

  const handleConfirmApprove = async ({ trackingNo: inboundTracking, paymentData, slipFile }, setStatusText) => {
    let uploadedSlipUrl = null;
    if (slipFile) {
      if (setStatusText) setStatusText('กำลังอัปโหลดสลิปไปยัง Google Drive...');
      try {
        uploadedSlipUrl = await driveService.uploadSlip(slipFile);
      } catch (err) {
        console.warn('⚠️ Upload slip to drive failed, fallback:', err);
      }
    }

    const finalPayment = paymentData ? {
      ...paymentData,
      slipUrl: uploadedSlipUrl || null
    } : null;

    if (inboundTracking) setTrackingNo(inboundTracking);
    await handleApprove(inboundTracking, finalPayment);
  };

  return {
    trackingNo,
    setTrackingNo,
    isClosing,
    dialogConfig,
    warrantyConfig,
    freebieReturned,
    setFreebieReturned,
    freebiePenaltyAmount,
    setFreebiePenaltyAmount,
    handleClose,
    isManager,
    isProcessing,
    onAskCancel,
    onAskApprove,
    onAskMarkArrived,
    onAskComplete,
    onAskReject,
    isApproveModalOpen,
    setIsApproveModalOpen,
    customerProfile,
    handleConfirmApprove
  };
}
