import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, Upload, CheckCircle, FileText, Trash2 } from 'lucide-react';

export default function TemplateSettingsModal({ isOpen, onClose }) {
  const [skuTemplate, setSkuTemplate] = useState(null);
  const [invTemplate, setInvTemplate] = useState(null);

  const skuRef = useRef(null);
  const invRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSkuTemplate(localStorage.getItem('bigseller_template_sku') ? true : false);
      setInvTemplate(localStorage.getItem('bigseller_template_inventory') ? true : false);
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
      const base64 = btoa(
        new Uint8Array(event.target.result)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      localStorage.setItem(key, base64);
      setter(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemove = (key, setter) => {
    localStorage.removeItem(key);
    setter(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">ตั้งค่าไฟล์แม่แบบ (Templates)</h2>
              <p className="text-sm text-slate-500 mt-0.5">อัปโหลดไฟล์แม่แบบที่ว่างเปล่าเพื่อใช้เป็นโครงสร้างในการส่งออกข้อมูล</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* SKU Merchant Template */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
              แม่แบบ SKU Merchant
            </h3>
            
            <div className={`p-4 rounded-xl border ${skuTemplate ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-300 bg-slate-50'}`}>
              {skuTemplate ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <p className="text-sm font-semibold text-green-700">ติดตั้งแม่แบบแล้ว</p>
                      <p className="text-xs text-green-600/80">ระบบพร้อมใช้งานไฟล์โครงสร้างนี้</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove('bigseller_template_sku', setSkuTemplate)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-600 font-medium mb-1">ยังไม่มีไฟล์แม่แบบ</p>
                  <p className="text-xs text-slate-400 mb-4">โปรดอัปโหลดไฟล์ <span className="font-semibold text-indigo-600">import_merchant_sku_th.xlsx</span> ที่ได้จากระบบ Big Seller</p>
                  <button onClick={() => skuRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-sm rounded-lg transition-colors">
                    คลิกเพื่อเลือกไฟล์
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
            
            <div className={`p-4 rounded-xl border ${invTemplate ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-300 bg-slate-50'}`}>
              {invTemplate ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <p className="text-sm font-semibold text-green-700">ติดตั้งแม่แบบแล้ว</p>
                      <p className="text-xs text-green-600/80">ระบบพร้อมใช้งานไฟล์โครงสร้างนี้</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove('bigseller_template_inventory', setInvTemplate)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-600 font-medium mb-1">ยังไม่มีไฟล์แม่แบบ</p>
                  <p className="text-xs text-slate-400 mb-4">โปรดอัปโหลดไฟล์ <span className="font-semibold text-emerald-600">import_count_results_th.xlsx</span> ที่ได้จากระบบ Big Seller</p>
                  <button onClick={() => invRef.current?.click()} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-sm rounded-lg transition-colors">
                    คลิกเพื่อเลือกไฟล์
                  </button>
                  <input type="file" ref={invRef} onChange={(e) => handleUpload(e, 'bigseller_template_inventory', setInvTemplate)} accept=".xlsx" className="hidden" />
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            ไฟล์แม่แบบจะถูกเก็บไว้ในหน่วยความจำของเบราว์เซอร์อย่างปลอดภัย ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์
          </p>
        </div>
      </div>
    </div>
  );
}
