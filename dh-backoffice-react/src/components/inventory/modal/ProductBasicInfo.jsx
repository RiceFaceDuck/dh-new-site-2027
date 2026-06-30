import React, { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';

export default function ProductBasicInfo({
  form, setForm,
  productData,
  categories,
  isManagerOrOwner,
  handleCategoryChange,
  handleAddCategory,
  addArrayItem,
  removeArrayItem
}) {
  const [modelInput, setModelInput] = useState('');
  const [partInput, setPartInput] = useState('');
  const [substituteInput, setSubstituteInput] = useState('');

  return (
    <div className="flex flex-col gap-4">
      {/* แถวแรก ข้อมูลหลักๆ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">SKU (รหัสสินค้า) *</label>
          <input type="text" disabled={!!productData} required value={form.sku} 
            onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none font-bold text-dh-main placeholder:text-dh-muted/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase" 
            placeholder="เช่น SCR-001" />
        </div>
        
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">หมวดหมู่ *</label>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
              className="w-full p-2.5 border border-dh-border rounded-xl outline-none focus:border-dh-accent bg-dh-base focus:bg-dh-surface text-sm font-bold text-dh-main transition-all cursor-pointer">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {isManagerOrOwner && (
              <button type="button" onClick={handleAddCategory} className="bg-dh-base border border-dh-border text-dh-muted px-3 rounded-xl hover:bg-dh-surface hover:text-dh-accent transition-colors shadow-sm" title="เพิ่มหมวดหมู่ใหม่">
                <Plus size={16}/>
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">แบรนด์</label>
          <input type="text" value={form.brand} placeholder="เช่น ASUS, Acer"
            onChange={e => setForm({...form, brand: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>
        
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ชื่อสินค้า (รุ่น/ชนิด) *</label>
          <input type="text" required value={form.name} placeholder="ระบุชื่อสินค้าแบบชัดเจน..."
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>
      </div>

      {/* ข้อมูลเชื่อมโยง */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
        <div>
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Model (ที่กำลังขายอยู่)</label>
          <input type="text" value={form.sellingModel} placeholder="เช่น NV156FHM-N48"
            onChange={e => setForm({...form, sellingModel: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Landing Page URL (เว็บ)</label>
          <input type="url" value={form.landingPageUrl} placeholder="https://www.dhnotebook.com/..."
            onChange={e => setForm({...form, landingPageUrl: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
        <div>
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Compatible Models</label>
          <span className="text-[9px] text-dh-muted/70 block mb-1">เช่น Acer Swift 3, Asus VivoBook 15 (ชื่อรุ่นของโน้ตบุ๊ก)</span>
          <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-colors shadow-inner">
            {form.compatibleModels.map(t => (
              <span key={t} className="bg-dh-surface border border-dh-border text-dh-main text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                {t} <X size={10} className="cursor-pointer text-dh-muted hover:text-red-500 transition-colors" onClick={() => removeArrayItem('compatibleModels', t)}/>
              </span>
            ))}
            <input type="text" placeholder="พิมพ์รุ่นแล้วกด Enter..." value={modelInput}
              onChange={e => setModelInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatibleModels', modelInput, setModelInput)}
              className="flex-1 outline-none text-xs bg-transparent min-w-[100px] text-dh-main placeholder:text-dh-muted/50" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Compatible Part Number</label>
          <span className="text-[9px] text-dh-muted/70 block mb-1">เช่น NV156FHM-N48 (รหัสพาร์ทอะไหล่ของโรงงาน)</span>
          <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-colors shadow-inner">
            {form.compatiblePartNumbers.map(t => (
              <span key={t} className="bg-dh-surface border border-dh-border text-dh-main text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                {t} <X size={10} className="cursor-pointer text-dh-muted hover:text-red-500 transition-colors" onClick={() => removeArrayItem('compatiblePartNumbers', t)}/>
              </span>
            ))}
            <input type="text" placeholder="พิมพ์ Part No. แล้ว Enter..." value={partInput}
              onChange={e => setPartInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatiblePartNumbers', partInput, setPartInput)}
              className="flex-1 outline-none text-xs bg-transparent min-w-[100px] text-dh-main placeholder:text-dh-muted/50" />
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle size={12}/> สินค้าขายแทนกัน (SKU)</label>
          <span className="text-[9px] text-orange-500/70 block mb-1">เช่น SCR-002 (รหัส SKU ของร้านเราที่สามารถเสนอขายแทนได้)</span>
          <div className="flex flex-wrap gap-1.5 p-2 border border-orange-500/30 bg-orange-500/5 rounded-xl min-h-[44px] focus-within:border-orange-500 transition-colors shadow-inner">
            {form.substituteSkus.map(t => (
              <span key={t} className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                {t} <X size={10} className="cursor-pointer hover:text-orange-200 transition-colors" onClick={() => removeArrayItem('substituteSkus', t)}/>
              </span>
            ))}
            <input type="text" placeholder="พิมพ์ SKU แล้ว Enter..." value={substituteInput}
              onChange={e => setSubstituteInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'substituteSkus', substituteInput, setSubstituteInput)}
              className="flex-1 outline-none text-xs bg-transparent min-w-[100px] uppercase font-bold text-orange-600 dark:text-orange-400 placeholder:text-orange-500/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Short Description (จุดเด่น)</label>
          <input type="text" value={form.shortDescription} placeholder="คุณสมบัติเด่น 1-2 บรรทัด..."
            onChange={e => setForm({...form, shortDescription: e.target.value})}
            className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ขนาดแพ็คเกจ (ซม.)</label>
          <div className="flex gap-1.5">
            <input type="number" placeholder="ก" value={form.packageSize?.w || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, w: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
            <input type="number" placeholder="ย" value={form.packageSize?.l || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, l: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
            <input type="number" placeholder="ส" value={form.packageSize?.h || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, h: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
          </div>
        </div>
        <div className="md:col-span-4 mt-2">
          <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Full Description (รายละเอียดเชิงลึก)</label>
          <textarea value={form.description} placeholder="ลงรายละเอียดสินค้าเพิ่มเติม..."
            onChange={e => setForm({...form, description: e.target.value})}
            className="w-full p-3 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none resize-none h-[88px] text-sm font-medium text-dh-main placeholder:text-dh-muted/50 transition-all custom-scrollbar" />
        </div>
      </div>
    </div>
  );
}
