import React, { useState } from 'react';
import { LayoutTemplate, ArrowLeft, Layers, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryManager from '../../components/managers/category/CategoryManager';
import FeaturedSettings from '../../components/managers/featured/FeaturedSettings';
import SquadHighlightSettings from '../../components/managers/squad/SquadHighlightSettings';

export default function GlobalCategorySettings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('categories');

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col flex-1">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 rounded-t-2xl z-20">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition-colors shrink-0 shadow-sm border border-emerald-100"
                            title="ย้อนกลับ"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-emerald-800 flex items-center gap-2">
                                <LayoutTemplate size={24} className="text-emerald-600" />
                                จัดการส่วนแสดงผลหน้าแรก
                            </h2>
                            <p className="text-[11px] font-bold text-emerald-600/70 mt-1 uppercase tracking-widest">
                                ตั้งค่าหมวดหมู่ สินค้าแนะนำ และผู้ให้บริการ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-5 pt-3 border-b border-slate-200 bg-slate-50/50 shrink-0 gap-2 overflow-x-auto custom-scrollbar">
                    <button 
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'border-emerald-500 text-emerald-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                    >
                        <Layers size={16} />
                        หมวดหมู่ (Categories)
                    </button>
                    <button 
                        onClick={() => setActiveTab('featured')}
                        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'featured' ? 'border-emerald-500 text-emerald-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                    >
                        <Sparkles size={16} />
                        แผงสินค้าแนะนำ (Featured)
                    </button>
                    <button 
                        onClick={() => setActiveTab('squad')}
                        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'squad' ? 'border-emerald-500 text-emerald-700 bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                    >
                        <Users size={16} />
                        แผงช่างแนะนำ (Squad Highlight)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative bg-slate-50/30 flex flex-col">
                    {activeTab === 'categories' ? (
                        <CategoryManager />
                    ) : activeTab === 'featured' ? (
                        <div className="overflow-y-auto h-full w-full">
                            <FeaturedSettings />
                        </div>
                    ) : (
                        <div className="overflow-y-auto h-full w-full">
                            <SquadHighlightSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
