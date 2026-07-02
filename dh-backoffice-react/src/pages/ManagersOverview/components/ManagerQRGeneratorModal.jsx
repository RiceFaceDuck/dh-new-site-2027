import React from 'react';
import { X, CalendarCheck } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function ManagerQRGeneratorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // We can make this dynamic with a timestamp to prevent QR code copying
  // But for now, a static station ID or today's date logic is fine.
  const qrData = JSON.stringify({
    type: 'ATTENDANCE_SCAN',
    stationId: 'MAIN_COUNTER',
    timestamp: new Date().getTime()
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CalendarCheck size={20} className="text-emerald-600" />
            เปิดจุดลงเวลาพนักงาน
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 rounded-full transition-colors border border-slate-200 shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center justify-center bg-slate-100/50 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-slate-200 transform transition-transform hover:scale-105">
            <QRCode value={qrData} size={220} fgColor="#0f172a" />
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-bold text-slate-800 text-lg">จุดแสกนเข้า-ออกงาน</h3>
            <p className="text-sm text-slate-500 font-medium">
              ให้พนักงานเปิดแอป Staff บนมือถือ<br/>แล้วใช้โหมดสแกน เพื่อลงเวลา
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
