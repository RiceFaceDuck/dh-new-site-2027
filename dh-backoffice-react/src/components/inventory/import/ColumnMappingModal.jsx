import React, { useState, useEffect } from 'react';
import { X, Plus, RotateCcw, Check, Settings2, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  DEFAULT_COLUMN_MAPPINGS, 
  getColumnMappings, 
  saveColumnMappings, 
  resetColumnMappings 
} from './columnMappingService';

export default function ColumnMappingModal({ isOpen, onClose, onSaved }) {
  const [mappings, setMappings] = useState(DEFAULT_COLUMN_MAPPINGS);
  const [newInputs, setNewInputs] = useState({
    sku: '',
    stockQuantity: '',
    addStock: '',
    price: '',
    retailPrice: '',
    name: ''
  });

  useEffect(() => {
    if (isOpen) {
      setMappings(getColumnMappings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddAlias = (category) => {
    const val = (newInputs[category] || '').trim();
    if (!val) return;

    if (mappings[category].some(a => a.toLowerCase() === val.toLowerCase())) {
      toast.error(`คำว่า "${val}" มีอยู่ในการตั้งค่าแล้ว`);
      return;
    }

    setMappings(prev => ({
      ...prev,
      [category]: [...prev[category], val]
    }));

    setNewInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveAlias = (category, aliasToRemove) => {
    // Guard: SKU and stockQuantity must have at least one alias
    if (mappings[category].length <= 1) {
      toast.error('ต้องมีชื่อหัวคอลัมน์อย่างน้อย 1 รายการ');
      return;
    }

    setMappings(prev => ({
      ...prev,
      [category]: prev[category].filter(a => a !== aliasToRemove)
    }));
  };

  const handleReset = () => {
    const def = resetColumnMappings();
    setMappings(def);
    toast.success('คืนค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  const handleSave = () => {
    const success = saveColumnMappings(mappings);
    if (success) {
      toast.success('บันทึกการตั้งค่าหัวคอลัมน์เรียบร้อย');
      if (onSaved) onSaved(mappings);
      onClose();
    } else {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  const categories = [
    {
      key: 'sku',
      label: 'รหัสสินค้า (SKU)',
      required: true,
      desc: 'ระบบจะมองหาหัวคอลัมน์เหล่านี้เพื่อระบุ SKU ของสินค้า (สำคัญที่สุด)',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    },
    {
      key: 'stockQuantity',
      label: 'จำนวนการนับ (นับสต๊อกจริง - Overwrite)',
      required: false,
      desc: 'ตัวเลขในช่องนี้จะถูกนำไปอัปเดตเป็นยอดสต๊อกคงเหลือจริง และบันทึกผลต่างการปรับยอด',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      key: 'addStock',
      label: 'เพิ่มสต็อก (AddStock - Increment)',
      required: false,
      desc: 'ตัวเลขในช่องนี้จะนำไปบวกเพิ่มต่อยอดสต๊อกเดิมที่มีอยู่',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    },
    {
      key: 'price',
      label: 'ราคาส่ง (Price)',
      required: false,
      desc: 'ราคาส่งฐานของสินค้า',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
    },
    {
      key: 'name',
      label: 'ชื่อสินค้า (Name)',
      required: false,
      desc: 'ชื่อหรือหัวข้อสินค้า',
      tagColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-dh-surface rounded-[2px] shadow-dh-elevated border border-dh-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dh-border bg-dh-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dh-accent/10 flex items-center justify-center text-dh-accent">
              <Settings2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-dh-main">ตั้งค่าการจับคู่หัวคอลัมน์ Excel</h3>
              <p className="text-xs text-dh-muted">กำหนดชื่อคอลัมน์ที่ระบบจะค้นหาในไฟล์ Excel ของพี่โดยอัตโนมัติ</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors outline-hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-dh-base/30">
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-[2px] p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <HelpCircle size={16} className="shrink-0 mt-0.5 text-blue-500" />
            <div>
              ระบบจะจับคู่แบบยืดหยุ่นให้เสมอ (ไม่สนตัวพิมพ์เล็ก-ใหญ่ ไม่สนวงเล็บ หรือเครื่องหมายดอกจัน <code>*</code>) หากไฟล์ Excel ของพี่ใช้หัวคอลัมน์แบบใด สามารถพิมพ์เพิ่มไว้ที่นี่ได้เลยค่ะ
            </div>
          </div>

          <div className="space-y-4">
            {categories.map(cat => (
              <div 
                key={cat.key} 
                className="bg-dh-surface border border-dh-border rounded-[2px] p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-dh-main">{cat.label}</span>
                    {cat.required && <span className="text-[11px] text-red-500 font-bold">*จำเป็น</span>}
                  </div>
                  <span className="text-[11px] text-dh-muted">{mappings[cat.key]?.length || 0} รูปแบบ</span>
                </div>
                <p className="text-xs text-dh-muted">{cat.desc}</p>

                {/* Aliases Tag Cloud */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(mappings[cat.key] || []).map((alias, idx) => (
                    <span 
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${cat.tagColor}`}
                    >
                      <span>{alias}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(cat.key, alias)}
                        className="hover:opacity-100 opacity-60 hover:text-red-600 transition-opacity ml-0.5"
                        title={`ลบ ${alias}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new alias input */}
                <div className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    value={newInputs[cat.key] || ''}
                    onChange={(e) => setNewInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAlias(cat.key);
                      }
                    }}
                    placeholder={`พิมพ์ชื่อหัวคอลัมน์ที่ต้องการเพิ่ม เช่น "${cat.key === 'sku' ? '*ชื่อSKU(ต้องระบุ)' : cat.key === 'stockQuantity' ? 'จำนวนการนับ' : 'ชื่อหัวตาราง'}" แล้วกด Enter`}
                    className="flex-1 px-3 py-1.5 text-xs bg-dh-base border border-dh-border rounded-[2px] outline-hidden focus:border-dh-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAlias(cat.key)}
                    className="px-3 py-1.5 bg-dh-base hover:bg-dh-border border border-dh-border rounded-lg text-xs font-bold text-dh-main transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-dh-border bg-dh-surface">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={14} />
            <span>คืนค่าเริ่มต้น</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-dh-border rounded-xl text-xs font-bold text-dh-muted hover:text-dh-main hover:bg-dh-base transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-dh-accent hover:bg-dh-accent/90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check size={14} />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
