
import { Sparkles, ShieldCheck, Trash2 } from 'lucide-react';

export default function WarrantyCategoryCard({ catName, data, updateCategory, removeCategory }) {
    const isUnconfigured = data?.isUnconfigured;

    return (
        <div className={`p-5 rounded-2xl bg-white shadow-xs transition-all flex flex-col gap-4 relative overflow-hidden ${
            isUnconfigured 
                ? 'border-2 border-amber-400/80 bg-amber-50/20 shadow-amber-100 ring-2 ring-amber-400/20' 
                : 'border-2 border-slate-200 hover:border-slate-300 hover:shadow-md'
        }`}>
            {isUnconfigured && (
                <div className="absolute top-0 right-0 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-2xs flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={10} className="animate-spin" /> หมวดหมู่ใหม่
                </div>
            )}

            <div className="font-black text-slate-800 text-sm border-b-2 border-slate-100 pb-3 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2 pr-12">
                    <div className={`w-2.5 h-2.5 rounded-full ${isUnconfigured ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></div>
                    <span className="truncate">{catName}</span>
                </div>
                {removeCategory && (
                    <button
                        type="button"
                        onClick={() => removeCategory(catName)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="ลบการ์ดตั้งค่าหมวดหมู่นี้"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={11} className="text-amber-500" /> เคลมซ่อม (วัน)
                    </label>
                    <div className="relative">
                        <input 
                            type="number" min="0" value={data.claimDays ?? 30}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                                updateCategory(catName, 'claimDays', val === '' ? 0 : val);
                            }}
                            className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-hidden focus:border-amber-500 focus:bg-white transition-all text-center"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={11} className="text-blue-500" /> คืนเงิน (วัน)
                    </label>
                    <div className="relative">
                        <input 
                            type="number" min="0" value={data.returnDays ?? 7}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                                updateCategory(catName, 'returnDays', val === '' ? 0 : val);
                            }}
                            className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white transition-all text-center"
                        />
                    </div>
                </div>

                {data.returnDays > data.claimDays && (
                    <div className="col-span-2 text-[10px] text-rose-500 font-bold bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-center">
                        ⚠️ วันคืนเงิน ({data.returnDays} วัน) นานกว่าวันเคลม ({data.claimDays} วัน)
                    </div>
                )}
                {data.claimDays === 0 && (
                    <div className="col-span-2 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-center">
                        ⚠️ ตั้งค่าเคลมซ่อมเป็น 0 วัน (ไม่มีประกันเคลม)
                    </div>
                )}
            </div>
        </div>
    );
}
