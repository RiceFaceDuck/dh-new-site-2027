import React from 'react';
import { LayoutTemplate, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryManager from '../../components/managers/category/CategoryManager';

export default function GlobalCategorySettings() {
    const navigate = useNavigate();

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
                                จัดการหมวดหมู่หน้าแรก
                            </h2>
                            <p className="text-[11px] font-bold text-emerald-600/70 mt-1 uppercase tracking-widest">
                                ลากวางเพื่อเรียงลำดับ ซ่อน/แสดงหมวดหมู่ (บันทึกอัตโนมัติ)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative bg-slate-50/30 flex flex-col">
                    <CategoryManager />
                </div>
            </div>
        </div>
    );
}
