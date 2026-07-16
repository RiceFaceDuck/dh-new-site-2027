import { useState, useRef, useEffect } from 'react';
import { Settings, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

import TemplatePreviewCard from './TemplatePreviewCard';
import TemplateUploadCard from './TemplateUploadCard';

export default function TemplateSettingsModal({ isOpen, onClose }) {
  const [skuTemplate, setSkuTemplate] = useState(false);
  const [invTemplate, setInvTemplate] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const skuRef = useRef(null);
  const invRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSkuTemplate(localStorage.getItem('bigseller_template_sku') ? true : false);
      setInvTemplate(localStorage.getItem('bigseller_template_inventory') ? true : false);
    } else {
      setPreviewData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = (e, key) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.xlsx')) {
      alert("กรุณาอัปโหลดไฟล์ .xlsx เท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dataUrl = event.target.result;
        const base64 = dataUrl.split(',')[1];
        
        if (!base64) throw new Error("Invalid file content");
        
        localStorage.setItem(key, base64);
        if (key === 'bigseller_template_sku') setSkuTemplate(true);
        if (key === 'bigseller_template_inventory') setInvTemplate(true);

        import('../../../firebase/historyService').then(({ historyService }) => {
          historyService.addLog({
            level: 'INFO',
            module: 'Template Settings',
            action: 'Upload Template',
            target: { id: key, type: 'Local Storage' },
            details: { message: `Uploaded new template for ${key}` }
          }).catch(console.error);
        }).catch(console.error);
      } catch (error) {
        console.error("Failed to parse file", error);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      }
    };
    reader.onerror = () => alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleRemove = (key) => {
    localStorage.removeItem(key);
    if (key === 'bigseller_template_sku') setSkuTemplate(false);
    if (key === 'bigseller_template_inventory') setInvTemplate(false);
    
    import('../../../firebase/historyService').then(({ historyService }) => {
      historyService.addLog({
        level: 'INFO',
        module: 'Template Settings',
        action: 'Remove Template',
        target: { id: key, type: 'Local Storage' },
        details: { message: `Removed template for ${key}` }
      }).catch(console.error);
    }).catch(console.error);
  };

  const getHeadersFromBase64 = (base64) => {
    try {
      const binaryStr = atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
      
      const wb = XLSX.read(bytes.buffer, { type: 'array', cellFormula: false, cellHTML: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      for (let row of data) {
        if (row && row.length > 0) {
          const headers = row.filter(cell => typeof cell === 'string' && cell.trim() !== '');
          if (headers.length > 0) return headers;
        }
      }
    } catch (error) {
      console.error("Preview failed", error);
    }
    return [];
  };

  const handlePreview = (key, typeTitle) => {
    const base64 = localStorage.getItem(key);
    if (!base64) return;
    
    const headers = getHeadersFromBase64(base64);
    let mapping;
    
    if (key === 'bigseller_template_sku') {
      mapping = [
        { col: '*SKU (หรือข้อความที่มีคำว่า sku)', schema: 'item.sku', desc: 'รหัสสินค้าอ้างอิง' }
      ];
    } else {
      mapping = [
        { col: '*SKU (หรือข้อความที่มีคำว่า sku)', schema: 'item.sku', desc: 'รหัสสินค้าอ้างอิง' },
        { col: '*คลังสินค้า (หรือ warehouse)', schema: localStorage.getItem('bigseller_warehouse_name') || '总仓库', isEditable: true, desc: 'คลิกเพื่อแก้ไขชื่อคลัง แล้วกดที่ว่างเพื่อบันทึก' },
        { col: '*สต็อกที่มีอยู่ (หรือ currentstock)', schema: 'item.newStock', desc: 'สต็อกปัจจุบันที่จะนำไปเขียนทับ' },
        { col: '*จำนวนการนับ (หรือ count)', schema: 'item.newStock', desc: 'สต็อกปัจจุบันที่จะนำไปเขียนทับ' }
      ];
    }

    setPreviewData({ title: typeTitle, headers, mapping });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-20">
          <div className="flex items-center gap-3">
            <button 
               onClick={() => previewData ? setPreviewData(null) : onClose()} 
               className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {previewData ? <Check size={20} className="text-indigo-600" /> : <Settings size={20} />}
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {previewData ? `ตัวอย่าง: ${previewData.title}` : 'ตั้งค่าไฟล์แม่แบบ (Templates)'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {previewData ? 'สรุปคอลัมน์ในไฟล์และการจับคู่กับฐานข้อมูล Schema' : 'อัปโหลดไฟล์แม่แบบที่ว่างเปล่าเพื่อใช้เป็นโครงสร้างในการส่งออกข้อมูล'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
          {!previewData && (
            <div className="p-6 space-y-6">
              
              <TemplateUploadCard 
                title="แม่แบบ SKU Merchant"
                number="1"
                color="indigo"
                hasTemplate={skuTemplate}
                fileName="import_merchant_sku_th.xlsx"
                onUpload={handleUpload}
                onPreview={handlePreview}
                onRemove={handleRemove}
                fileRef={skuRef}
                storageKey="bigseller_template_sku"
              />

              <TemplateUploadCard 
                title="แม่แบบ Inventory Count (总仓库)"
                number="2"
                color="emerald"
                hasTemplate={invTemplate}
                fileName="import_count_results_th.xlsx"
                onUpload={handleUpload}
                onPreview={handlePreview}
                onRemove={handleRemove}
                fileRef={invRef}
                storageKey="bigseller_template_inventory"
              />

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                  ตั้งค่าบัฟเฟอร์ (Buffer Stock)
                </h3>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">หักจำนวนสต็อกก่อนส่งออก (กันขายเกิน)</p>
                      <p className="text-xs text-slate-500 mt-0.5">ระบบจะนำยอดล่าสุดหักลบด้วยค่านี้เสมอ (ยอดต่ำสุดคือ 0)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        min="0"
                        defaultValue={localStorage.getItem('bigseller_export_buffer') || 0}
                        onBlur={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          localStorage.setItem('bigseller_export_buffer', val);
                          e.target.value = val;
                        }}
                        className="w-20 px-3 py-1.5 text-center font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        title="จำนวนชิ้นที่ต้องการเผื่อไว้"
                      />
                      <span className="text-sm text-slate-500">ชิ้น</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">4</span>
                  ตั้งค่าระบบ (System Settings)
                </h3>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Auto-Reset การนับรอบ (หลังดาวน์โหลด)</p>
                      <p className="text-xs text-slate-500 mt-0.5">เมื่อดาวน์โหลดไฟล์ 'ผลลัพธ์การนับ' เสร็จ ระบบจะตั้งสต็อกปัจจุบันเป็น 0 ใหม่ให้อัตโนมัติ</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked={localStorage.getItem('bigseller_auto_reset_baseline') === 'true'}
                        onChange={(e) => {
                          localStorage.setItem('bigseller_auto_reset_baseline', e.target.checked);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          <TemplatePreviewCard previewData={previewData} />

        </div>

        <div className="p-4 border-t border-slate-100 bg-white relative z-20 flex justify-between items-center">
          <p className="text-[11px] text-slate-400">
            {previewData ? "การแสดงผลตัวอย่างอาจคลาดเคลื่อนกับไฟล์ต้นฉบับเล็กน้อย" : "ไฟล์ถูกเก็บใน LocalStorage ปลอดภัยและไม่ขึ้น Server"}
          </p>
          {previewData && (
            <button 
              onClick={() => setPreviewData(null)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              กลับไปหน้าตั้งค่า
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
