import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Check, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { todoService } from '../../firebase/todoService';
import { todoActionService } from '../../firebase/todo/todoActionService';
import { creditCoreService } from '../../firebase/creditCoreService';
import { billingQueryService } from '../../firebase/billingQueryService';
import { billingStatusTransaction } from '../../firebase/billingStatusTransaction';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import PremiumDialog from '../common/PremiumDialog';
import toast from 'react-hot-toast';
import { getRenderableImageUrl, handleImageError } from 'dh-shared';

const PaymentCard = ({ task, currentUser, onSuccess, urgencyLevel }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [isOrderMissing, setIsOrderMissing] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        if (!task?.orderId) {
          if (isMounted) setIsOrderMissing(true);
          return;
        }
        let data = await billingQueryService.getOrderById(task.orderId);
        if (!data) {
          try {
            data = await billingQueryService.getOrderByOrderId(task.orderId);
          } catch (_) {}
        }
        if (isMounted) {
          if (data) {
            setOrderData(data);
            setIsOrderMissing(false);
          } else {
            setIsOrderMissing(true);
          }
        }
      } catch (err) {
        console.error("Error fetching order data for slip:", err);
        if (isMounted) setIsOrderMissing(true);
      }
    };
    fetchOrder();
    return () => { isMounted = false; };
  }, [task?.orderId]);

  if (!task) return null;

  const isOrderPaid = orderData?.status === 'paid' || orderData?.orderStatus === 'paid' || orderData?.paymentStatus === 'VERIFIED';

  const handleGoToTask = async () => {
    setIsSubmitting(true);
    try {
      if (task.orderId && currentUser?.uid) {
        const staffName = currentUser.displayName || 'พนักงาน';
        if (!orderData?.staffNickname && !orderData?.openedBy) {
          await billingStatusTransaction.assignStaffHandler(task.orderId, currentUser.uid, staffName);
        }
        try {
          const taskRef = doc(db, getCollectionPath('todos'), task.id);
          await updateDoc(taskRef, {
            status: 'in_progress',
            staffUid: currentUser.uid,
            staffNickname: staffName,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Could not update todo to in_progress:", e);
        }
      }
      toast.success('กำลังนำไปยังหน้าบิลเพื่อจัดการงาน...');
      navigate('/billing', { state: { orderId: task.orderId, selectOrder: true } });
    } catch (err) {
      console.error("Error going to task:", err);
      toast.error('ไม่สามารถเปิดหน้าบิลได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCleanOrphanedTask = () => {
    setDialogConfig({
      isOpen: true,
      title: '🗑️ เคลียร์งานค้าง',
      message: `ไม่พบข้อมูลออเดอร์ #${task.orderId?.slice(-8).toUpperCase()} ในระบบ (อาจถูกลบหรือดำเนินการเสร็จสิ้นไปแล้ว)\n\nต้องการลบงานค้างนี้ออกจากระบบหรือไม่?`,
      type: 'warning',
      requireInput: false,
      onConfirm: async () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);
        try {
          await todoActionService.deleteTask(task.id);
          toast.success('ลบงานค้างออกจากระบบเรียบร้อยแล้ว');
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error('ลบงานไม่สำเร็จ: ' + err.message);
          setIsSubmitting(false);
        }
      },
      onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleCloseCompletedTask = async () => {
    setIsSubmitting(true);
    try {
      await todoActionService.completeTask(task.id);
      toast.success('ปิดงานที่เสร็จสิ้นแล้วเรียบร้อย');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('ปิดงานไม่สำเร็จ: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setDialogConfig({
      isOpen: true,
      title: '⚠️ ปฏิเสธสลิป',
      message: 'ระบุเหตุผลที่ปฏิเสธสลิปนี้ (เพื่อให้ลูกค้าทราบและแก้ไข):',
      type: 'warning',
      requireInput: true,
      allowEmptyInput: false,
      inputPlaceholder: 'ระบุเหตุผล...',
      onConfirm: async (rejectReason) => {
        if (typeof rejectReason !== 'string' || rejectReason.trim() === '') {
           toast.error('กรุณาระบุเหตุผลการปฏิเสธอย่างชัดเจน เพื่อแจ้งให้ลูกค้าทราบ');
           return;
        }

        // Show second confirmation dialog
        setDialogConfig({
          isOpen: true,
          title: 'ยืนยันการปฏิเสธสลิป',
          message: `ยืนยันการปฏิเสธสลิปด้วยเหตุผล:\n"${rejectReason}"\n\nออเดอร์จะถูกตีกลับไปให้ลูกค้าแก้ไขและอัปโหลดหลักฐานใหม่`,
          type: 'warning',
          requireInput: false,
          onConfirm: async () => {
             setDialogConfig(prev => ({ ...prev, isOpen: false }));
             setIsSubmitting(true);
             setErrorMsg('');
             try {
               await todoService.rejectPaymentSlip(task, rejectReason, currentUser);
               if (onSuccess) onSuccess();
             } catch(err) {
               console.error("Reject Error", err);
               setErrorMsg('เกิดข้อผิดพลาดในการปฏิเสธสลิป');
               setIsSubmitting(false);
             }
          },
          onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
        });
      },
      onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const displayAmount = task.amount > 0 ? task.amount : (orderData?.totals?.grandTotal ?? orderData?.totals?.netTotal ?? 0);

  const getUrgencyStyles = (level) => {
    switch (level) {
      case 'high': 
        return 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5';
      case 'medium': 
        return 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5';
      default: 
        return 'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-200/80 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5';
    }
  };

  return (
    <div 
      className={`rounded-[0.2rem] transition-all duration-200 overflow-hidden relative flex flex-col h-full ${getUrgencyStyles(urgencyLevel)} ${isSubmitting ? 'opacity-75 pointer-events-none' : ''}`}
    >
      
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-10 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3.5">
        {/* 1. Header: Badge + Order ID + Staff / Status + Timestamp */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-[0.2rem] shadow-xs uppercase tracking-wider flex items-center gap-1 shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Verify Payment
            </span>
            <span className="text-xs font-black text-gray-800 truncate">#{task.orderId?.slice(-8).toUpperCase()}</span>
            
            {/* ป้ายแสดงผู้รับผิดชอบงานจริง */}
            {(orderData?.staffNickname || task.staffNickname) ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-[0.2rem] flex items-center gap-1 shrink-0">
                <UserCheck size={11} className="text-emerald-600" /> รับงานแล้ว: คุณ{orderData?.staffNickname || task.staffNickname}
              </span>
            ) : isOrderMissing ? (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] flex items-center gap-1 shrink-0">
                <AlertCircle size={11} /> ไม่พบออเดอร์
              </span>
            ) : isOrderPaid ? (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-[0.2rem] flex items-center gap-1 shrink-0">
                <Check size={11} strokeWidth={3} /> ชำระเงินแล้ว
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0">
                รอรับงาน
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-medium shrink-0">
            {task.requestedAt?.toDate ? task.requestedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (task.requestedAt ? new Date(task.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
          </span>
        </div>

        {/* 2. Body: Slip Thumbnail + Order Details & Amount */}
        <div className="flex items-start gap-3.5">
          {/* Slip Image Thumbnail */}
          <div 
            onClick={(e) => { e.stopPropagation(); if (task.slipUrl) setIsImageModalOpen(true); }}
            className={`w-16 h-22 shrink-0 rounded-[0.2rem] border-2 ${task.slipUrl ? 'border-blue-200 border-dashed cursor-pointer hover:border-blue-400 shadow-xs' : 'border-gray-200'} bg-gray-50 flex items-center justify-center relative overflow-hidden group shadow-inner transition-colors`}
            title={task.slipUrl ? "คลิกเพื่อดูรูปขยาย" : "ไม่มีสลิป"}
          >
            {task.slipUrl ? (
              <>
                <img 
                  src={getRenderableImageUrl(task.slipUrl)} 
                  alt="slip" 
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, task.slipUrl)}
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                </div>
              </>
            ) : (
              <span className="text-[10px] text-gray-400 text-center leading-tight">No<br/>Slip</span>
            )}
          </div>

          {/* Details & Amount */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
            <div>
              <p className="text-xs text-gray-600 truncate">
                ลูกค้า: <span className="font-semibold text-gray-900">{task.customerName || 'ไม่ระบุชื่อ'}</span>
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">ยอดโอนที่ต้องตรวจสอบ</span>
                <span className="text-2xl font-black text-blue-700 tracking-tight leading-none block mt-0.5">฿{displayAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              {!isExpanded && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} 
                  className="text-[11px] text-blue-600 hover:text-blue-800 underline flex items-center gap-1 font-semibold bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded-[0.2rem] transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  ดูรายละเอียด
                </button>
              )}
              {errorMsg && <p className="text-[10px] text-red-600 font-medium truncate bg-red-50 px-2 py-0.5 rounded-xs">❌ {errorMsg}</p>}
            </div>
          </div>
        </div>

        {/* 3. Actions: ไปที่งาน และ ปฏิเสธ หรือ เคลียร์งานค้าง */}
        {isOrderMissing ? (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <span className="text-[11px] text-rose-600 font-medium truncate">⚠️ ออเดอร์ต้นทางไม่มีอยู่ในระบบแล้ว</span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCleanOrphanedTask(); }}
              disabled={isSubmitting}
              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-[0.2rem] transition-colors flex items-center gap-1 text-xs shrink-0 cursor-pointer"
            >
              <Trash2 size={13} /> ลบงานค้างนี้
            </button>
          </div>
        ) : isOrderPaid ? (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleGoToTask(); }}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[0.2rem] shadow-xs hover:shadow transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={14} /> ไปที่งาน
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleCloseCompletedTask(); }}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-[0.2rem] transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Check size={14} strokeWidth={3} /> ปิดงานนี้
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleGoToTask(); }}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[0.2rem] shadow-xs hover:shadow transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <ExternalLink size={14} /> ไปที่งาน
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleReject(); }}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold rounded-[0.2rem] transition-colors flex items-center justify-center text-xs disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              ปฏิเสธ
            </button>
          </div>
        )}
      </div>

      {/* ---------------- Inline Expanded Details ---------------- */}
      {isExpanded && orderData && (
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 animate-in fade-in slide-in-from-top-1 cursor-default" onClick={(e) => e.stopPropagation()}>
           <div className="bg-white p-4 rounded-[0.2rem] border border-slate-200 shadow-xs max-w-2xl mx-auto">
              <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                   ที่มาของยอดชำระสุทธิ
                 </div>
                 <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>ยอดรวมสินค้า:</span>
                  <span className="font-medium text-gray-800">฿{orderData.totals?.subtotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ค่าจัดส่ง:</span>
                  <span className="font-medium text-gray-800">฿{orderData.totals?.shipping?.toLocaleString() || 0}</span>
                </div>
                {orderData.calculationLog?.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>ส่วนลด ({orderData.calculationLog?.discountCode}):</span>
                    <span className="font-medium">-฿{orderData.calculationLog.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {orderData.calculationLog?.usedWallet > 0 && (
                  <div className="flex justify-between items-center text-purple-600">
                    <span>หักลบด้วยยอดเงิน Wallet:</span>
                    <span className="font-medium">-฿{orderData.calculationLog.usedWallet.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center sm:col-span-2 font-black text-gray-900 border-t border-slate-200 pt-2 mt-1 text-sm">
                  <span>ยอดชำระสุทธิ (ลูกค้าต้องโอนเท่านี้):</span>
                  <span className="text-blue-700">฿{displayAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* 📦 ส่วนแสดงรายการสินค้าเพิ่มเติม */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                 <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                   รายการสินค้าในออเดอร์
                 </h4>
                 <div className="bg-slate-50 border border-slate-100 rounded-[0.2rem] p-2 max-h-40 overflow-y-auto">
                    {orderData.items?.length > 0 ? orderData.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-start text-xs py-1.5 border-b border-slate-100 last:border-0">
                          <span className="text-slate-700 pr-2 flex-1">
                            {item.name} 
                            {item.isFreebie && <span className="text-emerald-500 font-bold ml-1 px-1.5 py-0.5 bg-emerald-100 rounded-xs text-[9px] uppercase">Free</span>}
                          </span>
                          <span className="text-slate-600 font-bold whitespace-nowrap bg-white px-1.5 py-0.5 rounded-[0.2rem] shadow-xs">x{item.qty}</span>
                       </div>
                    )) : <div className="text-xs text-gray-400 text-center py-2">ไม่มีข้อมูลสินค้า</div>}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ---------------- Modal แสดงรูปขยาย ---------------- */}
      {isImageModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xs transition-opacity"
          onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all cursor-pointer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={getRenderableImageUrl(task.slipUrl)} 
              alt="Slip Fullscreen" 
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, task.slipUrl)}
              className="max-w-full max-h-[85vh] object-contain rounded-[0.2rem] shadow-2xl border border-white/10" 
              loading="lazy" 
            />
            <p className="text-white/60 text-sm mt-4">คลิกที่พื้นที่ว่าง หรือกดปุ่มกากบาทเพื่อปิด</p>
          </div>
        </div>,
        document.body
      )}
      
      <PremiumDialog {...dialogConfig} />
    </div>
  );
};

export default React.memo(PaymentCard);