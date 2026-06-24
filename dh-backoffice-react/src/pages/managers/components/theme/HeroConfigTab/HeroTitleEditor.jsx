import React from 'react';
import { Type, Plus, Trash2, ArrowUp, ArrowDown, Monitor, Smartphone, Bold, Italic, Underline, Strikethrough } from 'lucide-react';

export default function HeroTitleEditor({ titleSegments = [], onChange }) {
    
    const handleAdd = () => {
        onChange([...titleSegments, { text: '', color: '', breakDesktop: false, breakAll: false }]);
    };

    const handleRemove = (index) => {
        onChange(titleSegments.filter((_, i) => i !== index));
    };

    const handleMove = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === titleSegments.length - 1)) return;
        const newSegments = [...titleSegments];
        const temp = newSegments[index];
        newSegments[index] = newSegments[index + direction];
        newSegments[index + direction] = temp;
        onChange(newSegments);
    };

    const updateSegment = (index, field, value) => {
        const newSegments = [...titleSegments];
        newSegments[index] = { ...newSegments[index], [field]: value };
        // If breakAll is true, ensure breakDesktop is false to avoid confusion, though our compiler handles it.
        if (field === 'breakAll' && value === true) newSegments[index].breakDesktop = false;
        if (field === 'breakDesktop' && value === true) newSegments[index].breakAll = false;
        onChange(newSegments);
    };

    // Compile preview HTML locally just for display purposes
    const previewHtml = titleSegments.map(seg => {
        let html = seg.text;
        
        let classes = [];
        if (seg.isBold) classes.push('font-black');
        if (seg.isItalic) classes.push('italic');
        if (seg.isUnderline) classes.push('underline');
        if (seg.isStrikethrough) classes.push('line-through');
        
        const color = seg.color || (seg.isHighlight ? '#facc15' : '');
        const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
        const styleStr = color ? ` style="color: ${color}"` : '';
        
        if (classStr || styleStr) {
            html = `<span${classStr}${styleStr}>${html}</span>`;
        }
        
        if (seg.breakAll) html += `<br />`;
        else if (seg.breakDesktop) html += `<br class="hidden md:block" />`;
        return html;
    }).join(' ');

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Type size={18} className="text-yellow-500" /> สร้างข้อความหลัก (Text Builder)
                </label>
                <button 
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus size={14} /> เพิ่มท่อนข้อความ
                </button>
            </div>

            <div className="space-y-3 mb-6">
                {titleSegments.map((segment, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                        
                        {/* Order Controls */}
                        <div className="flex sm:flex-col gap-1">
                            <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors">
                                <ArrowUp size={14} />
                            </button>
                            <button onClick={() => handleMove(index, 1)} disabled={index === titleSegments.length - 1} className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors">
                                <ArrowDown size={14} />
                            </button>
                        </div>

                        {/* Text Input */}
                        <input 
                            type="text" 
                            value={segment.text} 
                            onChange={(e) => updateSegment(index, 'text', e.target.value)}
                            placeholder="พิมพ์ข้อความที่นี่..."
                            className="flex-1 w-full p-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                        />

                        {/* Formatting Controls */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {/* Color Picker */}
                            <div className="relative flex items-center group/color">
                                <label 
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer hover:bg-slate-100 ${segment.color || segment.isHighlight ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                >
                                    <div 
                                        className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                                        style={{ backgroundColor: segment.color || (segment.isHighlight ? '#facc15' : '#ffffff') }}
                                    ></div>
                                    <span className="text-slate-600 truncate max-w-[60px]">{segment.color || (segment.isHighlight ? '#facc15' : 'สีปกติ')}</span>
                                    <input 
                                        type="color" 
                                        value={segment.color || (segment.isHighlight ? '#facc15' : '#ffffff')}
                                        onChange={(e) => {
                                            const newSegments = [...titleSegments];
                                            newSegments[index] = { ...newSegments[index], color: e.target.value, isHighlight: false };
                                            onChange(newSegments);
                                        }}
                                        className="absolute opacity-0 w-0 h-0"
                                    />
                                </label>
                                { /* Clear Color Button */ }
                                {(segment.color || segment.isHighlight) && (
                                    <button 
                                        onClick={() => {
                                            const newSegments = [...titleSegments];
                                            newSegments[index] = { ...newSegments[index], color: '', isHighlight: false };
                                            onChange(newSegments);
                                        }}
                                        title="คืนค่าสีเป็นสีขาวปกติ"
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/color:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Text Formats */}
                            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                    onClick={() => updateSegment(index, 'isBold', !segment.isBold)}
                                    title="ตัวหนา"
                                    className={`p-1.5 rounded-md transition-all ${segment.isBold ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Bold size={14} />
                                </button>
                                <button
                                    onClick={() => updateSegment(index, 'isItalic', !segment.isItalic)}
                                    title="ตัวเอียง"
                                    className={`p-1.5 rounded-md transition-all ${segment.isItalic ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Italic size={14} />
                                </button>
                                <button
                                    onClick={() => updateSegment(index, 'isUnderline', !segment.isUnderline)}
                                    title="ขีดเส้นใต้"
                                    className={`p-1.5 rounded-md transition-all ${segment.isUnderline ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Underline size={14} />
                                </button>
                                <button
                                    onClick={() => updateSegment(index, 'isStrikethrough', !segment.isStrikethrough)}
                                    title="ขีดทับ"
                                    className={`p-1.5 rounded-md transition-all ${segment.isStrikethrough ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Strikethrough size={14} />
                                </button>
                            </div>

                            {/* Break Line Toggles */}
                            <div className="flex bg-slate-200 rounded-lg p-0.5">
                                <button
                                    onClick={() => updateSegment(index, 'breakDesktop', !segment.breakDesktop)}
                                    title="ขึ้นบรรทัดใหม่เฉพาะจอคอม (Desktop)"
                                    className={`p-1.5 rounded-md transition-all ${segment.breakDesktop ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Monitor size={14} />
                                </button>
                                <button
                                    onClick={() => updateSegment(index, 'breakAll', !segment.breakAll)}
                                    title="ขึ้นบรรทัดใหม่ทุกจอ (Mobile & Desktop)"
                                    className={`p-1.5 rounded-md transition-all ${segment.breakAll ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Smartphone size={14} />
                                </button>
                            </div>

                            {/* Remove */}
                            <button 
                                onClick={() => handleRemove(index)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {titleSegments.length === 0 && (
                    <div className="text-center p-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                        ยังไม่มีข้อความ กดปุ่ม "เพิ่มท่อนข้อความ" ด้านบน
                    </div>
                )}
            </div>
        </div>
    );
}
