import React, { useState, useEffect, useCallback } from 'react';
import GenerateActions from './components/GenerateActions';
import ChangeSummaryPanel from './components/ChangeSummaryPanel';
import UploadTransactions from './components/UploadTransactions';
import GuideModal from '../../components/common/GuideModal';
import { HelpCircle, RefreshCw, Clock } from 'lucide-react';
import { bigSellerExportService } from '../../firebase/bigSellerExportService';
import { gasStockService } from '../../firebase/gasStockService';

export default function GenerateSync() {
  const [showGuide, setShowGuide] = useState(false);
  const [changes, setChanges] = useState(null);
  const [isCalculating, setIsCalculating] = useState(true);

  // New states for auto-sync and status
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(localStorage.getItem('bigseller_autosync') === 'true');
  const [syncInterval, setSyncInterval] = useState(Number(localStorage.getItem('bigseller_sync_interval')) || 15);
  const [pendingCount, setPendingCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);

  // Listen to gasStockService queue
  useEffect(() => {
    const unsubscribe = gasStockService.subscribe((count, flushing) => {
      setPendingCount(count);
      setIsFlushing(flushing);
    });
    setPendingCount(gasStockService.getPendingCount());
    return unsubscribe;
  }, []);

  // Fetch changes
  const fetchChanges = useCallback(async () => {
    setIsCalculating(true);
    try {
      const result = await bigSellerExportService.calculateChanges();
      setChanges(result);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to calculate changes", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Auto refresh interval
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const intervalId = setInterval(() => {
      fetchChanges();
    }, syncInterval * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, syncInterval, fetchChanges]);

  const handleManualReset = useCallback(async () => {
    setIsCalculating(true);
    try {
      const result = await bigSellerExportService.manualResetBaseline();
      setChanges(result);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to reset baseline", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="dh-header-gradient p-4 sm:p-6 relative z-10 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none">
              ระบบจัดการและซิงค์ข้อมูลภายนอก
            </h1>
            <p className="text-[12px] text-slate-300 mt-1.5 font-bold uppercase tracking-wider hidden sm:block">
              ดาวน์โหลดเพื่ออัปเดตสต็อก หรือนำเข้าไฟล์เพื่อตัดสต็อก
            </p>
         </div>
         <button 
           onClick={() => setShowGuide(true)} 
           className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-bold border border-white/20 shadow-sm"
         >
           <HelpCircle size={18} />
           คู่มือใช้งาน
         </button>
      </div>

      {/* Auto Sync & Status Bar */}
      <div className="w-full px-4 sm:px-6 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4">
        
        {/* Status indicator */}
        <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2" title="รายการที่รออัปเดตไปยังระบบภายนอก (Google Sheet)">
             <div className={`w-2.5 h-2.5 rounded-full ${isFlushing ? 'bg-amber-400 animate-ping' : pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
             <span className="text-sm font-bold text-slate-700">
               {pendingCount > 0 ? `รออัปเดต ${pendingCount} รายการ` : 'ข้อมูลอัปเดตครบถ้วน'}
             </span>
           </div>
           <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
           <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
             <Clock size={14} />
             <span>ซิงค์ล่าสุด: {lastSyncTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
           </div>
           
           <button 
             onClick={fetchChanges} 
             disabled={isCalculating} 
             className="ml-auto p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors disabled:opacity-50"
             title="โหลดข้อมูลใหม่"
           >
             <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
           </button>
        </div>

        {/* Auto Sync Settings */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
           <label className="flex items-center gap-2 cursor-pointer">
             <div className="relative">
               <input type="checkbox" className="sr-only" checked={autoSyncEnabled} onChange={(e) => {
                 setAutoSyncEnabled(e.target.checked);
                 localStorage.setItem('bigseller_autosync', e.target.checked);
               }} />
               <div className={`block w-10 h-6 rounded-full transition-colors ${autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
               <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoSyncEnabled ? 'transform translate-x-4' : ''}`}></div>
             </div>
             <span className="text-sm font-bold text-slate-700 select-none">Auto Refresh</span>
           </label>

           {autoSyncEnabled && (
             <div className="flex items-center border-l border-slate-200 pl-3">
               <select 
                 value={syncInterval} 
                 onChange={(e) => {
                   setSyncInterval(Number(e.target.value));
                   localStorage.setItem('bigseller_sync_interval', e.target.value);
                 }}
                 className="text-sm border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold"
               >
                 <option value={1}>ทุก 1 นาที</option>
                 <option value={5}>ทุก 5 นาที</option>
                 <option value={15}>ทุก 15 นาที</option>
                 <option value={30}>ทุก 30 นาที</option>
                 <option value={60}>ทุก 1 ชั่วโมง</option>
               </select>
             </div>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto w-full">
        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-start pb-6">
            
            {/* Left Column: Actions */}
            <div className="flex flex-col gap-4">
              <GenerateActions 
                  changes={changes} 
                  setChanges={setChanges} 
                  isCalculating={isCalculating} 
              />
              <UploadTransactions onUploadComplete={fetchChanges} />
            </div>

            {/* Right Column: Changes Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden flex flex-col min-h-[500px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              {!isCalculating && changes && (
                  <ChangeSummaryPanel changes={changes} onManualReset={handleManualReset} />
              )}
              {isCalculating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                      <p className="text-sm font-medium">กำลังเปรียบเทียบข้อมูลล่าสุด...</p>
                  </div>
              )}
            </div>

        </div>
      </div>

      {/* Guide Documentation */}
      <GuideModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)}
        title="คู่มือการดาวน์โหลดและอัปโหลดข้อมูล"
        manualText="ระบบนี้ช่วยให้คุณสามารถนำข้อมูลจำนวนสต็อกไปใช้กับระบบภายนอก หรือรับข้อมูลการขายจากแหล่งภายนอกมาตัดสต็อกได้อย่างแม่นยำ"
        howTo={[
          "การดาวน์โหลด: กดปุ่ม 'ดาวน์โหลดไฟล์ CSV' รอจนกว่าระบบสร้างไฟล์เสร็จ นำไฟล์ที่ได้ไปใช้กับ Big Seller (เมนู Import Merchant SKU)",
          "การอัปโหลด: เลือกไฟล์ Excel หรือ CSV ที่ได้จากระบบอื่น นำมาลากวางลงในแผง 'อัปโหลดข้อมูลธุรกรรม'",
          "หน้าต่างพรีวิวจะแสดงรายการสินค้า เลือกโหมด 'หักสต็อก' (สำหรับการขาย) หรือ 'เพิ่มสต็อก' (สำหรับการรับของ)",
          "กดยืนยัน ระบบจะทำรายการทั้งหมดให้เสร็จสิ้นและบันทึกประวัติให้คุณอัตโนมัติ"
        ]}
        tips="ในหน้าอัปโหลด ระบบจะอ่านคอลัมน์อัตโนมัติ ให้มั่นใจว่าในไฟล์มีคอลัมน์ที่ตั้งชื่อมีคำว่า SKU, จำนวน, หรือ ราคา เพื่อให้ระบบทำงานได้"
        expectedResult="เมื่ออัปโหลดและหักสต็อกเสร็จ แผงสรุปความเปลี่ยนแปลงด้านขวามือ จะแสดงให้คุณเห็นว่ามีรายการไหนถูกหักไปบ้างแบบเรียลไทม์"
      />
    </div>
  );
}
