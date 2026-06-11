import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export default function ProductTags({ form, addArrayItem, removeArrayItem }) {
  const [tagInput, setTagInput] = useState('');

  return (
    <div className="bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
      <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1.5 flex items-center gap-1"><Info size={14}/> Tags ค้นหา</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-all shadow-inner">
        {form.tags.map(t => (
          <span key={t} className="bg-dh-accent text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            {t} <X size={10} className="cursor-pointer hover:text-white/70 transition-colors" onClick={() => removeArrayItem('tags', t)}/>
          </span>
        ))}
        <input type="text" placeholder="พิมพ์คำค้นหาแล้วกด Enter..." value={tagInput}
          onChange={e => setTagInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'tags', tagInput, setTagInput)}
          className="flex-1 outline-none text-sm bg-transparent min-w-[150px] font-bold text-dh-main placeholder:text-dh-muted/50" />
      </div>
    </div>
  );
}
