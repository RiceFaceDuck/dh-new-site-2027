import { useState } from 'react';
import { Info, X } from 'lucide-react';

export default function ProductTags({ form, addArrayItem, removeArrayItem }) {
  const [tagInput, setTagInput] = useState('');

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info size={14}/> Tags ค้นหา</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-[2px] min-h-[44px] bg-white dark:bg-slate-900 focus-within:border-slate-800 dark:focus-within:border-orange-500 transition-all shadow-inner">
        {(form.tags || []).map(t => (
          <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-[2px] flex items-center gap-1.5 shadow-xs border border-slate-300 dark:border-slate-600">
            {t} 
            <button 
              type="button" 
              onClick={() => removeArrayItem('tags', t)}
              className="p-0.5 rounded-[2px] hover:bg-red-500/20 hover:text-red-600 text-slate-400 transition-colors cursor-pointer"
              title="ลบแท็ก"
            >
              <X size={12}/>
            </button>
          </span>
        ))}
        <input type="text" placeholder="พิมพ์คำค้นหาแล้วกด Enter..." value={tagInput}
          onChange={e => setTagInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'tags', tagInput, setTagInput)}
          className="flex-1 outline-hidden text-sm bg-transparent min-w-[150px] font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 py-1" />
      </div>
    </div>
  );
}
