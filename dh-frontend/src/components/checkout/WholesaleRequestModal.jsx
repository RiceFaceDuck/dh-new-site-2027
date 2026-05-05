import React, { useState, useEffect } from 'react';

const WholesaleRequestModal = ({ isOpen, onClose, onSubmit, companyName }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset ค่าทุกครั้งที่เปิด Modal ใหม่
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ตัวเลือกเหตุผลด่วน เพื่อความสะดวกของ User (UX Enhancement)
  const quickTags = [
    "ร้านซ่อมคอมพิวเตอร์",
    "ตัวแทนจำหน่าย",
    "สั่งซื้อจำนวนมาก",
    "จัดซื้อสำหรับบริษัท/องค์กร",
    "นำไปประกอบเครื่องขาย"
  ];

  const handleTagClick = (tag) => {
    if (reason.includes(tag)) return; // ไม่ให้กดซ้ำ
    const newReason = reason ? `${reason}, ${tag}` : tag;
    setReason(newReason);
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError('กรุณาระบุเหตุผลสั้นๆ อย่างน้อย 5 ตัวอักษร เพื่อให้เจ้าหน้าที่พิจารณาได้อย่างรวดเร็ว');
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">ขอพิจารณาราคาส่ง (B2B)</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              สำหรับร้านค้า ช่างซ่อม หรือการสั่งซื้อจำนวนมาก
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {companyName && (
            <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3 text-sm">
              <span className="text-gray-500 font-medium">ชื่อร้าน/บริษัท:</span>
              <span className="text-gray-900 font-semibold">{companyName}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="wholesale-reason" className="block text-sm font-semibold text-gray-900 mb-2">
                เหตุผลในการขอราคาส่ง <span className="text-red-500">*</span>
              </label>
              
              <textarea
                id="wholesale-reason"
                rows="4"
                className={`w-full rounded-xl border ${error ? 'border-red-300 ring-1 ring-red-300 bg-red-50' : 'border-gray-300 bg-white'} px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none shadow-sm`}
                placeholder="อธิบายเหตุผลสั้นๆ เช่น เปิดร้านซ่อมคอมพิวเตอร์, รับไปจำหน่ายต่อ, หรือสั่งใช้ในสำนักงาน..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
              ></textarea>
              
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  {error}
                </p>
              )}
            </div>

            {/* Quick Tags Section */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">ตัวเลือกด่วน (คลิกเพื่อเติมข้อความ):</p>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors active:scale-95"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mt-4 text-xs text-yellow-800 flex gap-2 items-start">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
              <p>เมื่อกดส่งคำขอแล้ว ออเดอร์ของคุณจะถูกส่งให้ผู้จัดการพิจารณาส่วนลด กรุณารอการอัปเดตสถานะในหน้าประวัติคำสั่งซื้อ</p>
            </div>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            ยืนยันส่งคำขอ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WholesaleRequestModal;