import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function ExportSkusTab({
  parsedSpecificSkus,
  handleFileUpload,
  fileInputRef,
  specificSkusInput,
  setSpecificSkusInput
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-orange-600 dark:text-orange-400">
        <p className="text-sm font-bold">⚠️ หากมีการระบุ SKU ในหน้านี้ ระบบจะเพิกเฉยต่อตัวกรองหมวดหมู่และสต๊อก (จะดึงมาแค่ SKU ที่ระบุเท่านั้น)</p>
      </div>

      <div>
        <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4 flex justify-between items-end">
          <span>อัปโหลดไฟล์ Excel / CSV</span>
          {parsedSpecificSkus.length > 0 && <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">พบ {parsedSpecificSkus.length} SKUs ในไฟล์</span>}
        </h3>
        <div className="border-2 border-dashed border-dh-border rounded-xl p-6 text-center hover:bg-dh-base hover:border-dh-accent/50 transition-colors relative cursor-pointer group">
          <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <UploadCloud size={32} className="text-dh-muted mx-auto mb-2 group-hover:text-dh-accent group-hover:scale-110 transition-transform" />
          <p className="font-bold text-sm text-dh-main">คลิกหรือลากไฟล์ Excel มาวางที่นี่</p>
          <p className="text-xs text-dh-muted mt-1">คอลัมน์แรก หรือคอลัมน์ที่มีหัวข้อ 'SKU' จะถูกนำมาใช้</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">หรือ พิมพ์ระบุ SKU แบบ Manual</h3>
        <textarea 
          value={specificSkusInput}
          onChange={e => setSpecificSkusInput(e.target.value)}
          placeholder="EXM-001&#10;KB-1234&#10;BAT-999&#10;(พิมพ์บรรทัดละรายการ หรือคั่นด้วยลูกน้ำ)"
          className="w-full h-32 p-4 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent resize-none custom-scrollbar text-sm font-medium uppercase"
        />
      </div>
    </div>
  );
}
