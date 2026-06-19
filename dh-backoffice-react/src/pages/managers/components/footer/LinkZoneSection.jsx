import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function LinkZoneSection({ title, category, links, updateLink, addLink, removeLink }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">{title}</h3>
                <button onClick={() => addLink(category)} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Plus size={18} />
                </button>
            </div>
            <div className="space-y-3">
                {links.map((link, index) => (
                    <div key={link.id} className="flex gap-2 items-center">
                        <GripVertical size={16} className="text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                        <input type="text" value={link.label} onChange={(e) => updateLink(category, index, 'label', e.target.value)} placeholder="Label" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                        <input type="text" value={link.url} onChange={(e) => updateLink(category, index, 'url', e.target.value)} placeholder="URL" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                        <button onClick={() => removeLink(category, index)} className="text-red-400 hover:text-red-600 transition-colors shrink-0 p-1">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
