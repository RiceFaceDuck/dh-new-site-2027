import React, { useState } from 'react';
import { ImageIcon, MonitorPlay } from 'lucide-react';
import ThemeConfigTab from './components/theme/ThemeConfigTab';
import HeroConfigTab from './components/theme/HeroConfigTab';

export default function GlobalThemeSettings() {
    const [activeTab, setActiveTab] = useState('theme');

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 border-b border-slate-200 pb-4">
                <button 
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'theme' ? 'bg-fuchsia-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <ImageIcon size={18} /> ธีมและพื้นหลังหน้าบ้าน
                </button>
                <button 
                    onClick={() => setActiveTab('hero')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'hero' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <MonitorPlay size={18} /> ป้ายโฆษณาหลัก (Hero Banner)
                </button>
            </div>

            {activeTab === 'theme' && <ThemeConfigTab />}
            {activeTab === 'hero' && <HeroConfigTab />}
        </div>
    );
}
