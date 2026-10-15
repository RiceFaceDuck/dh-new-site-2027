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
    <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">💰 ราคาและสต๊อก (Pricing & Stock)</h3>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none">
          <input type="checkbox" checked={isAutoCalc} onChange={e => setIsAutoCalc(e.target.checked)} className="rounded-[2px] text-slate-900 focus:ring-slate-900 bg-white border-slate-300 cursor-pointer w-4 h-4" />
          คำนวณราคาปลีกอัตโนมัติ
        </label>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex justify-between bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-t-[2px] border border-blue-200 dark:border-blue-900 border-b-0">
            <span>ราคาส่ง ฐาน (Price) *</span><span className="opacity-70 text-[10px]">เฉพาะแอดมิน</span>
          </label>
          <div className="flex items-center border border-blue-200 dark:border-blue-900 rounded-b-[2px] bg-white dark:bg-slate-900 px-3 h-12 transition-all shadow-inner focus-within:ring-1 focus-within:ring-blue-500">
            <span className="text-blue-600 font-bold mr-2 text-lg">฿</span>
            <input type="number" required min="0" value={form.Price} 
              onChange={e => handlePriceChange(e.target.value, 'Price')}
              className="w-full outline-hidden font-black text-xl text-slate-900 dark:text-slate-100 bg-transparent" />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex justify-between bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-t-[2px] border border-emerald-200 dark:border-emerald-900 border-b-0">
            <span>ราคาปลีก (Retail) *</span><span className="opacity-70 text-[10px]">แสดงหน้าเว็บ</span>
          </label>
          <div className="flex items-center border border-emerald-200 dark:border-emerald-900 rounded-b-[2px] bg-white dark:bg-slate-900 px-3 h-12 transition-all shadow-inner focus-within:ring-1 focus-within:ring-emerald-500">
            <span className="text-emerald-600 font-bold mr-2 text-lg">฿</span>
            <input type="number" required min="0" value={form.retailPrice} 
              onChange={e => { setIsAutoCalc(false); handlePriceChange(e.target.value, 'retailPrice'); }}
              className="w-full outline-hidden font-black text-xl text-slate-900 dark:text-slate-100 bg-transparent" />
          </div>
          {Number(form.retailPrice) > 0 && Number(form.Price) > 0 && Number(form.retailPrice) < Number(form.Price) && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle size={12} />
              <span>ราคาปลีกต่ำกว่าราคาส่งฐาน (อาจขาดทุน)</span>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">สต๊อกจริง *</label>
          <input type="number" required min="0" value={form.stockQuantity} 
            onChange={e => setForm({...form, stockQuantity: Number(e.target.value)})}
            className="w-full h-12 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden font-black text-xl text-center text-slate-900 dark:text-slate-100 shadow-inner transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="md:col-span-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">หน่วยนับ</label>
          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
            className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 transition-all cursor-pointer">
            {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">Location</label>
          <input type="text" value={form.warehouseLocation} placeholder="เช่น ล็อก A"
            onChange={e => setForm({...form, warehouseLocation: e.target.value})}
            className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" />
        </div>

        <div className="md:col-span-2 flex items-end">
          {isManagerOrOwner ? (
            <div className="w-full">
              <label className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle size={12}/> บัฟเฟอร์พิเศษ (Override)
              </label>
              <input type="number" min="0" value={form.bufferStock === null || form.bufferStock === undefined ? '' : form.bufferStock} 
                onChange={e => setForm({...form, bufferStock: e.target.value})}
                placeholder={`ปล่อยว่าง = ใช้ค่าพื้นฐาน (${globalBufferStock ?? 2})`}
                className="w-full h-10 px-3 border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 rounded-[2px] outline-hidden focus:border-orange-500 text-sm font-bold text-orange-700 dark:text-orange-300 placeholder:text-orange-400/60 transition-all shadow-inner" />
            </div>
          ) : (
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold px-3 rounded-[2px] flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 h-10">
              <Shield size={14}/> บัฟเฟอร์สต๊อกถูกจัดการโดยส่วนกลาง
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
