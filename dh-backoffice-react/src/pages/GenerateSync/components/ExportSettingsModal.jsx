import React, { useState, useEffect } from 'react';
import { Settings2, Save, X, HelpCircle, Check } from 'lucide-react';

const DEFAULT_HEADERS = {
  updateInfo: 'หมายเหตุ : โปรดอย่าแก้ไข Item_ID หรือ Variation_ID!,Item_ID (ไม่สามารถแก้ไขได้),Variation_ID (ไม่สามารถแก้ไขได้),ชื่อสินค้า,ชื่อคุณสมบัติ,SKU,สต็อก,ราคา',
  skuMerchant: '*ชื่อSKU(ต้องระบุ)',
  inventoryCount: '*ชื่อSKU(ต้องระบุ),หัวข้อ,*ชื่อคลังสินค้า(ต้องระบุ),ตำแหน่ง,สต็อกที่มีอยู่,จำนวนการนับ,หมายเหตุ'
};

export default function ExportSettingsModal({ isOpen, onClose }) {
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('bigseller_export_headers') || '{}');
        setHeaders({
          updateInfo: saved.updateInfo ? saved.updateInfo.join(',') : DEFAULT_HEADERS.updateInfo,
          skuMerchant: saved.skuMerchant ? saved.skuMerchant.join(',') : DEFAULT_HEADERS.skuMerchant,
          inventoryCount: saved.inventoryCount ? saved.inventoryCount.join(',') : DEFAULT_HEADERS.inventoryCount,
        });
      } catch (e) {
        setHeaders(DEFAULT_HEADERS);
      }
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const formatted = {
      updateInfo: headers.updateInfo.split(','),
      skuMerchant: headers.skuMerchant.split(','),
      inventoryCount: headers.inventoryCount.split(',')
    };
    localStorage.setItem('bigseller_export_headers', JSON.stringify(formatted));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  const handleReset = () => {
    setHeaders(DEFAULT_HEADERS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ตั้งค่าหัวคอลัมน์ (Export Headers)</h2>
              <p className="text-xs text-slate-500 mt-0.5">แก้ไขหัวคอลัมน์สำหรับการดาวน์โหลดไฟล์ทั้ง 3 รูปแบบ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 text-left space-y-5">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-sm">
            <HelpCircle size={20} className="text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-indigo-900/80">
              <strong className="block text-indigo-900 mb-1 font-bold text-base">วิธีตั้งค่า</strong>
              <p className="leading-relaxed">
                พิมพ์ชื่อหัวคอลัมน์ที่ต้องการเรียงจากซ้ายไปขวา (A, B, C...) โดยใช้ <strong>ลูกน้ำ (,)</strong> คั่นระหว่างคอลัมน์ หากใส่ผิดรูปแบบอาจทำให้ไฟล์ผิดเพี้ยนได้
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Template 1 */}
            <div>
              <label className="text-sm font-bold text-slate-700 flex justify-between mb-1.5">
                <span>1. นำเข้าอัปเดตข้อมูลสินค้า</span>
                <span className="text-xs font-normal text-slate-400">8 คอลัมน์</span>
              </label>
              <textarea 
                value={headers.updateInfo}
                onChange={e => setHeaders(prev => ({...prev, updateInfo: e.target.value}))}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]"
              />
            </div>

            {/* Template 2 */}
            <div>
              <label className="text-sm font-bold text-slate-700 flex justify-between mb-1.5">
                <span>2. SKU Merchant</span>
                <span className="text-xs font-normal text-slate-400">1 คอลัมน์</span>
              </label>
              <textarea 
                value={headers.skuMerchant}
                onChange={e => setHeaders(prev => ({...prev, skuMerchant: e.target.value}))}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[60px]"
              />
            </div>

            {/* Template 3 */}
            <div>
              <label className="text-sm font-bold text-slate-700 flex justify-between mb-1.5">
                <span>3. นำเข้าผลลัพธ์การนับ</span>
                <span className="text-xs font-normal text-slate-400">7 คอลัมน์</span>
              </label>
              <textarea 
                value={headers.inventoryCount}
                onChange={e => setHeaders(prev => ({...prev, inventoryCount: e.target.value}))}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <button 
            onClick={handleReset}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            คืนค่าเริ่มต้น (Reset)
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                isSaved ? 'bg-emerald-500 text-white shadow-sm' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              }`}
            >
              {isSaved ? <><Check size={18} /> บันทึกแล้ว</> : <><Save size={18} /> บันทึกการตั้งค่า</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
