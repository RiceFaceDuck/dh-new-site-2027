import React from 'react';
import { Download, UploadCloud } from 'lucide-react';

export default function ImportUploader({ handleDownloadTemplate, handleFileUpload, fileInputRef }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-dh-surface p-6 rounded-2xl border border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 transition-colors shadow-sm">
        <div className="w-16 h-16 bg-dh-accent/10 rounded-full flex items-center justify-center text-dh-accent">
          <Download size={32} />
        </div>
        <div>
          <h3 className="font-bold text-lg">1. โหลด Template</h3>
          <p className="text-xs text-dh-muted mt-1">ไฟล์ Excel ที่มีการจัดเรียงคอลัมน์มาตรฐาน<br/>พร้อมตัวอย่างการกรอกข้อมูลที่ถูกต้อง</p>
        </div>
        <button 
          onClick={handleDownloadTemplate} 
          className="px-6 py-2 bg-dh-base border border-dh-border rounded-xl font-bold hover:bg-dh-border transition-colors text-sm"
        >
          ดาวน์โหลด .xlsx
        </button>
      </div>

      <div className="bg-dh-surface p-6 rounded-2xl border-2 border-dashed border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 hover:bg-dh-accent/5 transition-colors relative cursor-pointer group">
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={(e) => handleFileUpload(e.target.files[0])}
          ref={fileInputRef}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
          <UploadCloud size={32} />
        </div>
        <div>
          <h3 className="font-bold text-lg">2. อัพโหลดไฟล์ Excel</h3>
          <p className="text-xs text-dh-muted mt-1">รองรับไฟล์ .xlsx หรือ .csv<br/>ที่ปรับแต่งข้อมูลเรียบร้อยแล้ว</p>
        </div>
        <span className="text-sm font-bold text-blue-500">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</span>
      </div>
    </div>
  );
}
