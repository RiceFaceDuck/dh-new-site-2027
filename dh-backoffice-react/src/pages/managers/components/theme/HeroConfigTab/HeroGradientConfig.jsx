import React from 'react';
import { Palette, Droplets } from 'lucide-react';

export default function HeroGradientConfig({ overlay = { color: '#1f2937', opacity: 90 }, onChange }) {
    // Preset colors based on Tailwind equivalents or typical dark overlays
    const presetColors = [
        { label: 'Dark Slate', value: '#1f2937' },
        { label: 'Deep Black', value: '#000000' },
        { label: 'Navy Blue', value: '#1e3a8a' },
        { label: 'Forest Green', value: '#064e3b' },
        { label: 'Rich Purple', value: '#4c1d95' },
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Palette size={18} className="text-pink-500" /> การตั้งค่าไล่เฉดสี (Gradient Overlay)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opacity Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <Droplets size={14} className="text-blue-400" /> ความเข้มของเฉดสี
                        </label>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{overlay.opacity}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={overlay.opacity}
                        onChange={(e) => onChange({ ...overlay, opacity: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                        <span>สว่าง (0%)</span>
                        <span>มืดสนิท (100%)</span>
                    </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: overlay.color }}></div> 
                        สีพื้นหลังเฉดสี (Overlay Color)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {presetColors.map(preset => (
                            <button
                                key={preset.value}
                                onClick={() => onChange({ ...overlay, color: preset.value })}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${overlay.color === preset.value ? 'border-pink-500 scale-110 ring-2 ring-pink-500/20' : 'border-white'}`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.label}
                            />
                        ))}
                        {/* Custom Hex Input */}
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-slate-400">HEX:</span>
                            <input 
                                type="text" 
                                value={overlay.color}
                                onChange={(e) => onChange({ ...overlay, color: e.target.value })}
                                className="w-20 p-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-pink-500 text-center"
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-2 bg-pink-50/50 p-2 rounded-lg border border-pink-100">
                <span className="font-bold text-pink-600">Tip:</span> การไล่เฉดสีจะช่วยให้ข้อความอ่านง่ายขึ้นเมื่อรูปภาพพื้นหลังมีรายละเอียดเยอะหรือมีสีสว่าง แนะนำความเข้มที่ 70-90%
            </p>
        </div>
    );
}
