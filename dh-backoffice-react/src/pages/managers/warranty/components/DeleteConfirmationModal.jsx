import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, type, targetId }) {
    if (!isOpen) return null;

    const isCategory = type === 'category';
    const title = isCategory 
        ? `ยืนยันการลบการ์ดประกันหมวด "${targetId}"?` 
        : `ยืนยันการลบประกันพิเศษ SKU "${targetId}"?`;
    const description = isCategory
        ? 'การลบการ์ดนี้จะทำให้สินค้าในหมวดหมู่นี้ใช้การรับประกันทั่วไป (General: เคลม 30 วัน / คืน 7 วัน) แทน'
        : 'การลบ SKU นี้จะทำให้สินค้ากลับไปใช้การรับประกันตามหมวดหมู่หลักแทน';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800">{title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
                    >
                        ยืนยันการลบ
                    </button>
                </div>
            </div>
        </div>
    );
}
