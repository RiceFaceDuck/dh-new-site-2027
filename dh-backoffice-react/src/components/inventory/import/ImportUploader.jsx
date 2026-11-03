import { Download, UploadCloud, Settings2 } from 'lucide-react';

export default function ImportUploader({ 
  handleDownloadTemplate, 
  handleFileUpload, 
  fileInputRef,
  onOpenColumnSettings 
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Download Template */}
        <div className="bg-dh-surface p-6 rounded-2xl border border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 transition-colors shadow-xs">
          <div className="w-16 h-16 bg-dh-accent/10 rounded-full flex items-center justify-center text-dh-accent">
            <Download size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg">1. โหลด Template</h3>
            <p className="text-xs text-dh-muted mt-1">ไฟล์ Excel ที่มีการจัดเรียงคอลัมน์มาตรฐาน<br/>พร้อมตัวอย่างการกรอกข้อมูลที่ถูกต้อง</p>
          </div>
          <button 
            type="button"
            onClick={handleDownloadTemplate} 
            className="px-6 py-2 bg-dh-base border border-dh-border rounded-xl font-bold hover:bg-dh-border transition-colors text-sm cursor-pointer"
          >
            ดาวน์โหลด .xlsx
          </button>
        </div>

        {/* Step 2: Upload Excel File (Click everywhere fixed with z-10 & pointer-events-none) */}
        <div className="bg-dh-surface p-6 rounded-2xl border-2 border-dashed border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 hover:bg-dh-accent/5 transition-colors relative cursor-pointer group">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={(e) => handleFileUpload(e.target.files[0])}
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่"
          />
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform pointer-events-none">
            <UploadCloud size={32} />
          </div>
          <div className="pointer-events-none">
            <h3 className="font-bold text-lg">2. อัพโหลดไฟล์ Excel</h3>
            <p className="text-xs text-dh-muted mt-1">รองรับไฟล์ .xlsx หรือ .csv<br/>ที่ปรับแต่งข้อมูลเรียบร้อยแล้ว</p>
          </div>
          <span className="text-sm font-bold text-blue-500 pointer-events-none">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</span>
        </div>
      </div>

      {/* Column mapping settings banner */}
      <div className="flex items-center justify-between px-4 py-3 bg-dh-surface border border-dh-border rounded-xl text-xs">
        <div className="flex items-center gap-2 text-dh-muted">
          <Settings2 size={16} className="text-dh-accent" />
          <span>ระบบรองรับหัวคอลัมน์หลากหลาย เช่น <b>SKU, *ชื่อSKU(ต้องระบุ), จำนวนการนับ, นับสต๊อค</b></span>
        </div>
        <button
          type="button"
          onClick={onOpenColumnSettings}
          className="px-3 py-1.5 bg-dh-base hover:bg-dh-accent/10 hover:text-dh-accent border border-dh-border rounded-lg font-bold text-dh-main transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Settings2 size={14} />
          <span>ตั้งค่าหัวคอลัมน์</span>
        </button>
      </div>
    </div>
  );
}
