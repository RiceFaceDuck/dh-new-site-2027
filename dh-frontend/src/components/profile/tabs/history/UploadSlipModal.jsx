import React from 'react';
import { useUploadSlip } from './useUploadSlip';

const UploadSlipModal = ({ selectedOrder, closeModal }) => {
  const handleClose = () => {
    closeModal();
  };

  const {
    file,
    previewUrl,
    isUploading,
    uploadSuccess,
    errorMsg,
    handleFileChange,
    handleUploadSlip
  } = useUploadSlip(selectedOrder, handleClose);

  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={isUploading ? null : handleClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
        
        {!uploadSuccess ? (
          <>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                แจ้งหลักฐานการชำระเงิน
              </h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-5 mb-6 text-center shadow-inner">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-black text-indigo-700 mt-1">฿{selectedOrder.totals?.netTotal?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">ออเดอร์ #{selectedOrder.id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">อัปโหลดสลิปโอนเงิน (สลิปธนาคาร)</label>
              
              <label className={`mt-1 flex justify-center px-6 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${previewUrl ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/50'}`}>
                <div className="space-y-2 text-center w-full">
                  {previewUrl ? (
                    <div className="relative mx-auto h-40 w-28 rounded-xl overflow-hidden shadow-md border border-gray-200">
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">เปลี่ยนรูป</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white w-16 h-16 mx-auto rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                      <svg className="h-8 w-8 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <div className="flex justify-center text-sm text-gray-600 mt-3">
                    <span className="relative font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      <span>{previewUrl ? 'กดที่นี่เพื่อเปลี่ยนไฟล์สลิป' : 'คลิกเพื่อเลือกไฟล์สลิป'}</span>
                      <input type="file" className="sr-only" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} />
                    </span>
                  </div>
                  {!previewUrl && <p className="text-xs text-gray-500 font-medium">รองรับ PNG, JPG ไม่เกิน 5MB</p>}
                </div>
              </label>
              {errorMsg && (
                <div className="mt-3 bg-red-50 border border-red-100 p-2 rounded-lg text-xs text-red-600 font-semibold text-center flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {errorMsg}
                </div>
              )}
            </div>

            <button
              onClick={handleUploadSlip}
              disabled={isUploading || !file}
              className={`w-full py-4 px-4 rounded-xl text-white font-bold text-base transition-all flex items-center justify-center gap-2
                ${isUploading || !file ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]'}`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังส่งหลักฐานเข้าระบบ...
                </>
              ) : (
                <>
                  ยืนยันการโอนเงิน
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-10 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-5 shadow-inner">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">ส่งสลิปสำเร็จ!</h3>
            <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">ระบบได้รับหลักฐานของคุณแล้ว<br/>และได้ส่งเรื่องไปให้แอดมินตรวจสอบยอดเงินสักครู่ครับ</p>
            <div className="bg-blue-50 text-blue-700 text-sm py-2.5 px-4 rounded-xl border border-blue-100 inline-flex items-center gap-2 font-bold shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              สถานะเปลี่ยนเป็น: รอตรวจสอบสลิป
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSlipModal;
