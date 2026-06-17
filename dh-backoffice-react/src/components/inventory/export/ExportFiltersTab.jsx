import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

export default function ExportFiltersTab({
  availableCategories,
  selectedCategories,
  handleToggleCategory,
  stockMin,
  setStockMin,
  stockMax,
  setStockMax
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">คัดกรองตามหมวดหมู่</h3>
        <div className="grid grid-cols-2 gap-3">
          {availableCategories.map(cat => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <div 
                key={cat} onClick={() => handleToggleCategory(cat)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-dh-accent/10 border-dh-accent text-dh-accent' : 'bg-dh-surface border-dh-border text-dh-muted hover:border-dh-accent/50 hover:bg-dh-base'}`}
              >
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="opacity-50" />}
                <span className="font-bold text-sm">{cat}</span>
              </div>
            )
          })}
          {availableCategories.length === 0 && <p className="text-sm text-dh-muted">ไม่พบข้อมูลหมวดหมู่ (โปรดรีเฟรชหน้าเว็บ)</p>}
        </div>
        <p className="text-xs text-dh-muted mt-2">* หากไม่เลือกเลย ระบบจะดึงข้อมูลมาทุกหมวดหมู่</p>
      </div>

      <div>
        <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">ช่วงจำนวนสินค้าคงเหลือ</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-[10px] font-bold text-dh-muted uppercase mb-1 block">ตั้งแต่ (Min)</label>
            <input type="number" placeholder="0" value={stockMin} onChange={e => setStockMin(e.target.value)} className="w-24 p-2.5 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent text-sm font-bold text-center" />
          </div>
          <span className="text-dh-muted font-bold mt-4">-</span>
          <div>
            <label className="text-[10px] font-bold text-dh-muted uppercase mb-1 block">ถึง (Max)</label>
            <input type="number" placeholder="10" value={stockMax} onChange={e => setStockMax(e.target.value)} className="w-24 p-2.5 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent text-sm font-bold text-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
