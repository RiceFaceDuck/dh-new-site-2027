import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';

export default function SaveConfirmationModal({ isOpen, onClose, onConfirm, changes, isSaving, status, errorMessage }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyError = (e) => {
        e.stopPropagation();
        if (!errorMessage) return;
        const textToCopy = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage, null, 2);
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(textToCopy));
        } else {
            fallbackCopy(textToCopy);
        }
    };

    const fallbackCopy = (text) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={24} />
                        ยืนยันการบันทึกการเปลี่ยนแปลง
                    </h2>
                    <button onClick={onClose} disabled={isSaving} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {status === 'error' && errorMessage && (
                        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex flex-col gap-2 animate-in fade-in duration-150">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-rose-800 font-black mb-1">เกิดข้อผิดพลาดในการบันทึก:</div>
                                        <div className="font-mono text-[11px] sm:text-xs text-rose-700 whitespace-pre-wrap break-words select-text bg-rose-100/60 p-2.5 rounded-lg border border-rose-200/60 max-h-40 overflow-y-auto custom-scrollbar">
                                            {errorMessage}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyError}
                                    title="คลิกเพื่อคัดลอกข้อความแจ้งเตือนทั้งหมด"
                                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={13} className="text-emerald-600" />
                                            <span className="text-emerald-700 font-extrabold">คัดลอกแล้ว</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={13} />
                                            <span>คัดลอกข้อความ</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                            <span>บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว</span>
                        </div>
                    )}
                    <p className="text-sm font-bold text-slate-600 mb-4">
                        ตรวจสอบรายการเปลี่ยนแปลงต่อไปนี้ก่อนบันทึก:
                    </p>
                    
                    {changes && changes.length > 0 ? (
                        <div className="space-y-3">
                            {changes.map((change, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                                    <div className="font-bold text-slate-700 mb-1">{change.label}</div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                                        <div className="bg-rose-50 text-rose-600 px-2 py-1 rounded-sm line-through break-all w-full sm:w-auto">
                                            {change.oldVal !== undefined && change.oldVal !== null && change.oldVal !== '' ? String(change.oldVal) : '(ไม่มีค่า)'}
                                        </div>
                                        <span className="text-slate-400 hidden sm:inline">➜</span>
                                        <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-sm font-medium break-all w-full sm:w-auto">
                                            {change.newVal !== undefined && change.newVal !== null && change.newVal !== '' ? String(change.newVal) : '(ไม่มีค่า)'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium border border-blue-100">
                            (ระบบบันทึกโครงสร้างรวม หรือไม่มีการเปลี่ยนแปลงที่ระบุเจาะจงได้)
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0 gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-xs disabled:opacity-50 active:scale-95"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        ยืนยันการบันทึก
                    </button>
                </div>

            </div>
        </div>
    );
}
