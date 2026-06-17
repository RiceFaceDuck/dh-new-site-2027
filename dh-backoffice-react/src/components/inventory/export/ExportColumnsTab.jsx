import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ExportColumnsTab({
  sortOption,
  setSortOption,
  selectedColumns,
  setSelectedColumns,
  AVAILABLE_COLUMNS,
  handleToggleColumn
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">รูปแบบการจัดเรียง</h3>
        <select 
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full p-3 bg-dh-surface border border-dh-border rounded-xl text-sm font-bold outline-none focus:border-dh-accent cursor-pointer"
        >
          <option value="sku_asc">SKU (A-Z)</option>
          <option value="sku_desc">SKU (Z-A)</option>
          <option value="stock_asc">คงเหลือ (น้อยไปมาก)</option>
          <option value="stock_desc">คงเหลือ (มากไปน้อย)</option>
          <option value="price_desc">ราคา (มากไปน้อย)</option>
          <option value="price_asc">ราคา (น้อยไปมาก)</option>
          <option value="sales_desc">ยอดขาย 30 วัน (มากไปน้อย)</option>
          <option value="claims_desc">เคลม 30 วัน (มากไปน้อย)</option>
          <option value="stockin_desc">สินค้าเข้า 30 วัน (มากไปน้อย)</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 border-b border-dh-border pb-2">
          <h3 className="font-bold text-lg">คอลัมน์ที่จะ Export</h3>
          <button onClick={() => setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.key))} className="text-xs text-dh-accent font-bold hover:underline">เลือกทั้งหมด</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_COLUMNS.map((col) => {
            const isSelected = selectedColumns.includes(col.key);
            return (
              <div 
                key={col.key} onClick={() => handleToggleColumn(col.key)}
                className={`p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all flex items-center gap-2 select-none ${isSelected ? 'bg-dh-accent/10 border-dh-accent text-dh-accent shadow-sm' : 'bg-dh-base border-dh-border text-dh-muted hover:border-dh-accent/50'}`}
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-dh-accent border-dh-accent text-white' : 'border-dh-muted/50 bg-white'}`}>
                  {isSelected && <CheckCircle2 size={12} />}
                </div>
                {col.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
