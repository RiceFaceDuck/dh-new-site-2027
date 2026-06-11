import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

const DEFAULT_UNITS = ['ชิ้น', 'คู่ (L+R)', 'เมตร', 'แผ่น', 'ชุด', 'อื่นๆ'];

export default function ProductPricingStock({
  form, setForm,
  isAutoCalc, setIsAutoCalc,
  handlePriceChange,
  isManagerOrOwner,
  globalBufferStock
}) {
  return (
    <div className="bg-dh-surface p-5 rounded-2xl border border-dh-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black text-dh-main flex items-center gap-2">💰 ราคาและสต๊อก (Pricing & Stock)</h3>
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-dh-muted uppercase tracking-wider bg-dh-base px-2 py-1 rounded-lg border border-dh-border shadow-sm hover:bg-dh-surface transition-colors">
          <input type="checkbox" checked={isAutoCalc} onChange={e => setIsAutoCalc(e.target.checked)} className="rounded text-dh-accent focus:ring-dh-accent bg-dh-surface border-dh-border" />
          คำนวณราคาปลีกอัตโนมัติ
        </label>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex justify-between bg-blue-500/10 px-3 py-1.5 rounded-t-xl border border-blue-500/20 border-b-0">
            <span>ราคาส่ง ฐาน (Price) *</span><span className="opacity-70">เฉพาะแอดมิน</span>
          </label>
          <div className="flex items-center border border-blue-500/20 rounded-b-xl bg-dh-base focus-within:bg-dh-surface px-3 py-2.5 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-inner">
            <span className="text-blue-500 font-bold mr-2 text-lg">฿</span>
            <input type="number" required min="0" value={form.Price} 
              onChange={e => handlePriceChange(e.target.value, 'Price')}
              className="w-full outline-none font-black text-xl text-dh-main bg-transparent" />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex justify-between bg-green-500/10 px-3 py-1.5 rounded-t-xl border border-green-500/20 border-b-0">
            <span>ราคาปลีก (Retail) *</span><span className="opacity-70">แสดงหน้าเว็บ</span>
          </label>
          <div className="flex items-center border border-green-500/20 rounded-b-xl bg-dh-base focus-within:bg-dh-surface px-3 py-2.5 focus-within:ring-1 focus-within:ring-green-400 transition-all shadow-inner">
            <span className="text-green-500 font-bold mr-2 text-lg">฿</span>
            <input type="number" required min="0" value={form.retailPrice} 
              onChange={e => { setIsAutoCalc(false); handlePriceChange(e.target.value, 'retailPrice'); }}
              className="w-full outline-none font-black text-xl text-dh-main bg-transparent" />
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider px-1 block mb-1">สต๊อกจริง *</label>
          <input type="number" required min="0" value={form.stockQuantity} 
            onChange={e => setForm({...form, stockQuantity: Number(e.target.value)})}
            className="w-full p-2.5 h-[52px] border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:ring-1 focus:ring-dh-accent font-black text-xl text-center text-dh-main shadow-inner transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dh-border">
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">หน่วยนับ</label>
          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:border-dh-accent text-sm font-bold text-dh-main transition-all cursor-pointer">
            {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Location</label>
          <input type="text" value={form.warehouseLocation} placeholder="เช่น ล็อก A"
            onChange={e => setForm({...form, warehouseLocation: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:border-dh-accent text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>

        <div className="md:col-span-2 flex items-end">
          {isManagerOrOwner ? (
            <div className="w-full">
              <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle size={12}/> บัฟเฟอร์พิเศษ (Override)
              </label>
              <input type="number" min="0" value={form.bufferStock === null ? '' : form.bufferStock} 
                onChange={e => setForm({...form, bufferStock: e.target.value})}
                placeholder={`ปล่อยว่าง = ใช้ค่าพื้นฐาน (${globalBufferStock})`}
                className="w-full p-2.5 border border-orange-500/30 bg-orange-500/5 rounded-xl outline-none focus:border-orange-500 text-sm font-bold text-orange-600 dark:text-orange-400 placeholder:text-orange-500/50 transition-all shadow-inner" />
            </div>
          ) : (
            <div className="w-full bg-dh-base text-dh-muted text-[10px] uppercase tracking-wider font-bold p-3 rounded-xl flex items-center justify-center gap-2 border border-dh-border shadow-inner h-[42px]">
              <Shield size={14}/> บัฟเฟอร์สต๊อกถูกจัดการโดยส่วนกลาง
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
