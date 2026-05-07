import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import * as driveService from '../../firebase/driveService';

const TaxInvoiceCard = ({ task, currentUser, onSuccess }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ตรวจสอบว่ามีข้อมูล task และ taxInvoice หรือไม่
  if (!task || !task.payload?.taxInvoice) return null;

  const { taxInvoice, orderId } = task.payload;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // จำกัด 5MB
        setErrorMsg('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setErrorMsg('');
    }
  };

  const handleUploadTaxInvoice = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์ใบกำกับภาษี (PDF หรือรูปภาพ)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let fileUrl = '';
      
      // อัปโหลดไฟล์ผ่าน driveService
      try {
        const uploadFn = driveService.uploadFile || driveService.default;
        if (typeof uploadFn === 'function') {
          fileUrl = await uploadFn(file);
        } else {
             throw new Error("driveService.uploadFile is not a function");
        }
      } catch (uploadError) {
        console.error("Upload Tax Invoice Failed:", uploadError);
        throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      }

      if (!fileUrl) {
          throw new Error("ไม่ได้รับ URL หลังจากอัปโหลด");
      }

      const batch = writeBatch(db);

      // 1. อัปเดต Order: บันทึก URL ใบกำกับภาษี
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, {
        taxInvoiceUrl: fileUrl,
        taxInvoiceStatus: 'issued', // อัปเดตสถานะว่าออกให้แล้ว
        updatedAt: serverTimestamp()
      });

      // 2. ปิดงาน To-do นี้
      const taskRef = doc(db, 'todos', task.id);
      batch.update(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        actionBy: currentUser?.uid || 'Admin'
      });

      // 3. แจ้งเตือนลูกค้าผ่าน History Log
      if (task.userId) {
          const historyRef = doc(collection(db, `users/${task.userId}/historyLogs`));
          batch.set(historyRef, {
              orderId: orderId,
              action: "TAX_INVOICE_ISSUED",
              title: "ใบกำกับภาษีพร้อมดาวน์โหลด",
              description: `เจ้าหน้าที่ได้อัปโหลดใบกำกับภาษีสำหรับออเดอร์ #${orderId.slice(-6).toUpperCase()} เรียบร้อยแล้ว`,
              createdAt: serverTimestamp()
          });
      }
      
      // 4. บันทึก Log กลาง
      const logRef = doc(collection(db, 'system_logs'));
      batch.set(logRef, {
          actionType: 'TAX_INVOICE_ISSUED',
          orderId: orderId,
          taskId: task.id,
          details: `ออกใบกำกับภาษีและอัปโหลดไฟล์สำเร็จ`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
      });

      await batch.commit();

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Handle Upload Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all duration-300 hover:shadow-md">
      {/* 🔴 ส่วนหัว: ย่อ/ขยาย (Accordion Header) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-gradient-to-r from-teal-50/80 to-white border-b border-teal-100' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider shadow-sm transition-colors ${isExpanded ? 'bg-teal-600 text-white' : 'bg-gray-800 text-white'}`}>
              คำขอใบกำกับภาษี
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold truncate ${isExpanded ? 'text-teal-900' : 'text-gray-900'}`}>ออเดอร์ #{orderId?.slice(-8).toUpperCase()}</h3>
              <span className="text-sm font-medium text-gray-500 truncate hidden sm:inline-block">— {task.customerName || 'ลูกค้า'}</span>
            </div>
            {!isExpanded && (
              <p className="text-sm text-teal-600 truncate mt-1 flex items-center gap-1.5 font-medium bg-teal-50/50 px-2 py-0.5 rounded-md inline-flex">
                <span>📄</span> รอดำเนินการอัปโหลดเอกสาร
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
           <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">สร้างเมื่อ</p>
            <p className="text-xs font-semibold text-gray-600">{task.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
          </div>
          <div className={`p-1.5 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-teal-100 text-teal-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* 🔴 ส่วนเนื้อหา: ข้อมูลและอัปโหลด (Expanded Body) */}
      {isExpanded && (
        <div className="p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ฝั่งซ้าย: ข้อมูลที่ลูกค้ากรอกมา */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                รายละเอียดใบกำกับภาษี
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-500">ประเภท:</span>
                  <span className="col-span-2 font-medium">{taxInvoice.type === 'personal' ? 'บุคคลธรรมดา' : 'นิติบุคคล'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-500">ชื่อ/บริษัท:</span>
                  <span className="col-span-2 font-bold text-gray-900">{taxInvoice.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-500">เลขประจำตัว:</span>
                  <span className="col-span-2 font-mono text-teal-700">{taxInvoice.taxId}</span>
                </div>
                {taxInvoice.branch && (
                  <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                    <span className="font-semibold text-gray-500">สาขา:</span>
                    <span className="col-span-2">{taxInvoice.branch}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold text-gray-500">ที่อยู่:</span>
                  <span className="col-span-2">{taxInvoice.address} {taxInvoice.subdistrict} {taxInvoice.district} {taxInvoice.province} {taxInvoice.zipcode}</span>
                </div>
              </div>
            </div>

            {/* ฝั่งขวา: ส่วนอัปโหลดไฟล์ */}
            <div className="flex flex-col justify-between">
              <div>
                 <h4 className="font-bold text-teal-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  อัปโหลดเอกสาร (PDF / รูปภาพ)
                </h4>
                
                <label className={`mt-1 flex justify-center px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-teal-500 bg-teal-50/50' : 'border-gray-300 hover:border-teal-400 bg-gray-50 hover:bg-teal-50/30'}`}>
                    <div className="space-y-1 text-center w-full">
                      {file ? (
                        <div className="text-teal-700 flex flex-col items-center">
                           <svg className="w-10 h-10 mb-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                           <span className="font-semibold text-sm line-clamp-1">{file.name}</span>
                           <span className="text-xs text-teal-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="mt-2 text-sm font-bold text-teal-600">คลิกเพื่อเลือกไฟล์</span>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG ไม่เกิน 5MB</p>
                        </div>
                      )}
                      <input type="file" className="sr-only" accept=".pdf, image/jpeg, image/png, image/jpg" onChange={handleFileChange} disabled={isSubmitting} />
                    </div>
                </label>
                {errorMsg && <p className="mt-2 text-xs text-red-600 font-medium text-center">{errorMsg}</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                 <button
                  onClick={handleUploadTaxInvoice}
                  disabled={isSubmitting || !file}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${isSubmitting || !file ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-sm hover:shadow-md active:scale-[0.98]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      กำลังอัปโหลดและส่งให้ลูกค้า...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      ส่งเอกสารให้ลูกค้า
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoiceCard;