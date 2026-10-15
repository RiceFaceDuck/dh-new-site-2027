import { useState } from 'react';
import { AlertTriangle, Plus, X, Copy, Check } from 'lucide-react';

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
  const [copiedSku, setCopiedSku] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isModelsExpanded, setIsModelsExpanded] = useState(false);
  const [isPartsExpanded, setIsPartsExpanded] = useState(false);

  const handleCopySku = () => {
    if (form.sku) {
      navigator.clipboard.writeText(form.sku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const getFrontendUrl = (sku) => {
    if (!sku) return '';
    return `https://dh-notebook-frontend.web.app/product/${sku}`;
  };

  const autoUrl = getFrontendUrl(form.sku);
  const displayUrl = form.landingPageUrl || autoUrl;

  const handleCopyUrl = () => {
    if (displayUrl) {
      navigator.clipboard.writeText(displayUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const modelsList = form.compatibleModels || [];
  const partsList = form.compatiblePartNumbers || [];
  const substituteList = form.substituteSkus || [];

  return (
    <div className="flex flex-col gap-4">
      {/* แถวแรก ข้อมูลหลักๆ */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">SKU (รหัสสินค้า) *</label>
              {!!productData && (
                <button 
                  type="button" 
                  onClick={handleCopySku} 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    copiedSku 
                      ? 'bg-emerald-600 text-white border-emerald-700' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {copiedSku ? <Check size={11}/> : <Copy size={11}/>}
                  {copiedSku ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              )}
            </div>
            <div className="relative">
              <input type="text" disabled={!!productData} required value={form.sku} 
                onChange={e => setForm({...form, sku: e.target.value.replace(/\//g, '-').toUpperCase()})}
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden font-bold text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800/50 uppercase" 
                placeholder="เช่น SCR-001" />
            </div>
          </div>
          
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">หมวดหมู่ *</label>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] outline-hidden focus:border-slate-800 dark:focus:border-orange-500 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all cursor-pointer">
                {categories.map(cat => {
                  const val = cat.type || cat.name;
                  return <option key={cat.id || val} value={val}>{cat.name || val}</option>;
                })}
              </select>
              {isManagerOrOwner && (
                <button 
                  type="button" 
                  onClick={handleAddCategory} 
                  className="h-10 w-10 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl border border-slate-900 dark:border-white transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0" 
                  title="เพิ่มหมวดหมู่ใหม่"
                >
                  <Plus size={16} strokeWidth={2.5}/>
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">แบรนด์</label>
            <input type="text" value={form.brand} placeholder="เช่น ASUS, Acer"
              onChange={e => setForm({...form, brand: e.target.value})}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" />
          </div>
          
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">ชื่อสินค้า (รุ่น/ชนิด) *</label>
            <input type="text" required value={form.name} placeholder="ระบุชื่อสินค้าแบบชัดเจน..."
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" />
          </div>
        </div>
      </div>

      {/* ข้อมูลเชื่อมโยง Model & Landing Page URL */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">Model (ที่กำลังขายอยู่)</label>
            <input type="text" value={form.sellingModel} placeholder="เช่น NV156FHM-N48"
              onChange={e => setForm({...form, sellingModel: e.target.value})}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Landing Page URL (เว็บ)</label>
              <button 
                type="button" 
                onClick={handleCopyUrl}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  copiedUrl 
                    ? 'bg-emerald-600 text-white border-emerald-700' 
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                }`}
              >
                {copiedUrl ? <Check size={11}/> : <Copy size={11}/>}
                {copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก URL'}
              </button>
            </div>
            <div className="relative">
              <input type="url" value={displayUrl} readOnly title="คลิกเพื่อคัดลอก URL"
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all cursor-pointer" 
                onClick={handleCopyUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* แผงแท็ก Compatible Models, Part Number, และสินค้าขายแทนกัน */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Compatible Models */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Compatible Models
                {modelsList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-[2px] font-mono font-bold">
                    {modelsList.length}
                  </span>
                )}
              </label>
              {modelsList.length > 3 && (
                <button 
                  type="button" 
                  onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer transition-colors"
                >
                  {isModelsExpanded ? 'ย่อลง ▴' : `ดูทั้งหมด (${modelsList.length}) ▾`}
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">เช่น Acer Swift 3, VivoBook 15</span>
            <div className={`flex flex-wrap content-start gap-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 transition-all shadow-inner custom-scrollbar ${
              isModelsExpanded ? 'min-h-[90px]' : 'h-[90px] overflow-y-auto'
            }`}>
              {modelsList.map(t => (
                <span key={t} className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-[2px] flex items-center gap-1 shadow-xs">
                  {t} 
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('compatibleModels', t)}
                    className="p-0.5 rounded-[2px] hover:bg-red-500/20 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                    title="ลบรายการ"
                  >
                    <X size={11}/>
                  </button>
                </span>
              ))}
              <input type="text" placeholder="พิมพ์รุ่นแล้ว Enter..." value={modelInput}
                onChange={e => setModelInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatibleModels', modelInput, setModelInput)}
                className="flex-1 outline-hidden text-xs bg-transparent min-w-[110px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 py-1" />
            </div>
          </div>

          {/* 2. Compatible Part Number */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Compatible Part Number
                {partsList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-[2px] font-mono font-bold">
                    {partsList.length}
                  </span>
                )}
              </label>
              {partsList.length > 3 && (
                <button 
                  type="button" 
                  onClick={() => setIsPartsExpanded(!isPartsExpanded)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer transition-colors"
                >
                  {isPartsExpanded ? 'ย่อลง ▴' : `ดูทั้งหมด (${partsList.length}) ▾`}
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">เช่น NV156FHM-N48 (พาร์ทโรงงาน)</span>
            <div className={`flex flex-wrap content-start gap-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 transition-all shadow-inner custom-scrollbar ${
              isPartsExpanded ? 'min-h-[90px]' : 'h-[90px] overflow-y-auto'
            }`}>
              {partsList.map(t => (
                <span key={t} className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-[2px] flex items-center gap-1 shadow-xs">
                  {t} 
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('compatiblePartNumbers', t)}
                    className="p-0.5 rounded-[2px] hover:bg-red-500/20 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                    title="ลบรายการ"
                  >
                    <X size={11}/>
                  </button>
                </span>
              ))}
              <input type="text" placeholder="พิมพ์ Part No. แล้ว Enter..." value={partInput}
                onChange={e => setPartInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatiblePartNumbers', partInput, setPartInput)}
                className="flex-1 outline-hidden text-xs bg-transparent min-w-[110px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 py-1" />
            </div>
          </div>
          
          {/* 3. สินค้าขายแทนกัน (SKU) */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12}/> สินค้าขายแทนกัน (SKU)
                {substituteList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-[2px] font-mono font-bold">
                    {substituteList.length}
                  </span>
                )}
              </label>
            </div>
            <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 block mb-1">เช่น SCR-002 (รหัสที่เสนอขายแทนได้)</span>
            <div className="flex flex-wrap content-start gap-1.5 p-2 border border-orange-300 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20 rounded-[2px] h-[90px] overflow-y-auto transition-colors shadow-inner custom-scrollbar">
              {substituteList.map(t => (
                <span key={t} className="bg-orange-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-[2px] flex items-center gap-1 shadow-xs">
                  {t} 
                  <button 
                    type="button" 
                    onClick={() => removeArrayItem('substituteSkus', t)}
                    className="p-0.5 rounded-[2px] hover:bg-orange-700 transition-colors cursor-pointer"
                    title="ลบรายการ"
                  >
                    <X size={11}/>
                  </button>
                </span>
              ))}
              <input type="text" placeholder="พิมพ์ SKU แล้ว Enter..." value={substituteInput}
                onChange={e => setSubstituteInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'substituteSkus', substituteInput, setSubstituteInput)}
                className="flex-1 outline-hidden text-xs bg-transparent min-w-[110px] uppercase font-bold text-orange-600 dark:text-orange-400 placeholder:text-orange-400/60 py-1" />
            </div>
          </div>
        </div>
      </div>

      {/* รายละเอียดสินค้า และ ขนาดแพ็คเกจ */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">Short Description (จุดเด่น)</label>
            <input type="text" value={form.shortDescription} placeholder="คุณสมบัติเด่น 1-2 บรรทัด..."
              onChange={e => setForm({...form, shortDescription: e.target.value})}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" />
          </div>
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">ขนาดแพ็คเกจ (ซม.)</label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">ก</span>
                <input type="number" placeholder="0" value={form.packageSize?.w || ''} onChange={e => setForm({...form, packageSize:{...(form.packageSize || {}), w: e.target.value}})} className="w-full h-10 pl-6 pr-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 rounded-[2px] text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden text-center transition-all" title="ความกว้าง (ซม.)" />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-2 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">ย</span>
                <input type="number" placeholder="0" value={form.packageSize?.l || ''} onChange={e => setForm({...form, packageSize:{...(form.packageSize || {}), l: e.target.value}})} className="w-full h-10 pl-6 pr-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 rounded-[2px] text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden text-center transition-all" title="ความยาว (ซม.)" />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-2 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">ส</span>
                <input type="number" placeholder="0" value={form.packageSize?.h || ''} onChange={e => setForm({...form, packageSize:{...(form.packageSize || {}), h: e.target.value}})} className="w-full h-10 pl-6 pr-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 rounded-[2px] text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden text-center transition-all" title="ความสูง (ซม.)" />
              </div>
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">Full Description (รายละเอียดเชิงลึก)</label>
            <textarea value={form.description || form.fullDescription || ''} placeholder="ลงรายละเอียดสินค้าเพิ่มเติม..."
              onChange={e => setForm({...form, description: e.target.value, fullDescription: e.target.value})}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden resize-none h-[88px] text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all custom-scrollbar" />
          </div>
        </div>
      </div>
    </div>
  );
}
