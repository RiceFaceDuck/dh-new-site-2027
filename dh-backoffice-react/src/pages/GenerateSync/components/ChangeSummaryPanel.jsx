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
            เริ่มนับ: {lastResetDate instanceof Date ? lastResetDate.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : String(lastResetDate)}
          </span>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="จัดการรอบการนับสต็อก"
          >
            <Settings size={16} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in zoom-in-95">
              <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <RefreshCw size={16} className="text-rose-500" />
                รีเซ็ตรอบการนับใหม่ (Manual Reset)
              </h5>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                การกดรีเซ็ตจะเป็นการนำ <strong className="text-slate-700">สต็อกปัจจุบันทั้งหมด</strong> ไปตั้งเป็นค่าเริ่มต้น (Baseline) ใหม่ 
                รายการความเปลี่ยนแปลงด้านล่างจะถูกลบและเริ่มนับใหม่ตั้งแต่ 0
              </p>
              
              <button 
                onClick={() => {
                  setShowSettings(false);
                  if (window.confirm("ยืนยันการตั้งค่าสต็อกปัจจุบันเป็นรอบการนับใหม่ทั้งหมด?")) {
                    if (onManualReset) onManualReset();
                  }
                }}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500 text-white hover:bg-rose-600 font-bold text-sm transition-colors shadow-sm"
              >
                ยืนยันการรีเซ็ตรอบใหม่
              </button>
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
      <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
        <div className="bg-blue-100/50 px-4 py-2 flex items-center justify-between text-blue-800 font-bold text-sm border-b border-blue-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} /> สต็อกลดลง
          </div>
          <span className="bg-blue-200/50 px-2 py-0.5 rounded-full text-xs">{decreased.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {decreased.length === 0 ? (
            <div className="text-center text-xs text-blue-600/60 py-2 font-medium">ไม่มีรายการสต็อกลดลง (ขายออก)</div>
          ) : (
            decreased.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-blue-100/30 rounded-lg">
                <div className="flex flex-col min-w-0 mr-2">
                  <span className="font-medium text-slate-700 truncate" title={item.name}>{item.sku}</span>
                  {item.reason && <span className="text-[10px] text-blue-500 font-medium truncate mt-0.5">{item.reason}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">{item.oldStock}</span>
                  <span className="text-blue-600 font-black">→ {item.newStock}</span>
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
