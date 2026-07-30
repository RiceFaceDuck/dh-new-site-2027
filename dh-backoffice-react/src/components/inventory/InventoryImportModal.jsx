import { useRef } from 'react';
import { X, UploadCloud, Database, CheckCircle, Loader2 } from 'lucide-react';
import { useExcelImport } from './hooks/useExcelImport';

// Common Components
import GuidePanel from '../common/GuidePanel';

// Subcomponents
import ImportResultSummary from './import/ImportResultSummary';
import ImportUploader from './import/ImportUploader';
import ImportConfig from './import/ImportConfig';
import ImportPreviewTable from './import/ImportPreviewTable';

export default function InventoryImportModal({ isOpen, onClose, onSuccess }) {
  const {
    file, headers, parsedData, conflictStrategy, isProcessing, importResult, hasError,
    setConflictStrategy, handleDownloadTemplate, handleFileUpload, handleReset, handleConfirmImport
  } = useExcelImport(onSuccess);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-dh-border bg-dh-surface">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-dh-main flex items-center gap-2 border-r border-slate-200 pr-4">
              <Database size={20} className="text-dh-accent" />
              นำเข้าสินค้าด้วย Excel
            </h2>
            
            {/* Compact File Info in Header */}
            {file && !importResult && (
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <CheckCircle size={16} className="text-green-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 leading-tight max-w-[250px] truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{parsedData.length} แถว</span>
                </div>
                <button 
                  onClick={() => { 
                    handleReset(); 
                    if (fileInputRef.current) fileInputRef.current.value = ''; 
                  }}
                  className="ml-2 text-[11px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors outline-hidden"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-dh-base/50 custom-scrollbar flex-1 text-dh-main space-y-6">
          {importResult ? (
            <ImportResultSummary importResult={importResult} onClose={onClose} />
          ) : (
            <>
              {/* Step 1: Upload or Download Template */}
              {!file && (
                <div className="space-y-6">
                  <GuidePanel 
                    title="การนำเข้าข้อมูลสินค้าด้วย Excel"
                    description="เครื่องมือสำหรับเพิ่มหรืออัปเดตข้อมูลสินค้าทีละหลายรายการผ่านไฟล์ Excel เพื่อประหยัดเวลาในการจัดการคลังสินค้า"
                    howTo={[
                      "คลิก 'ดาวน์โหลด .xlsx' เพื่อรับไฟล์ Template ที่ถูกต้อง",
                      "กรอกข้อมูลสินค้าลงในไฟล์ Excel (ต้องมี SKU และ Name เป็นอย่างน้อย)",
                      "ลากไฟล์ที่แก้ไขแล้วมาวางในช่อง 'อัพโหลดไฟล์ Excel' หรือคลิกเพื่อเลือกไฟล์",
                      "ตรวจสอบความถูกต้องของข้อมูลในตารางพรีวิว",
                      "เลือกวิธีจัดการเมื่อพบ SKU ซ้ำ (เขียนทับ หรือ ข้าม)",
                      "กดยืนยันนำเข้าข้อมูล"
                    ]}
                    tips={[
                      "SKU ควรเป็นตัวพิมพ์ใหญ่ และไม่ควรมีเว้นวรรค เช่น 'SCR-15-PRO'",
                      "หากต้องการอัปเดตสต็อกเพียงอย่างเดียว สามารถกรอกแค่ SKU และ StockQuantity ได้ (หากเลือกเขียนทับ)",
                      "ไม่ควรนำเข้าเกิน 500 รายการต่อ 1 ไฟล์ เพื่อป้องกันการหน่วงของระบบ"
                    ]}
                    expectedResult="เมื่อนำเข้าสำเร็จ ข้อมูลจะถูกบันทึกลงฐานข้อมูลทันที หากมีข้อมูลซ้ำตามตัวเลือก ระบบจะจัดการเขียนทับหรือข้ามตามที่คุณตั้งค่าไว้"
                  />
                  <ImportUploader 
                    handleDownloadTemplate={handleDownloadTemplate}
                    handleFileUpload={handleFileUpload}
                    fileInputRef={fileInputRef}
                  />
                </div>
              )}

              {/* Step 2: Preview & Settings */}
              {file && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  {/* Preview Table */}
                  <ImportPreviewTable 
                    headers={headers}
                    parsedData={parsedData}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-between items-center shrink-0 gap-3">
            {/* Left side: Config (if file uploaded) */}
            <div className="flex-1">
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-600">จัดการข้อมูลซ้ำ:</span>
                  <select 
                    value={conflictStrategy}
                    onChange={(e) => setConflictStrategy(e.target.value)}
                    className="px-3 py-1.5 bg-dh-base border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold min-w-[150px]"
                  >
                    <option value="overwrite">เขียนทับ (Overwrite)</option>
                    <option value="skip">ข้าม (Skip)</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Right side: Actions */}
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isProcessing} 
                className="px-6 py-2.5 text-dh-main font-bold rounded-xl bg-dh-base border border-dh-border hover:bg-dh-border transition-colors text-sm shadow-xs disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleConfirmImport} 
                disabled={!file || isProcessing || !headers.includes('SKU') || hasError}
                className="px-8 py-2.5 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover flex items-center gap-2 shadow-xs transition-transform active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16}/>}
                {isProcessing ? 'กำลังประมวลผล...' : 'ยืนยันนำเข้าข้อมูล'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
