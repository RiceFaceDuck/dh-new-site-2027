import React, { useState } from 'react';

const BarcodeScanner = ({ isActive, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');

  if (!isActive) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-5 text-white">
        <h2 className="text-xl font-bold">สแกนบาร์โค้ดสินค้า</h2>
        <button 
          onClick={onClose}
          className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Placeholder Scanner View */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative w-64 h-64 border-2 border-indigo-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.4)]">
          {/* Scanning animation line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-[scan_2s_ease-in-out_infinite]"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-300 gap-3">
             <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             <p className="text-sm font-medium">รอการเชื่อมต่อกล้อง...</p>
          </div>
        </div>
        
        <p className="text-gray-400 text-sm mt-8 text-center max-w-xs">
          (ระบบสแกนด้วยกล้องเตรียมพร้อมสำหรับเชื่อมต่อ Library ในอนาคต)
        </p>
      </div>

      {/* Manual Entry Fallback */}
      <div className="bg-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide text-center">หรือกรอกรหัสด้วยตัวเอง</p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="SKU หรือ Barcode"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 uppercase"
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors active:scale-95 flex items-center justify-center"
          >
            ค้นหา
          </button>
        </form>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(256px); }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
