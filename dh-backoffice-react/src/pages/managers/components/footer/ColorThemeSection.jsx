import React, { useState } from 'react';
import { Palette, SlidersHorizontal, Check } from 'lucide-react';

const PRESETS = [
    {
        id: 'midnight',
        name: 'Midnight Slate',
        tag: 'แนะนำ (มาตรฐาน)',
        desc: 'โทนเทาดำสุขุม สบายตา เหมาะกับระบบไอทียุคใหม่',
        bgDark: 'slate-900',
        textMuted: 'slate-400',
        primaryAccent: 'cyber-blue',
        bgHex: '#0f172a',
        accentHex: '#0ea5e9'
    },
    {
        id: 'obsidian',
        name: 'Obsidian Onyx',
        tag: 'เรียบหรู คลาสสิก',
        desc: 'โทนดำสนิท ลุ่มลึก ไฮไลต์สีทองอำพันพรีเมียม',
        bgDark: 'zinc-900',
        textMuted: 'zinc-400',
        primaryAccent: 'amber-500',
        bgHex: '#18181b',
        accentHex: '#f59e0b'
    },
    {
        id: 'tech_navy',
        name: 'Deep Tech Navy',
        tag: 'มืออาชีพ',
        desc: 'โทนน้ำเงินกรมท่าเข้ม สไตล์องค์กรและวิศวกรรมคอมพิวเตอร์',
        bgDark: 'blue-950',
        textMuted: 'slate-400',
        primaryAccent: 'sky-400',
        bgHex: '#082f49',
        accentHex: '#38bdf8'
    },
    {
        id: 'cyber_emerald',
        name: 'Cyber Emerald',
        tag: 'ช่างเทคนิค',
        desc: 'โทนดาร์กสเปซ ไฮไลต์สีเขียวมรกตนีออน ตัวแทนช่างซ่อมมือโปร',
        bgDark: 'slate-950',
        textMuted: 'slate-400',
        primaryAccent: 'emerald-400',
        bgHex: '#020617',
        accentHex: '#34d399'
    }
];

export default function ColorThemeSection({ footerConfig, handleColorChange, handleApplyColorPreset }) {
    const colors = footerConfig?.colors || {};
    const [showAdvanced, setShowAdvanced] = useState(false);

    const onSelectPreset = (preset) => {
        if (handleApplyColorPreset) {
            handleApplyColorPreset({
                bgDark: preset.bgDark,
                textMuted: preset.textMuted,
                primaryAccent: preset.primaryAccent
            });
        } else {
            handleColorChange('bgDark', preset.bgDark);
            handleColorChange('textMuted', preset.textMuted);
            handleColorChange('primaryAccent', preset.primaryAccent);
        }
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-sky-50 rounded-xl border border-sky-100 text-sky-600 shrink-0">
                        <Palette size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-wide">ธีมสีส่วนล่าง (Color Theme Palette)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">เลือกโทนสีสำเร็จรูปสำหรับ Footer หน้าร้าน สะดวก รวดเร็ว สบายตา ไม่แสบตา</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100/70 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                    <SlidersHorizontal size={13} />
                    <span>{showAdvanced ? 'ซ่อนขั้นสูง' : 'โค้ดสีขั้นสูง'}</span>
                </button>
            </div>

            <div className="space-y-2 pt-0.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRESETS.map((preset) => {
                        const isSelected = colors.bgDark === preset.bgDark && colors.primaryAccent === preset.primaryAccent;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onSelectPreset(preset)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'bg-sky-50/70 border-sky-500 shadow-xs ring-2 ring-sky-500/20'
                                        : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 hover:border-slate-300'
                                }`}
                            >
                                <div
                                    className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-xs border border-white/20 relative overflow-hidden"
                                    style={{ backgroundColor: preset.bgHex }}
                                >
                                    <div
                                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                                        style={{ backgroundColor: preset.accentHex }}
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                                            <Check size={16} className="text-white drop-shadow-md stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800 truncate">{preset.name}</span>
                                        {preset.tag && (
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {preset.tag}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">{preset.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {showAdvanced && (
                <div className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50/80 p-3.5 rounded-xl">
                    <p className="text-[11px] text-slate-500 font-medium">* สำหรับผู้ดูแลระบบที่ต้องการระบุ Tailwind Class หรือรหัส HEX เจาะจง</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Background</label>
                            <input
                                type="text"
                                value={colors.bgDark || ''}
                                onChange={(e) => handleColorChange('bgDark', e.target.value)}
                                placeholder="slate-900"
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs outline-hidden focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Text Muted</label>
                            <input
                                type="text"
                                value={colors.textMuted || ''}
                                onChange={(e) => handleColorChange('textMuted', e.target.value)}
                                placeholder="slate-400"
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs outline-hidden focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Accent</label>
                            <input
                                type="text"
                                value={colors.primaryAccent || ''}
                                onChange={(e) => handleColorChange('primaryAccent', e.target.value)}
                                placeholder="cyber-blue"
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs outline-hidden focus:border-sky-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
