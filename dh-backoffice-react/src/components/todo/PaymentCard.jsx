import React, { useState, useEffect } from 'react';
import { todoService } from '../../firebase/todoService';
import { creditCoreService } from '../../firebase/creditCoreService';
import { db } from '../../firebase/config';
import { gasHistoryService } from '../../firebase/gasHistoryService';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const PaymentCard = ({ task, currentUser, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!task?.orderId) return;
        const snap = await getDoc(doc(db, 'orders', task.orderId));
        if (snap.exists()) setOrderData(snap.data());
      } catch (err) {
        console.error("Error fetching order data for slip:", err);
      }
    };
    fetchOrder();
  }, [task?.orderId]);

  if (!task) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await todoService.verifyPaymentSlip(task.id, task.orderId, currentUser);
      try {
        await creditCoreService.handlePaymentCompletion(task.orderId, task.userId);
      } catch (creditError) {
        console.error("Failed to update credit points:", creditError);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Approve Slip Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาดในการยืนยันสลิป');
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้? \nออเดอร์จะถูกส่งกลับไปให้ลูกค้าชำระเงินและอัปโหลดหลักฐานใหม่')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', task.orderId);
      batch.update(orderRef, {
        status: 'pending_payment',
        paymentSlipUrl: null,
        updatedAt: serverTimestamp()
      });
      const taskRef = doc(db, 'todos', task.id);
      batch.update(taskRef, {
        status: 'rejected',
        completedAt: serverTimestamp(),
        actionBy: currentUser?.displayName || 'Admin'
      });
      gasHistoryService.log({
        module: 'Customer History',
        action: 'SLIP_REJECTED',
        target: { id: task.orderId },
        details: { legacy_details: `หลักฐานการชำระเงินไม่ถูกต้อง เจ้าหน้าที่ตรวจสอบสลิปของออเดอร์ #${task.orderId?.slice(-6).toUpperCase()} แล้วพบว่าไม่ถูกต้อง/ไม่ชัดเจน กรุณาอัปโหลดหลักฐานใหม่ครับ` },
        actorOverride: { uid: task.userId, name: 'System (For Customer)', email: 'N/A' }
      });
      await batch.commit();
      if (onSuccess) onSuccess();
    } catch(err) {
      console.error("Reject Error", err);
      setErrorMsg('เกิดข้อผิดพลาดในการปฏิเสธสลิป');
      setIsSubmitting(false);
    }
  };

  const displayAmount = task.amount > 0 ? task.amount : (orderData?.totals?.grandTotal ?? orderData?.totals?.netTotal ?? 0);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white rounded-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border-2 border-gray-200 hover:border-blue-400 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] transition-all overflow-hidden relative mb-4 cursor-pointer ${isSubmitting ? 'opacity-75 pointer-events-none' : ''}`}
    >
      
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center p-3 sm:p-4 gap-4">
        
        {/* 1. Slip Image Thumbnail */}
        <div 
          onClick={(e) => { e.stopPropagation(); if (task.slipUrl) setIsImageModalOpen(true); }}
          className={`w-16 h-20 shrink-0 rounded-md border-2 ${task.slipUrl ? 'border-blue-200 border-dashed cursor-pointer hover:border-blue-400' : 'border-gray-200'} bg-gray-50 flex items-center justify-center relative overflow-hidden group shadow-inner`}
          title={task.slipUrl ? "คลิกเพื่อดูรูปขยาย" : "ไม่มีสลิป"}
        >
          {task.slipUrl ? (
            <>
              <img src={task.slipUrl} alt="slip" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
              </div>
            </>
          ) : (
            <span className="text-[10px] text-gray-400 text-center leading-tight">No<br/>Slip</span>
          )}
        </div>

        {/* 2. Order Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Verify Payment
            </span>
            <span className="text-[11px] text-gray-400 font-medium">{task.requestedAt?.toDate().toLocaleString() || 'N/A'}</span>
          </div>
          
          <h3 className="text-base font-black text-gray-900 truncate mb-0.5">ออเดอร์ #{task.orderId?.slice(-8).toUpperCase()}</h3>
          <p className="text-xs text-gray-600 truncate">
            ลูกค้า: <span className="font-semibold text-gray-800">{task.customerName}</span>
          </p>
          {errorMsg && <p className="text-[10px] text-red-600 font-medium mt-1 truncate bg-red-50 px-2 py-0.5 rounded-sm inline-block">❌ {errorMsg}</p>}
        </div>

        {/* 3. Amount */}
        <div className="flex flex-col items-start sm:items-end sm:border-l-2 border-gray-100 sm:pl-5 shrink-0 w-full sm:w-auto">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold">ยอดโอนที่ต้องตรวจสอบ</p>
          <p className="text-2xl font-black text-blue-700 leading-none mb-1">฿{displayAmount.toLocaleString()}</p>
          {!isExpanded && (
             <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} 
                className="text-[10px] text-blue-500 hover:text-blue-700 underline flex items-center gap-1 font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
             >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                ดูรายละเอียด
             </button>
          )}
        </div>

        {/* 4. Actions */}
        <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-32 sm:pl-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleApprove(); }}
            disabled={isSubmitting || !task.slipUrl}
            className="flex-1 sm:w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            อนุมัติ
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleReject(); }}
            disabled={isSubmitting}
            className="flex-1 sm:w-full py-2 bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-gray-600 font-bold rounded-lg transition-colors flex items-center justify-center text-xs disabled:opacity-50"
          >
            ปฏิเสธ
          </button>
        </div>
      </div>

      {/* ---------------- Inline Expanded Details ---------------- */}
      {isExpanded && orderData && (
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 animate-in fade-in slide-in-from-top-1 cursor-default" onClick={(e) => e.stopPropagation()}>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
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
           </div>
        </div>
      )}

      {/* ---------------- Modal แสดงรูปขยาย ---------------- */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm transition-opacity"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={task.slipUrl} 
              alt="Slip Fullscreen" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
            />
            <p className="text-white/60 text-sm mt-4">คลิกที่พื้นที่ว่าง หรือกดปุ่มกากบาทเพื่อปิด</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;