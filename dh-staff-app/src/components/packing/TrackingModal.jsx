import React from 'react';

const TrackingModal = ({ 
  selectedTask, 
  trackingNumber, 
  setTrackingNumber, 
  errorMsg, 
  setErrorMsg, 
  onClose, 
  onComplete, 
  processingId 
}) => {
  if (!selectedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-10 sm:pb-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900">ยืนยันการจัดส่ง</h3>
          <button 
            onClick={() => { onClose(); setErrorMsg(''); }} 
            className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">ส่งให้</p>
          <p className="font-bold text-gray-900 text-sm line-clamp-1">{selectedTask.customerName}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedTask.shippingAddress?.address}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">หมายเลขพัสดุ (Tracking Number)</label>
          <input 
            type="text" 
            value={trackingNumber}
            onChange={(e) => { setTrackingNumber(e.target.value); setErrorMsg(''); }}
            placeholder="เช่น TH0123456789"
            className="w-full text-lg font-bold text-center px-4 py-4 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
            autoFocus
          />
          {errorMsg && <p className="text-red-500 text-xs font-bold mt-2 text-center">{errorMsg}</p>}
        </div>

        <button 
          onClick={onComplete}
          disabled={processingId === selectedTask.id}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(22,163,74)] active:shadow-[0_0px_0_rgb(22,163,74)] active:translate-y-1 transition-all flex justify-center items-center gap-2"
        >
          {processingId === selectedTask.id ? (
            'กำลังบันทึกข้อมูล...'
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              บันทึก และแจ้งลูกค้า
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default TrackingModal;
