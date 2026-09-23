import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import TemplateSettingsModal from './TemplateSettingsModal';
import SkuMerchantExport from './daily-tasks/SkuMerchantExport';
import InventoryCountExport from './daily-tasks/InventoryCountExport';
import ShopeeTemplateUpload from './non-daily-tasks/ShopeeTemplateUpload';
import GuidePanel from '../../../components/common/GuidePanel';

export default function GenerateActions({ changes, isCalculating, onManualReset, latestSnapshot }) {
  const [showSettings, setShowSettings] = useState(false);

  const isUpToDate = Boolean(
    changes &&
    changes.increased?.length === 0 &&
    changes.decreased?.length === 0 &&
    changes.priceChanged?.length === 0 &&
    (!changes.otherChanged || changes.otherChanged?.length === 0)
  );

  const hasSnapshot = Boolean(latestSnapshot && latestSnapshot.transactionId);
  const hasPendingActivity = Boolean(
    (Array.isArray(changes?.decreased) && changes.decreased.length > 0) ||
    (Array.isArray(changes?.increased) && changes.increased.length > 0) ||
    (Array.isArray(changes?.priceChanged) && changes.priceChanged.length > 0) ||
    (Array.isArray(changes?.otherChanged) && changes.otherChanged.length > 0)
  );

  const isAllSku = Boolean(latestSnapshot?.isAllSkuMode);

  let badgeText = '';
  let badgeClass = '';
  if (hasSnapshot) {
    if (isAllSku) {
      badgeText = `[ALL SKU ทั้งหมด] เตรียมข้อมูลส่งออก พร้อมแล้ว (อ้างอิง: ${latestSnapshot.transactionId})`;
      badgeClass = 'bg-indigo-50 border border-indigo-200 text-indigo-700';
    } else if (hasPendingActivity) {
      badgeText = `(รอบตรวจนับประจำวัน [DET] บันทึกเดิม (มียอดสต็อกใหม่อยู่ระหว่างดำเนินการ อ้างอิง: ${latestSnapshot.transactionId})`;
      badgeClass = 'bg-amber-50 border border-amber-200 text-amber-700';
    } else {
      badgeText = `[รอบตรวจจับประจำวัน DET] เตรียมข้อมูลส่งออก พร้อมแล้ว (อ้างอิง: ${latestSnapshot.transactionId})`;
      badgeClass = 'bg-emerald-50 border border-emerald-200 text-emerald-700';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 w-full relative overflow-hidden group">
      
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
        
        {hasSnapshot ? (
            <div data-testid="snapshot-badge" className={`flex items-center gap-1.5 px-3 py-1 mb-6 ${badgeClass} text-xs font-bold rounded-full shadow-xs animate-in zoom-in duration-300`}>
                <CheckCircle size={14} /> {badgeText}
            </div>
        ) : isUpToDate ? (
            <div className="flex items-center gap-1.5 px-3 py-1 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full shadow-xs animate-in zoom-in duration-300">
                <CheckCircle size={14} /> เตรียมข้อมูลส่งออก พร้อมแล้ว
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
            <SkuMerchantExport 
              changes={isAllSku ? latestSnapshot.changes : (isUpToDate && latestSnapshot ? latestSnapshot.changes : changes)} 
              isCalculating={isCalculating} 
            />
            <InventoryCountExport 
              changes={isAllSku ? latestSnapshot.changes : (isUpToDate && latestSnapshot ? latestSnapshot.changes : changes)} 
              isCalculating={isCalculating} 
              onManualReset={onManualReset} 
            />
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
            currentInventory={isAllSku ? latestSnapshot.currentInventory : changes?.currentInventory} 
            isCalculating={isCalculating} 
          />
        </div>

        {/* Guide Panel */}
        <div className="w-full mt-6 relative z-10 text-left">
          <GuidePanel 
            title="การอัปเดตสต็อก Big Seller (งานประจำวัน)"
            description="ส่วนนี้คือหน้าสำหรับโหลดไฟล์ไปเข้า Big Seller เพื่อปรับตัวเลขสต็อกในระบบออนไลน์ให้ตรงกับความจริงมากที่สุด (หรือที่เรียกว่าการทำ Inventory Count)"
            howTo={[
              "กดปุ่ม 'โหลด SKU ที่มีความเคลื่อนไหว' ระบบจะเลือกเฉพาะของที่ขายออกไป (ลดการใช้เวลาและโควต้า Firebase)",
              "นำไฟล์ที่ได้ไปเข้า Big Seller เมนู Inventory > นับสต็อก (Import Merchant SKU)",
              "รอจนนับเสร็จ แล้วกลับมากดปุ่ม 'โหลด ผลลัพธ์การนับ'",
              "นำไฟล์ที่ 2 ไปเข้า Big Seller เพื่อจบการนับสต็อก (Confirm Count)"
            ]}
            tips={[
              "ระบบนี้ดึงข้อมูลจาก GAS (Google Apps Script) เป็นหลัก จึงกินโควต้า Firebase เป็น 0 Reads ปลอดภัยแม้มีจำนวนสินค้าเยอะ",
              "หากคุณต้องการเปลี่ยนราคาด้วย สามารถใช้กล่อง 'งานอื่นๆ' แล้วโยนไฟล์ Shopee ลงไปได้เลย"
            ]}
            expectedResult="สต็อกใน Big Seller จะอัปเดตตรงกับระบบหลังบ้าน โดยไม่ต้องไปนั่งไล่พิมพ์แก้ทีละตัว"
          />
        </div>

      </div>
    </div>
  );
}
