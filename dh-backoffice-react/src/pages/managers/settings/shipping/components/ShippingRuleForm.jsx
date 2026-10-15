import { Plus, Save, Loader2, ShieldCheck, Truck, Trash2, Layers, Edit2, X } from 'lucide-react';

const companies = [
  'KEX (Kerry Express)',
  'Flash Express',
  'J&T Express',
  'SPX Express',
  'ไปรษณีย์ไทย (EMS)',
  'Lalamove',
  'ผู้ขายจัดส่งเอง',
  'อื่นๆ'
];

export default function ShippingRuleForm({ 
  form, 
  setForm, 
  categories = [],
  editingRuleId,
  handleCancelEdit,
  handleSaveRule, 
  isProcessing,
  handleAddCondition,
  handleRemoveCondition,
  handleConditionChange
}) {
  const isShipping = form.ruleType === 'shipping';
  const isInsurance = form.ruleType === 'insurance';

  // Dynamic category options merged with base categories
  const categoryOptions = [
    'All',
    'Notebook',
    'Spare Parts',
    'Accessories',
    ...categories
      .map(c => (typeof c === 'object' ? (c.type || c.name) : String(c)))
      .filter(name => name && !['All', 'Notebook', 'Spare Parts', 'Accessories'].includes(name))
  ];

  return (
    <div className={`bg-white rounded-2xl shadow-xs border overflow-hidden h-max transition-all ${
      editingRuleId ? 'border-amber-300 ring-2 ring-amber-300/30' : 'border-slate-200 hover:shadow-md'
    }`}>
      <div className={`p-4 border-b flex items-center justify-between ${
        editingRuleId ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'
      }`}>
         <h3 className={`font-black text-sm flex items-center gap-2 ${
           editingRuleId ? 'text-amber-800' : 'text-emerald-700'
         }`}>
           {editingRuleId ? <Edit2 size={16}/> : <Plus size={16}/>}
           {editingRuleId 
             ? (isShipping ? 'แก้ไขเงื่อนไขจัดส่ง' : 'แก้ไขประกันภัยจัดส่ง')
             : (isShipping ? 'เพิ่มเงื่อนไขจัดส่งใหม่' : 'เพิ่มประกันภัยใหม่')
           }
         </h3>
         {editingRuleId && (
           <button
             type="button"
             onClick={handleCancelEdit}
             className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
           >
             <X size={13} /> ยกเลิกแก้ไข
           </button>
         )}
      </div>
      
      <form onSubmit={handleSaveRule} className="p-5 space-y-4">
        
        {/* --- Switcher ประเภทกฎ --- */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">ประเภทเงื่อนไข</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setForm({ ...form, ruleType: 'shipping', matchType: 'category', conditions: [] })}
              className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isShipping 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Truck size={14} />
              ค่าจัดส่งสินค้า
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, ruleType: 'insurance', matchType: 'all', conditions: [] })}
              className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isInsurance 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck size={14} />
              ค่าประกันขนส่ง
            </button>
          </div>
        </div>

        {/* --- ฟอร์มเงื่อนไขค่าจัดส่ง --- */}
        {isShipping && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">บริษัทขนส่ง</label>
              <select 
                value={form.company} 
                onChange={e => setForm({...form, company: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
              >
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {form.company === 'อื่นๆ' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อบริษัทขนส่งอื่น (ระบุเอง)</label>
                <input 
                  type="text"
                  placeholder="กรอกชื่อบริษัทขนส่งที่ต้องการ..."
                  value={form.customCompany || ''} 
                  onChange={e => setForm({...form, customCompany: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">เงื่อนไขอ้างอิงตาม</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, matchType: 'category', conditions: [] })}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    form.matchType === 'category' 
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ประเภทสินค้า
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, matchType: 'sku', conditions: [] })}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    form.matchType === 'sku' 
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  รหัสสินค้า (SKU)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, matchType: 'combo' });
                    if (!form.conditions || form.conditions.length === 0) {
                      handleAddCondition();
                    }
                  }}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                    form.matchType === 'combo' 
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Layers size={11} />
                  เงื่อนไขผสม (Combo)
                </button>
              </div>
            </div>

            {form.matchType === 'category' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทสินค้า / หมวดหมู่</label>
                <select 
                  value={form.productType} 
                  onChange={e => setForm({...form, productType: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                >
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {form.matchType === 'sku' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">รหัสสินค้า (SKU)</label>
                <input 
                  type="text"
                  placeholder="ระบุรหัส SKU ที่ต้องการ (เช่น CPU-INTEL-I5)..."
                  value={form.sku || ''} 
                  onChange={e => setForm({...form, sku: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-mono uppercase"
                />
              </div>
            )}

            {form.matchType === 'combo' && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">เงื่อนไขผสมย่อย</span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md transition-colors"
                  >
                    + เพิ่มข้อกำหนด
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {(form.conditions || []).map((cond, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs relative space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={cond.type}
                          onChange={e => handleConditionChange(idx, 'type', e.target.value)}
                          className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-slate-700"
                        >
                          <option value="category">หมวดหมู่</option>
                          <option value="sku">รหัส SKU</option>
                        </select>

                        {cond.type === 'category' ? (
                          <select
                            value={cond.value}
                            onChange={e => handleConditionChange(idx, 'value', e.target.value)}
                            className="flex-1 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-slate-700"
                          >
                            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="กรอก SKU..."
                            value={cond.value || ''}
                            onChange={e => handleConditionChange(idx, 'value', e.target.value)}
                            className="flex-1 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-mono uppercase"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors"
                          title="ลบเงื่อนไขย่อย"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400">ชิ้นต่ำสุด</label>
                          <input
                            type="number"
                            min="1"
                            value={cond.minQty}
                            onChange={e => handleConditionChange(idx, 'minQty', e.target.value)}
                            className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400">ชิ้นสูงสุด</label>
                          <input
                            type="number"
                            min="1"
                            value={cond.maxQty}
                            onChange={e => handleConditionChange(idx, 'maxQty', e.target.value)}
                            className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* --- ฟอร์มเงื่อนไขค่าประกันขนส่ง --- */}
        {isInsurance && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">ขอบเขตเงื่อนไขประกัน</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, matchType: 'all', conditions: [] })}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                    form.matchType === 'all' 
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ทุกรายการสินค้า
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, matchType: 'sku', conditions: [] })}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                    form.matchType === 'sku' 
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  เจาะจง SKU
                </button>
              </div>
            </div>

            {form.matchType === 'sku' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 mb-1">รหัสสินค้า (SKU)</label>
                <input 
                  type="text"
                  placeholder="ระบุรหัส SKU ที่ต้องการคิดค่าประกัน..."
                  value={form.sku || ''} 
                  onChange={e => setForm({...form, sku: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-mono uppercase"
                />
              </div>
            )}
          </>
        )}

        {/* --- ฟิลด์จำนวนสินค้าในระดับบน (ซ่อนถ้าเลือกแบบ Combo เพราะตั้งค่าที่เงื่อนไขย่อยไปแล้ว) --- */}
        {form.matchType !== 'combo' && (
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">จำนวน (ชิ้นต่ำสุด)</label>
                <input 
                  type="number" min="1" 
                  value={form.minQty} 
                  onChange={e => setForm({...form, minQty: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all" 
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">จำนวน (ชิ้นสูงสุด)</label>
                <input 
                  type="number" min="1" 
                  value={form.maxQty} 
                  onChange={e => setForm({...form, maxQty: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white transition-all" 
                />
             </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {isShipping ? 'ค่าจัดส่ง (บาท)' : 'ค่าประกันจัดส่ง (บาท)'}
          </label>
          <input 
            type="number" min="0" 
            value={form.shippingFee} 
            onChange={e => setForm({...form, shippingFee: e.target.value})} 
            className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 text-lg font-black text-emerald-600 outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" 
          />
        </div>
        
        <div className="space-y-2 pt-1">
          <button 
            type="submit" 
            disabled={isProcessing}
            className={`w-full text-white font-black py-3 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 active:scale-95 ${
              editingRuleId 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            } disabled:bg-slate-300`}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            {editingRuleId ? 'อัปเดตเงื่อนไขที่เลือก' : 'บันทึกเงื่อนไข'}
          </button>

          {editingRuleId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all text-xs"
            >
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
