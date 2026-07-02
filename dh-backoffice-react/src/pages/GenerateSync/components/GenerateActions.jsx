import React, { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import TemplateSettingsModal from './TemplateSettingsModal';
import SkuMerchantExport from './daily-tasks/SkuMerchantExport';
import InventoryCountExport from './daily-tasks/InventoryCountExport';
import ShopeeTemplateUpload from './non-daily-tasks/ShopeeTemplateUpload';

export default function GenerateActions({ changes, isCalculating, onManualReset, latestSnapshot }) {
  const [showSettings, setShowSettings] = useState(false);

  // ถ้ารายการทั้งหมดเป็น 0 แปลว่าไม่มีข้อมูลค้าง และถูกบันทึก/ส่งออกหมดแล้ว
  const isUpToDate = changes &&
    changes.increased?.length === 0 &&
    changes.decreased?.length === 0 &&
    changes.priceChanged?.length === 0 &&
    (!changes.otherChanged || changes.otherChanged?.length === 0);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 w-full relative overflow-hidden group">
      
      {/* Settings Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all z-20"
        title="ตั้งค่าไฟล์แม่แบบ (Templates)"
      >
        <Settings size={20} />
      </button>

      <TemplateSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Animated Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">
            อัปเดตสต็อก Big Seller
        </h3>
        
        {isUpToDate ? (
            <div className="flex items-center gap-1.5 px-3 py-1 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full shadow-sm animate-in zoom-in duration-300">
                <CheckCircle size={14} /> เตรียมข้อมูลส่งออก พร้อมแล้ว {latestSnapshot ? `(อ้างอิง: ${latestSnapshot.transactionId})` : ''}
            </div>
        ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                เครื่องมือช่วยจัดการไฟล์สำหรับระบบ Big Seller เพื่อความรวดเร็วและแม่นยำ
            </p>
        )}

        {/* --- งานประจำวัน --- */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">งานประจำวัน (นับสต็อก)</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="flex flex-col gap-4">
            <SkuMerchantExport changes={changes} isCalculating={isCalculating} />
            <InventoryCountExport changes={changes} isCalculating={isCalculating} onManualReset={onManualReset} />
          </div>
        </div>

        {/* --- งานแก้ไขข้อมูล --- */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">งานอื่นๆ (อัปเดตราคา/สต็อก)</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <ShopeeTemplateUpload 
            currentInventory={changes?.currentInventory} 
            isCalculating={isCalculating} 
          />
        </div>

      </div>
    </div>
  );
}
