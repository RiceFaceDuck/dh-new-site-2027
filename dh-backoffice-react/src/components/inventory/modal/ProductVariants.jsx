import { useState } from 'react';
import { Plus, Trash2, Settings, AlertCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductVariants({ form, setForm }) {
  const [newOptionName, setNewOptionName] = useState('');

  // ฟังก์ชันเพิ่มตัวเลือกใหม่ (เช่น "สี", "ความจุ")
  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    // ป้องกันการใส่ชื่อซ้ำ
    if (form.variantOptions.some(opt => opt.name === newOptionName.trim())) {
      toast.error('ชื่อตัวเลือกนี้มีอยู่แล้ว');
      return;
    }
    
    const updatedOptions = [...form.variantOptions, { name: newOptionName.trim(), values: [] }];
    setForm({ ...form, variantOptions: updatedOptions });
    setNewOptionName('');
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = form.variantOptions.filter((_, i) => i !== index);
    setForm({ ...form, variantOptions: updatedOptions });
  };

  const handleAddOptionValue = (e, optionIndex, inputStr, setInputStr) => {
    if (e.key === 'Enter' && inputStr.trim()) {
      e.preventDefault();
      const val = inputStr.trim();
      const updatedOptions = [...form.variantOptions];
      
      if (!updatedOptions[optionIndex].values.includes(val)) {
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          values: [...updatedOptions[optionIndex].values, val]
        };
        setForm({ ...form, variantOptions: updatedOptions });
      }
      setInputStr('');
    }
  };

  const handleRemoveOptionValue = (optionIndex, valueIndex) => {
    const updatedOptions = [...form.variantOptions];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      values: updatedOptions[optionIndex].values.filter((_, i) => i !== valueIndex)
    };
    setForm({ ...form, variantOptions: updatedOptions });
  };

  // ฟังก์ชันสุ่มหรือสร้าง ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ฟังก์ชันสร้างรายการ Variants จาก Options แบบ Cartesian Product
  const generateVariants = () => {
    if (form.variantOptions.length === 0) {
      toast((t) => (
        <div className="flex flex-col gap-2 p-1 text-slate-800">
          <div className="text-sm font-bold">ไม่มีตัวเลือกย่อย</div>
          <div className="text-xs text-slate-500">คุณไม่มีตัวเลือกย่อย ระบบจะล้างรายการรุ่นย่อยทั้งหมด ยืนยันหรือไม่?</div>
          <div className="flex gap-2 justify-end mt-1">
            <button 
              type="button"
              onClick={() => toast.dismiss(t.id)} 
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button 
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                setForm({ ...form, variants: [] });
                toast.success('ล้างรายการรุ่นย่อยแล้ว');
              }} 
              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              ยืนยันล้างข้อมูล
            </button>
          </div>
        </div>
      ), { duration: 5000 });
      return;
    }

    // ตรวจสอบว่าทุก Option มี Values
    for (let opt of form.variantOptions) {
      if (opt.values.length === 0) {
        toast.error(`ตัวเลือก "${opt.name}" ยังไม่มีค่า (เช่น แดง, ดำ) กรุณาใส่ให้ครบก่อนสร้างตาราง`);
        return;
      }
    }

    // Recursive function for Cartesian Product
    const cartesian = (options, currentAttr = {}, index = 0, results = []) => {
      if (index === options.length) {
        results.push({ attributes: currentAttr });
        return;
      }
      const opt = options[index];
      for (let val of opt.values) {
        cartesian(options, { ...currentAttr, [opt.name]: val }, index + 1, results);
      }
      return results;
    };

    const newCombinations = cartesian(form.variantOptions);

    // พยายามดึงค่าเดิมกลับมาถ้า Attributes ตรงกัน เพื่อไม่ให้ราคา/สต็อกเดิมหาย
    const newVariants = newCombinations.map(combo => {
      const existing = form.variants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(combo.attributes)
      );

      if (existing) return existing;

      // สร้างตัวใหม่
      const attrValues = Object.values(combo.attributes).join('-');
      return {
        id: generateId(),
        sku: `${form.sku ? form.sku + '-' : 'SKU-'}${attrValues.toUpperCase()}`,
        attributes: combo.attributes,
        price: form.Price || 0,
        retailPrice: form.retailPrice || 0,
        stockQuantity: 0,
        isActive: true
      };
    });

    setForm({ ...form, variants: newVariants });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...form.variants];
    
    // Convert numbers
    if (['price', 'retailPrice', 'stockQuantity'].includes(field)) {
      value = value === '' ? 0 : Number(value);
    }
    
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setForm({ ...form, variants: updatedVariants });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = form.variants.filter((_, i) => i !== index);
    setForm({ ...form, variants: updatedVariants });
  };

  // Local state for temporary inputs inside the map
  const OptionInput = ({ opt, index }) => {
    const [tempVal, setTempVal] = useState('');
    return (
      <div className="flex-1">
        <input
          type="text"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onKeyDown={(e) => handleAddOptionValue(e, index, tempVal, setTempVal)}
          placeholder={`พิมพ์ค่า "${opt.name}" (เช่น แดง) แล้วกด Enter`}
          className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-[2px] text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-slate-800 dark:focus:border-orange-500 transition-colors font-medium"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {opt.values.map((v, vIndex) => (
            <span key={vIndex} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-[2px] text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              {v}
              <button type="button" onClick={() => handleRemoveOptionValue(index, vIndex)} className="p-0.5 rounded-[2px] hover:bg-red-500/20 hover:text-red-600 text-slate-400 transition-colors cursor-pointer">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[2px] overflow-hidden shadow-sm relative group">
      {/* 📘 In-App Documentation Tooltip */}
      <div className="absolute top-4 right-4 z-10 group/tooltip">
        <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-help">
          <AlertCircle size={18} />
        </div>
        <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[2px] shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-sm text-slate-600 dark:text-slate-300 z-20">
          <p className="font-bold text-slate-900 dark:text-slate-100 mb-2">💡 คำแนะนำ: ระบบสินค้าย่อย</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>พิมพ์ชื่อตัวเลือก (เช่น "สี" หรือ "รุ่น") แล้วกด <b>+ เพิ่ม</b></li>
            <li>ในช่องที่โผล่มา ให้พิมพ์ค่า (เช่น "แดง", "ดำ") แล้วกด <b>Enter</b></li>
            <li>เมื่อใส่ครบแล้ว ให้กดปุ่ม <b>สร้างตารางรุ่นย่อย</b> ด้านล่างเพื่อแก้ไขราคาและสต็อกแยกตามชิ้นได้เลย</li>
          </ul>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center gap-2">
        <Settings size={16} className="text-slate-700 dark:text-slate-300" />
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">ตัวเลือกสินค้า (Variants)</h3>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Step 1: Manage Option Names */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="เพิ่มตัวเลือก เช่น สี, ขนาด, รุ่น"
              className="flex-1 h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-[2px] text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-slate-800 dark:focus:border-orange-500 transition-colors font-medium placeholder:text-slate-400"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="h-10 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-xl text-sm font-bold border-2 border-slate-900 dark:border-orange-500 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> เพิ่ม
            </button>
          </div>

          {/* Options List */}
          {form.variantOptions && form.variantOptions.length > 0 && (
            <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-[2px] bg-slate-50/50 dark:bg-slate-900/30">
              {(form.variantOptions || []).map((opt, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 p-3 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 shadow-xs">
                  <div className="w-full sm:w-1/4 flex justify-between items-center sm:items-start">
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">{opt.name}</span>
                    <button type="button" onClick={() => handleRemoveOption(index)} className="text-red-500 hover:text-red-600 p-1 cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <OptionInput opt={opt} index={index} />
                </div>
              ))}
              
              <div className="flex justify-end pt-2">
                <button 
                  type="button" 
                  onClick={generateVariants}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold border-2 border-slate-900 dark:border-white flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <RefreshCw size={16} /> สร้างตารางรุ่นย่อย (Generate)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Variants Table */}
        {form.variants && form.variants.length > 0 && (
          <div className="border border-slate-300 dark:border-slate-700 rounded-[2px] overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">ตัวเลือก</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">ราคาปลีก</th>
                  <th className="px-4 py-3 text-right">สต็อก</th>
                  <th className="px-4 py-3 text-center">เปิดขาย</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(form.variants || []).map((v, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {Object.values(v.attributes).join(' / ')}
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={v.sku || ''} 
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-[2px] focus:border-slate-800 dark:focus:border-orange-500 outline-hidden font-mono text-xs text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={v.retailPrice} 
                        onChange={(e) => handleVariantChange(index, 'retailPrice', e.target.value)}
                        className="w-full text-right px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-[2px] focus:border-slate-800 dark:focus:border-orange-500 outline-hidden font-bold text-xs text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={v.stockQuantity} 
                        onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                        className="w-full text-right px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-[2px] focus:border-slate-800 dark:focus:border-orange-500 outline-hidden font-bold text-xs text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={v.isActive} 
                        onChange={(e) => handleVariantChange(index, 'isActive', e.target.checked)}
                        className="cursor-pointer w-4 h-4 rounded-[2px] border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button type="button" onClick={() => handleRemoveVariant(index)} className="text-red-500 hover:text-red-600 p-1 cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
