import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Settings, Clock, RefreshCw } from 'lucide-react';

export default function ChangeSummaryPanel({ changes, onManualReset }) {
  const [showSettings, setShowSettings] = useState(false);
  const [timeInput, setTimeInput] = useState(localStorage.getItem('bigseller_reset_time') || '00:00');

  if (!changes) return null;

  const { increased, decreased, priceChanged, lastResetDate } = changes;

  const handleSaveTime = () => {
    localStorage.setItem('bigseller_reset_time', timeInput);
    setShowSettings(false);
    if (onManualReset) onManualReset(); // force recalculate effective date
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left relative z-10">
      <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-100">
        <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">รายการที่เปลี่ยนแปลงวันนี้</h4>
        
        <div className="relative flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full cursor-help" title="เวลารอบปัจจุบัน (Baseline)">
            เริ่มนับ: {lastResetDate}
          </span>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="ตั้งค่ารอบเวลา"
          >
            <Settings size={16} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95">
              <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                ตั้งค่ารอบเวลา Reset
              </h5>
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-xs font-medium text-slate-500">เวลาตัดรอบของแต่ละวัน (ชั่วโมง:นาที)</label>
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={handleSaveTime}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    if (onManualReset) onManualReset();
                  }}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm transition-colors"
                >
                  <RefreshCw size={14} />
                  Reset การนับใหม่ทันที
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 1. สต็อกเพิ่ม */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl overflow-hidden">
        <div className="bg-emerald-100/50 px-4 py-2 flex items-center justify-between text-emerald-800 font-bold text-sm border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} /> สต็อกเพิ่มขึ้น
          </div>
          <span className="bg-emerald-200/50 px-2 py-0.5 rounded-full text-xs">{increased.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {increased.length === 0 ? (
            <div className="text-center text-xs text-emerald-600/60 py-2 font-medium">ไม่มีรายการสต็อกเพิ่มขึ้น</div>
          ) : (
            increased.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-emerald-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">{item.oldStock}</span>
                  <span className="text-emerald-600 font-black">→ {item.newStock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. สต็อกลด */}
      <div className="bg-rose-50 border border-rose-100 rounded-xl overflow-hidden">
        <div className="bg-rose-100/50 px-4 py-2 flex items-center justify-between text-rose-800 font-bold text-sm border-b border-rose-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} /> สต็อกลดลง
          </div>
          <span className="bg-rose-200/50 px-2 py-0.5 rounded-full text-xs">{decreased.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {decreased.length === 0 ? (
            <div className="text-center text-xs text-rose-600/60 py-2 font-medium">ไม่มีรายการสต็อกลดลง (ขายออก)</div>
          ) : (
            decreased.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-rose-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">{item.oldStock}</span>
                  <span className="text-rose-600 font-black">→ {item.newStock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. ราคาเปลี่ยน */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl overflow-hidden">
        <div className="bg-amber-100/50 px-4 py-2 flex items-center justify-between text-amber-800 font-bold text-sm border-b border-amber-100">
          <div className="flex items-center gap-2">
            <DollarSign size={16} /> ราคาเปลี่ยนแปลง
          </div>
          <span className="bg-amber-200/50 px-2 py-0.5 rounded-full text-xs">{priceChanged.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {priceChanged.length === 0 ? (
            <div className="text-center text-xs text-amber-600/60 py-2 font-medium">ไม่มีการปรับเปลี่ยนราคาสินค้า</div>
          ) : (
            priceChanged.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-amber-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">฿{item.oldPrice}</span>
                  <span className="text-amber-600 font-black">→ ฿{item.newPrice}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
