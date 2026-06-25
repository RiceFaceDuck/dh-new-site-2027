import React from 'react';
import { Plus, Save, Loader2 } from 'lucide-react';

const companies = ['Kerry Express', 'J&T Express', 'Flash Express', 'EMS', 'Lalamove', 'ผู้ขายจัดส่งเอง'];
const productTypes = ['All', 'Notebook', 'Spare Parts', 'Accessories'];

export default function ShippingRuleForm({ form, setForm, handleSaveRule, isProcessing }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-max hover:shadow-md transition-shadow">
      <div className="bg-emerald-50 p-4 border-b border-emerald-100">
         <h3 className="font-black text-emerald-700 text-sm flex items-center gap-2">
           <Plus size={16}/> เพิ่มเงื่อนไขใหม่
         </h3>
      </div>
      <form onSubmit={handleSaveRule} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">บริษัทขนส่ง</label>
          <select 
            value={form.company} 
            onChange={e => setForm({...form, company: e.target.value})} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">บังคับใช้กับประเภทสินค้า</label>
          <select 
            value={form.productType} 
            onChange={e => setForm({...form, productType: e.target.value})} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
          >
            {productTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนชิ้น (ต่ำสุด)</label>
              <input 
                type="number" min="1" 
                value={form.minQty} 
                onChange={e => setForm({...form, minQty: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" 
              />
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนชิ้น (สูงสุด)</label>
              <input 
                type="number" min="1" 
                value={form.maxQty} 
                onChange={e => setForm({...form, maxQty: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" 
              />
           </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">ค่าจัดส่ง (บาท)</label>
          <input 
            type="number" min="0" 
            value={form.shippingFee} 
            onChange={e => setForm({...form, shippingFee: e.target.value})} 
            className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 text-lg font-black text-emerald-600 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isProcessing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex justify-center items-center gap-2 active:scale-95"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
          บันทึกเงื่อนไข
        </button>
      </form>
    </div>
  );
}
