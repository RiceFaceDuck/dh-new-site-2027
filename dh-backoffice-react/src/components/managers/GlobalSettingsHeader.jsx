import React from 'react';
import { Lock, Unlock, ShieldAlert, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSettingsHeader({ 
    title, 
    subtitle = "ระมัดระวังการแก้ไขข้อมูลในส่วนนี้ มีผลกระทบทั้งระบบ", 
    icon: Icon = ShieldAlert,
    onSave, 
    isSaving,
    showSaveButton = true
}) {
    const navigate = useNavigate();

    return (
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 rounded-t-2xl shadow-sm z-20 relative">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                    title="ย้อนกลับ"
                >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Icon size={24} className="text-blue-600" />
                        {title}
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {showSaveButton && (
                    <button 
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 active:scale-95"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} strokeWidth={2.5}/>}
                        บันทึกข้อมูล
                    </button>
                )}
            </div>
        </div>
    );
}
