import React, { useState } from 'react';
import { Plus, Trash2, Settings, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProductVariants({ form, setForm }) {
  const [newOptionName, setNewOptionName] = useState('');

  // ฟังก์ชันเพิ่มตัวเลือกใหม่ (เช่น "สี", "ความจุ")
  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    // ป้องกันการใส่ชื่อซ้ำ
    if (form.variantOptions.some(opt => opt.name === newOptionName.trim())) {
      alert('ชื่อตัวเลือกนี้มีอยู่แล้ว');
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
        updatedOptions[optionIndex].values.push(val);
        setForm({ ...form, variantOptions: updatedOptions });
      }
      setInputStr('');
    }
  };

  const handleRemoveOptionValue = (optionIndex, valueIndex) => {
    const updatedOptions = [...form.variantOptions];
    updatedOptions[optionIndex].values = updatedOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    setForm({ ...form, variantOptions: updatedOptions });
  };

  // ฟังก์ชันสุ่มหรือสร้าง ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ฟังก์ชันสร้างรายการ Variants จาก Options แบบ Cartesian Product
  const generateVariants = () => {
    if (form.variantOptions.length === 0) {
      if (window.confirm('คุณไม่มีตัวเลือกย่อย ระบบจะล้างรายการรุ่นย่อยทั้งหมด ยืนยันหรือไม่?')) {
        setForm({ ...form, variants: [] });
      }
      return;
    }

    // ตรวจสอบว่าทุก Option มี Values
    for (let opt of form.variantOptions) {
      if (opt.values.length === 0) {
        alert(`ตัวเลือก "${opt.name}" ยังไม่มีค่า (เช่น แดง, ดำ) กรุณาใส่ให้ครบก่อนสร้างตาราง`);
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
          className="w-full px-4 py-2 bg-dh-base border border-dh-border rounded-xl text-sm text-dh-main focus:outline-none focus:border-dh-accent transition-colors"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {opt.values.map((v, vIndex) => (
            <span key={vIndex} className="px-3 py-1 bg-dh-accent/10 text-dh-accent border border-dh-accent/20 rounded-lg text-sm flex items-center gap-2">
              {v}
              <button type="button" onClick={() => handleRemoveOptionValue(index, vIndex)} className="hover:text-red-500">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Helper component to fix Lucide import issue in OptionInput
  const X = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );

  return (
    <div className="bg-dh-surface border border-dh-border rounded-2xl overflow-hidden shadow-sm relative group">
      {/* 📘 In-App Documentation Tooltip */}
      <div className="absolute top-4 right-4 z-10 group/tooltip">
        <div className="p-1.5 rounded-full bg-dh-accent/10 text-dh-accent cursor-help">
          <AlertCircle size={18} />
        </div>
        <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-dh-base border border-dh-border rounded-xl shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-sm text-dh-muted z-20">
          <p className="font-bold text-dh-main mb-2">💡 คำแนะนำ: ระบบสินค้าย่อย</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>พิมพ์ชื่อตัวเลือก (เช่น "สี" หรือ "รุ่น") แล้วกด <b>+ เพิ่ม</b></li>
            <li>ในช่องที่โผล่มา ให้พิมพ์ค่า (เช่น "แดง", "ดำ") แล้วกด <b>Enter</b></li>
            <li>เมื่อใส่ครบแล้ว ให้กดปุ่ม <b>สร้างตารางรุ่นย่อย</b> ด้านล่างเพื่อแก้ไขราคาและสต็อกแยกตามชิ้นได้เลย</li>
          </ul>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-dh-border bg-dh-base/50 flex items-center gap-2">
        <Settings size={18} className="text-dh-accent" />
        <h3 className="font-bold text-dh-main">ตัวเลือกสินค้า (Variants)</h3>
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
              className="flex-1 px-4 py-2 bg-dh-base border border-dh-border rounded-xl text-sm text-dh-main focus:outline-none focus:border-dh-accent transition-colors"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-4 py-2 bg-dh-accent text-white rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-dh-accent-hover transition-colors"
            >
              <Plus size={16} /> เพิ่ม
            </button>
          </div>

          {/* Options List */}
          {form.variantOptions && form.variantOptions.length > 0 && (
            <div className="space-y-4 p-4 border border-dh-border rounded-xl bg-dh-base/30">
              {form.variantOptions.map((opt, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 p-3 border border-dh-border rounded-xl bg-dh-surface">
                  <div className="w-full sm:w-1/4 flex justify-between items-center sm:items-start">
                    <span className="font-bold text-dh-main mt-1">{opt.name}</span>
                    <button type="button" onClick={() => handleRemoveOption(index)} className="text-red-500 hover:text-red-600 p-1">
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
                  className="px-4 py-2 bg-dh-main text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-dh-main/90 transition-colors shadow-sm"
                >
                  <RefreshCw size={16} /> สร้างตารางรุ่นย่อย (Generate)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Variants Table */}
        {form.variants && form.variants.length > 0 && (
          <div className="border border-dh-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm text-left text-dh-muted">
              <thead className="text-xs text-dh-main uppercase bg-dh-base/50 border-b border-dh-border">
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
                {form.variants.map((v, index) => (
                  <tr key={index} className="border-b border-dh-border hover:bg-dh-base/30">
                    <td className="px-4 py-3 font-medium text-dh-main">
                      {Object.values(v.attributes).join(' / ')}
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={v.sku || ''} 
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="w-full px-2 py-1.5 bg-dh-base border border-dh-border rounded focus:border-dh-accent outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={v.retailPrice} 
                        onChange={(e) => handleVariantChange(index, 'retailPrice', e.target.value)}
                        className="w-full text-right px-2 py-1.5 bg-dh-base border border-dh-border rounded focus:border-dh-accent outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        value={v.stockQuantity} 
                        onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                        className="w-full text-right px-2 py-1.5 bg-dh-base border border-dh-border rounded focus:border-dh-accent outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={v.isActive} 
                        onChange={(e) => handleVariantChange(index, 'isActive', e.target.checked)}
                        className="cursor-pointer w-4 h-4 rounded border-dh-border text-dh-accent focus:ring-dh-accent"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button type="button" onClick={() => handleRemoveVariant(index)} className="text-red-500 hover:text-red-600">
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
