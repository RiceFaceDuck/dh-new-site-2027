import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, Upload, CheckCircle, FileText, Trash2, Eye, Database, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TemplateSettingsModal({ isOpen, onClose }) {
  const [skuTemplate, setSkuTemplate] = useState(false);
  const [invTemplate, setInvTemplate] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { title: string, headers: string[], mapping: object[] }

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

  const handleUpload = (e, key, setter) => {
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
        setter(true);

        import('../../../firebase/historyService').then(({ historyService }) => {
          historyService.addLog({
            level: 'INFO',
            module: 'Template Settings',
            action: 'Upload Template',
            target: { id: key, type: 'Local Storage' },
            details: { message: `Uploaded new template for ${key}` }
          });
        });
      } catch (error) {
        console.error("Failed to parse file", error);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      }
    };
    reader.onerror = () => alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    reader.readAsDataURL(file);
    if (e.target) e.target.value = ''; // reset
  };

  const handleRemove = (key, setter) => {
    localStorage.removeItem(key);
    setter(false);
    
    import('../../../firebase/historyService').then(({ historyService }) => {
      historyService.addLog({
        level: 'INFO',
        module: 'Template Settings',
        action: 'Remove Template',
        target: { id: key, type: 'Local Storage' },
        details: { message: `Removed template for ${key}` }
      });
    });
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
    let mapping = [];
    
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
          
          {/* View 1: Main Settings */}
          {!previewData && (
            <div className="p-6 space-y-6">
              
              {/* SKU Merchant Template */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
                  แม่แบบ SKU Merchant
                </h3>
                
                <div className={`p-4 rounded-xl border transition-colors ${skuTemplate ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-300 bg-white hover:border-indigo-300'}`}>
                  {skuTemplate ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={24} />
                        <div>
                          <p className="text-sm font-semibold text-green-700">ติดตั้งแม่แบบแล้ว</p>
                          <p className="text-xs text-green-600/80">ระบบพร้อมใช้งานไฟล์โครงสร้างนี้</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePreview('bigseller_template_sku', 'แม่แบบ SKU Merchant')} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Eye size={14} /> ดูตัวอย่างโครงสร้าง
                        </button>
                        <button onClick={() => handleRemove('bigseller_template_sku', setSkuTemplate)} className="text-red-400 hover:text-red-600 p-2 bg-white border border-red-100 rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <FileText className="mx-auto text-slate-300 mb-3" size={36} />
                      <p className="text-sm text-slate-600 font-bold mb-1">ยังไม่มีไฟล์แม่แบบ</p>
                      <p className="text-xs text-slate-500 mb-4">โปรดอัปโหลดไฟล์ <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">import_merchant_sku_th.xlsx</span></p>
                      <button onClick={() => skuRef.current?.click()} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all">
                        เลือกไฟล์อัปโหลด
                      </button>
                      <input type="file" ref={skuRef} onChange={(e) => handleUpload(e, 'bigseller_template_sku', setSkuTemplate)} accept=".xlsx" className="hidden" />
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Count Template */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</span>
                  แม่แบบ Inventory Count (总仓库)
                </h3>
                
                <div className={`p-4 rounded-xl border transition-colors ${invTemplate ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-300 bg-white hover:border-emerald-300'}`}>
                  {invTemplate ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={24} />
                        <div>
                          <p className="text-sm font-semibold text-green-700">ติดตั้งแม่แบบแล้ว</p>
                          <p className="text-xs text-green-600/80">ระบบพร้อมใช้งานไฟล์โครงสร้างนี้</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePreview('bigseller_template_inventory', 'แม่แบบ Inventory Count')} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Eye size={14} /> ดูตัวอย่างโครงสร้าง
                        </button>
                        <button onClick={() => handleRemove('bigseller_template_inventory', setInvTemplate)} className="text-red-400 hover:text-red-600 p-2 bg-white border border-red-100 rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <FileText className="mx-auto text-slate-300 mb-3" size={36} />
                      <p className="text-sm text-slate-600 font-bold mb-1">ยังไม่มีไฟล์แม่แบบ</p>
                      <p className="text-xs text-slate-500 mb-4">โปรดอัปโหลดไฟล์ <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">import_count_results_th.xlsx</span></p>
                      <button onClick={() => invRef.current?.click()} className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all">
                        เลือกไฟล์อัปโหลด
                      </button>
                      <input type="file" ref={invRef} onChange={(e) => handleUpload(e, 'bigseller_template_inventory', setInvTemplate)} accept=".xlsx" className="hidden" />
                    </div>
                  )}
                </div>
              </div>

              {/* Buffer Stock Setting */}
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
                        className="w-20 px-3 py-1.5 text-center font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        title="จำนวนชิ้นที่ต้องการเผื่อไว้"
                      />
                      <span className="text-sm text-slate-500">ชิ้น</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* View 2: Preview Mode */}
          {previewData && (
            <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Columns Found */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> 
                  คอลัมน์ที่พบในไฟล์แม่แบบ ({previewData.headers.length} คอลัมน์)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {previewData.headers.map((h, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md shadow-sm">
                      {h}
                    </span>
                  ))}
                  {previewData.headers.length === 0 && (
                    <span className="text-xs text-slate-400 italic">ไม่พบคอลัมน์ หรือไฟล์มีรูปแบบที่ซับซ้อนเกินไป (แต่ระบบอาจยังทำงานได้ปกติ)</span>
                  )}
                </div>
              </div>

              {/* Schema Mapping */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Database size={16} className="text-emerald-500" />
                  สรุปการจับคู่กับ Schema ของระบบ
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">คอลัมน์ใน Excel (ประมาณ)</th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">ดึงข้อมูลจาก (Schema)</th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.mapping.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700">{m.col}</td>
                          <td className="px-4 py-3">
                            {m.isEditable ? (
                              <input 
                                type="text"
                                defaultValue={m.schema}
                                onBlur={(e) => {
                                  const val = e.target.value.trim() || '总仓库';
                                  localStorage.setItem('bigseller_warehouse_name', val);
                                  e.target.value = val;
                                }}
                                className="font-mono text-xs text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-300 w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                                title="คลิกเพื่อแก้ไขชื่อคลังสินค้า"
                              />
                            ) : (
                              <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                {m.schema}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{m.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  * ระบบจะค้นหาคอลัมน์โดยอัตโนมัติจากคำค้นหา (Keyword) ไม่ว่าจะอยู่คอลัมน์ไหนก็ตาม
                </p>
              </div>

            </div>
          )}

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
