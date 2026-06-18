import React from 'react';
import { Navigation } from 'lucide-react';

const MessengerRadar = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in duration-300 py-6">
      <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-30"></div>
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center z-10 shadow-lg border border-white">
          <Navigation size={26} className="text-emerald-600 animate-pulse drop-shadow-sm" />
        </div>
      </div>
      <div>
        <p className="text-sm font-black text-slate-700 uppercase">กำลังสแกนหาพิกัด...</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">ระบบกำลังคำนวณระยะทาง</p>
      </div>
    </div>
  );
};

export default MessengerRadar;
