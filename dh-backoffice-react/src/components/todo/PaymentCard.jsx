import React, { useState } from 'react';
import { todoService } from '../../firebase/todoService';
import { db } from '../../firebase/config';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

const PaymentCard = ({ task, currentUser, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!task) return null;

  // 1. ฟังก์ชัน: อนุมัติสลิปถูกต้อง
  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // เรียกใช้ฟังก์ชัน Transaction ที่เราเขียนเตรียมไว้แล้วใน todoService
      await todoService.verifyPaymentSlip(task.id, task.orderId, currentUser);
      if (onSuccess) onSuccess(); // แจ้ง UI ภายนอกให้รีเฟรชหรือลบการ์ดทิ้ง
    } catch (error) {
      console.error("Approve Slip Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาดในการยืนยันสลิป');
      setIsSubmitting(false);
    }
  };

  // 2. ฟังก์ชัน: ปฏิเสธสลิป (กรณีสลิปปลอม, ยอดไม่ตรง, ภาพเบลอ)
  const handleReject = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้? \nออเดอร์จะถูกส่งกลับไปให้ลูกค้าชำระเงินและอัปโหลดหลักฐานใหม่')) return;
     
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const batch = writeBatch(db);
      
      // 2.1 ตีกลับสถานะ Order หน้าเว็บเป็น รอชำระเงินเหมือนเดิม และล้างลิงก์สลิปเก่าทิ้ง
      const orderRef = doc(db, 'orders', task.orderId);
      batch.update(orderRef, {
        status: 'pending_payment',
        paymentSlipUrl: null,
        updatedAt: serverTimestamp()
      });

      // 2.2 ปิดงาน (To-do) นี้ทิ้งในฐานะ rejected
      const taskRef = doc(db, 'todos', task.id);
      batch.update(taskRef, {
        status: 'rejected',
        completedAt: serverTimestamp(),
        actionBy: currentUser?.displayName || 'Admin'
      });

      // 2.3 ส่ง History Log ไปแจ้งเตือนลูกค้าหน้าบ้าน
      const historyRef = doc(collection(db, `users/${task.userId}/historyLogs`));
      batch.set(historyRef, {
        orderId: task.orderId,
        action: "SLIP_REJECTED",
        title: "หลักฐานการชำระเงินไม่ถูกต้อง",
        description: `เจ้าหน้าที่ตรวจสอบสลิปของออเดอร์ #${task.orderId.slice(-6).toUpperCase()} แล้วพบว่าไม่ถูกต้อง/ไม่ชัดเจน กรุณาอัปโหลดหลักฐานใหม่ครับ`,
        amount: task.amount || 0,
        createdAt: serverTimestamp()
      });

      // ยิงข้อมูลทั้งหมด
      await batch.commit();
      if (onSuccess) onSuccess(); // ลบการ์ดออกจากหน้าจอ

    } catch(err) {
      console.error("Reject Error", err);
      setErrorMsg('เกิดข้อผิดพลาดในการปฏิเสธสลิป');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-5 hover:shadow-md transition-shadow relative">
      <div className="flex flex-col sm:flex-row">
        
        {/* ---------------- ฝั่งซ้าย: ข้อมูลออเดอร์และยอดเงิน ---------------- */}
        <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Verify Payment
              </span>
              <span className="text-xs text-gray-400 font-medium">{task.requestedAt?.toDate().toLocaleString() || 'N/A'}</span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">ออเดอร์ #{task.orderId?.slice(-8).toUpperCase()}</h3>
            <p className="text-sm text-gray-600 mb-5 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              <span className="font-semibold text-gray-700">ลูกค้า:</span> {task.customerName}
            </p>
          </div>
          
          {/* กล่องโชว์ยอดเงินขนาดใหญ่ (เพื่อให้บัญชีดูง่ายๆ) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl p-4 border border-blue-100/50 inline-block shadow-inner mt-auto">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
               ยอดที่ต้องตรวจสอบ
            </p>
            <p className="text-3xl font-black text-blue-700 tracking-tight">฿{task.amount?.toLocaleString()}</p>
          </div>
        </div>

        {/* ---------------- ฝั่งขวา: รูปสลิปและปุ่มอนุมัติ ---------------- */}
        <div className="p-5 sm:w-72 flex flex-col items-center justify-between bg-gray-50/50">
           
           {/* ภาพตัวอย่างสลิป (คลิกเพื่อขยายได้) */}
           <div 
             onClick={() => { if (task.slipUrl) setIsImageModalOpen(true); }}
             className={`w-full h-40 bg-white rounded-xl border-2 ${task.slipUrl ? 'border-blue-200 border-dashed cursor-pointer group hover:border-blue-400' : 'border-gray-200'} overflow-hidden relative mb-5 shadow-sm transition-colors`}
           >
             {task.slipUrl ? (
               <>
                 <img src={task.slipUrl} alt="Slip" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-blue-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                   <svg className="w-8 h-8 text-white drop-shadow-md mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                   <span className="text-white text-xs font-bold bg-black/30 px-2.5 py-1 rounded">คลิกเพื่อขยายเต็มจอ</span>
                 </div>
               </>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                 <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                 <span className="text-xs font-medium">ไม่พบรูปภาพสลิป</span>
               </div>
             )}
           </div>

           {/* ปุ่ม Action */}
           <div className="w-full space-y-2.5">
             {errorMsg && <p className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 text-center font-medium leading-tight mb-2">❌ {errorMsg}</p>}
             
             <button
               onClick={handleApprove}
               disabled={isSubmitting || !task.slipUrl}
               className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
             >
               {isSubmitting ? (
                 <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังประมวลผล...
                 </>
               ) : (
                 <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  ยอดเงินถูกต้อง (อนุมัติ)
                 </>
               )}
             </button>
             
             <button
               onClick={handleReject}
               disabled={isSubmitting}
               className="w-full py-2.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
             >
               ปฏิเสธ / สลิปไม่ชัดเจน
             </button>
           </div>
        </div>
      </div>

      {/* 🔍 หน้าต่างขยายรูปภาพสลิปเต็มจอ (Fullscreen Image Modal) */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm transition-opacity"
          onClick={() => setIsImageModalOpen(false)} // กดพื้นที่ว่างเพื่อปิด
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