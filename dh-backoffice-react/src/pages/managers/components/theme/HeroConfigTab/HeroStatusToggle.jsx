import React from 'react';

export default function HeroStatusToggle({ isActive, onChange }) {
    return (
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all dh-hover-lift">
            <div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">เปิดใช้งานป้าย (Active)</h3>
                <p className="text-sm text-slate-500 mt-1">หากปิด ลูกค้าจะเห็นป้ายรูปแบบดั้งเดิม</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}
