import React, { useState } from 'react';
import GenerateActions from './components/GenerateActions';
import ChangeSummaryPanel from './components/ChangeSummaryPanel';
import UploadTransactions from './components/UploadTransactions';
import GlobalSchemaSettings from './components/GlobalSchemaSettings';
import GuideModal from '../../components/common/GuideModal';
import GenerateSyncHeader from './components/GenerateSyncHeader';
import GenerateSyncStatusBar from './components/GenerateSyncStatusBar';
import useGenerateSync from './hooks/useGenerateSync';

export default function GenerateSync() {
  const [showGuide, setShowGuide] = useState(false);

  const {
    changes,
    isCalculating,
    lastSyncTime,
    autoSyncEnabled,
    updateAutoSync,
    syncInterval,
    updateSyncInterval,
    pendingCount,
    isFlushing,
    fetchChanges,
    handleManualReset
  } = useGenerateSync();

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 relative overflow-x-hidden">
      
      {/* Header */}
      <GenerateSyncHeader 
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* Auto Sync & Status Bar */}
      <GenerateSyncStatusBar
        isFlushing={isFlushing}
        pendingCount={pendingCount}
        lastSyncTime={lastSyncTime}
        isCalculating={isCalculating}
        fetchChanges={fetchChanges}
        autoSyncEnabled={autoSyncEnabled}
        updateAutoSync={updateAutoSync}
        syncInterval={syncInterval}
        updateSyncInterval={updateSyncInterval}
      />

      {/* Content */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto w-full">
        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-start pb-6">
            
            {/* Left Column: Actions */}
            <div className="flex flex-col gap-4">
              <GenerateActions 
                  changes={changes} 
                  isCalculating={isCalculating} 
                  onManualReset={handleManualReset}
              />
              <UploadTransactions onUploadComplete={fetchChanges} />
              <GlobalSchemaSettings />
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
        title="คู่มือการซิงค์สต็อก Big Seller / Shopee"
        manualText="ระบบนี้ช่วยให้คุณสามารถอัปเดตข้อมูลสต็อกรายวัน หรืออัปเดตข้อมูลสินค้าสำหรับ Shopee ได้อย่างรวดเร็วและปลอดภัย โดยไม่กระทบโครงสร้างไฟล์เดิม"
        howTo={[
          "งานประจำวัน: ระบบจะคำนวณ 'ส่วนต่าง' ของสต็อกให้อัตโนมัติ",
          "1. กดปุ่ม 'โหลด SKU ที่มีความเคลื่อนไหว' จะได้ไฟล์ .xlsx นำไปเข้า Big Seller เพื่อเริ่มนับสต็อก",
          "2. กดปุ่ม 'โหลด ผลลัพธ์การนับ' จะได้ไฟล์ .xlsx ที่มีจำนวนสต็อกอัปเดตแล้ว นำไปเข้า Big Seller เพื่อจบการนับ",
          "งานแก้ไขอื่นๆ: สำหรับการเปลี่ยนราคาหรือสต็อกผ่านไฟล์ Shopee",
          "1. ดาวน์โหลดไฟล์ shopee_edit_price_stock จาก Shopee",
          "2. ลากไฟล์นั้นมาวางในกล่อง 'นำเข้า templat (แก้ราคา/สต็อก)'",
          "3. ระบบจะจัดการเติมเลขสต็อกและราคาล่าสุดให้ และดาวน์โหลดกลับมาให้คุณอัตโนมัติ โดยคอลัมน์และช่องผสาน (Merged Cells) จะยังอยู่ครบเหมือนต้นฉบับ!"
        ]}
        tips="การดึงข้อมูลจะเกิดขึ้นบนระบบหลังบ้านโดยไม่เปลืองโควต้า Firebase (0 Reads) ส่วนการอัปเดตไฟล์ Excel จะประมวลผลบนเบราว์เซอร์ของคุณ ทำให้ปลอดภัยและประหยัดเวลามาก"
        expectedResult="คุณจะได้ไฟล์ .xlsx ที่พร้อมสำหรับการอัปโหลดเข้าสู่ Big Seller หรือ Shopee ได้ทันทีโดยไม่ต้องแก้ไขอะไรเพิ่มเติม ระบบจะบันทึกประวัติการทำงานของคุณไว้ใน History Log ทุกครั้ง"
      />
    </div>
  );
}
