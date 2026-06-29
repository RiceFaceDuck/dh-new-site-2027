import React, { useEffect } from 'react';
import { HelpCircle, X, BookOpen, Key, AlertCircle, Lightbulb } from 'lucide-react';

export default function GuideModal({ 
    isOpen, 
    onClose, 
    title = "คู่มือการใช้งาน", 
    icon: Icon = HelpCircle, 
    config,
    extraFooter
}) {
    // ป้องกันการ Scroll ด้านหลังเมื่อ Modal เปิดอยู่
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen || !config) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 dh-glass animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh] border border-slate-200 dark:border-slate-700 dh-hover-lift" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header (Premium Gradient) */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center dh-header-gradient">
                    <h2 className="text-lg font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg shadow-sm border border-white/30">
                            <Icon size={18} className="text-white" />
                        </div>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all dh-active-press"
                    >
                        <X size={20}/>
                    </button>
                </div>
                
                {/* Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* 1. Description Section */}
                    {config.description && (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dh-inner-shadow">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                                <BookOpen size={16} className="text-blue-500" />
                                ตำรา / คำอธิบาย (Description)
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-6" dangerouslySetInnerHTML={{ __html: config.description }} />
                        </div>
                    )}

                    {/* 2. How-to Section */}
                    {config.howTo && config.howTo.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dh-inner-shadow">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Key size={16} className="text-emerald-500" />
                                วิธีการใช้งาน (How-to)
                            </h3>
                            <div className="space-y-4 pl-1">
                                {config.howTo.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 group">
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Tips & Tricks Section */}
                    {config.tips && config.tips.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/30 shadow-sm dh-glow">
                            <h3 className="font-bold text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2">
                                <Lightbulb size={16} className="text-amber-500 animate-pulse" />
                                เทคนิคการใช้งาน (Tips & Tricks)
                            </h3>
                            <ul className="space-y-2 pl-2">
                                {config.tips.map((tip, idx) => (
                                    <li key={idx} className="flex gap-2 items-start text-amber-700/90 dark:text-amber-400/80">
                                        <span className="text-amber-400 dark:text-amber-600 mt-0.5">✦</span>
                                        <span dangerouslySetInnerHTML={{ __html: tip }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 4. Expected Results Section */}
                    {config.expectedResults && (
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                            <h3 className="font-bold text-indigo-800 dark:text-indigo-400 mb-3 flex items-center gap-2">
                                <AlertCircle size={16} className="text-indigo-500" />
                                ตัวอย่างผลลัพธ์ (Expected Results)
                            </h3>
                            <div className="text-indigo-700/80 dark:text-indigo-300/80 pl-6 bg-white dark:bg-slate-800 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50 dh-inner-shadow" dangerouslySetInnerHTML={{ __html: config.expectedResults }} />
                        </div>
                    )}

                    {/* Fallback for legacy format (Support old components) */}
                    {config.sections && config.sections.length > 0 && (
                        <div className="space-y-6">
                            {config.sections.map((sec, idx) => (
                                <section key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">{sec.title}</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        {sec.items.map((item, i) => (
                                            <li key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}

                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {extraFooter}
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all dh-active-press shrink-0"
                    >
                        เข้าใจแล้ว (Got it!)
                    </button>
                </div>
            </div>
        </div>
    );
}
