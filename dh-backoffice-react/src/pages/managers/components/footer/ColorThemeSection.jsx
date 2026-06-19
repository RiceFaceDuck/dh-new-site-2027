import React from 'react';

export default function ColorThemeSection({ footerConfig, handleColorChange }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Color Theme (Tailwind Classes)</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Background Color</label>
                    <input type="text" value={footerConfig.colors.bgDark} onChange={(e) => handleColorChange('bgDark', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Text Muted Color</label>
                    <input type="text" value={footerConfig.colors.textMuted} onChange={(e) => handleColorChange('textMuted', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Primary Accent</label>
                    <input type="text" value={footerConfig.colors.primaryAccent} onChange={(e) => handleColorChange('primaryAccent', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
            </div>
        </div>
    );
}
