import React, { useState, useEffect } from 'react';
import { Settings2, HelpCircle, Save, Check } from 'lucide-react';

export default function GlobalSchemaSettings() {
  const [aliases, setAliases] = useState({
    sku: 'sku, รหัสสินค้า, merchant, barcode, item code',
    qty: 'qty, quantity, จำนวน, stock, สต๊อก, สต็อก',
    price: 'price, ราคา, amount'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('global_schema_aliases');
    if (saved) {
      try {
        setAliases(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleChange = (key, value) => {
    setAliases(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('global_schema_aliases', JSON.stringify(aliases));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 p-5 mt-4 w-full relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Settings2 className="text-indigo-500" size={20} />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">ตั้งค่าคำค้นหาหัวคอลัมน์ (Schema Aliases)</h3>
        </div>

        {/* Documentation / Guide */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-5 flex gap-3 text-sm">
          <HelpCircle size={20} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-indigo-900/80 text-left">
            <strong className="block text-indigo-900 mb-1 font-bold text-base">คำแนะนำการใช้งาน</strong>
            <p className="leading-relaxed">
              พิมพ์คำที่เป็นไปได้สำหรับ <strong>หัวคอลัมน์</strong> ในไฟล์ Excel/CSV ของคุณ โดยใช้ <strong>ลูกน้ำ (,)</strong> คั่นระหว่างคำ<br/>
              ระบบจะนำคำเหล่านี้ไปค้นหาอัตโนมัติ ทำให้คุณสามารถใช้ไฟล์จากหลายแพลตฟอร์ม (เช่น Shopee, Lazada, ระบบ POS) ได้โดยไม่ต้องแก้ไขไฟล์ต้นฉบับ
            </p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 flex justify-between">
              <span>รหัสสินค้า (SKU Headers) <span className="text-rose-500">*</span></span>
              <span className="text-xs font-normal text-slate-400">คำที่ใช้หารหัสสินค้าอ้างอิง</span>
            </label>
            <input 
              type="text" 
              value={aliases.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              onBlur={handleSave}
              placeholder="เช่น sku, รหัสสินค้า, barcode"
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 flex justify-between">
              <span>จำนวน (Quantity Headers) <span className="text-rose-500">*</span></span>
              <span className="text-xs font-normal text-slate-400">คำที่ใช้หาตัวเลขสต็อก</span>
            </label>
            <input 
              type="text" 
              value={aliases.qty}
              onChange={(e) => handleChange('qty', e.target.value)}
              onBlur={handleSave}
              placeholder="เช่น qty, จำนวน, stock"
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 flex justify-between">
              <span>ราคา (Price Headers)</span>
              <span className="text-xs font-normal text-slate-400">คำที่ใช้หาราคา (ถ้ามี)</span>
            </label>
            <input 
              type="text" 
              value={aliases.price}
              onChange={(e) => handleChange('price', e.target.value)}
              onBlur={handleSave}
              placeholder="เช่น price, ราคา"
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex justify-end pt-3">
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${
                isSaved 
                  ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100'
              }`}
            >
              {isSaved ? <><Check size={18} strokeWidth={3} /> บันทึกอัตโนมัติเรียบร้อย</> : <><Save size={18} /> บันทึกการตั้งค่า</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
