import React from 'react';
import { MonitorPlay, Link as LinkIcon } from 'lucide-react';

export default function HeroButtonConfig({ 
    label, 
    link, 
    isActive, 
    onChange, 
    type = 'primary' 
}) {
    const isPrimary = type === 'primary';
    const iconColor = isPrimary ? "text-green-500" : "text-slate-500";
    const title = isPrimary ? "ปุ่มหลัก (สีเหลือง)" : "ปุ่มรอง (สีขาว)";
    const focusColor = isPrimary ? "focus:border-green-500 focus:ring-green-500/20" : "focus:border-slate-500 focus:ring-slate-500/20";
    
    return (
        <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${isActive ? '' : 'opacity-60 grayscale-[50%]'}`}>
            <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <MonitorPlay size={18} className={iconColor} /> {title}
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{isActive ? 'แสดง' : 'ซ่อน'}</span>
                    <input 
                        type="checkbox" 
                        checked={isActive}
                        onChange={(e) => onChange({ label, link, isActive: e.target.checked })}
                        className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 ${isPrimary ? 'accent-green-500' : 'accent-slate-500'} cursor-pointer`}
                    />
                </div>
            </div>
            
            <div className="space-y-3">
                <input 
                    type="text" 
                    value={label} 
                    placeholder={`ข้อความบนปุ่ม (เช่น ${isPrimary ? 'BOOK A SQUAD' : 'SHOP SPARES'})`}
                    onChange={(e) => onChange({ label: e.target.value, link, isActive })}
                    className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all ${focusColor} focus:ring-4 focus:bg-white`}
                    disabled={!isActive}
                />
                
                <div className="flex items-center gap-2 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <LinkIcon size={16} />
                    </div>
                    <input 
                        type="text" 
                        value={link} 
                        placeholder={`ลิงก์ไปหน้า... (เช่น ${isPrimary ? '/squad' : '/category/all'})`}
                        onChange={(e) => onChange({ label, link: e.target.value, isActive })}
                        className={`w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all ${focusColor} focus:ring-4 focus:bg-white`}
                        disabled={!isActive}
                    />
                </div>
            </div>
        </div>
    );
}
