import React from 'react';

export default function WarrantyCategoryCard({ catName, data, updateCategory }) {
    return (
        <div className="p-5 border-2 border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
            <div className="font-black text-slate-800 text-sm border-b-2 border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                {catName}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">เคลมซ่อม (วัน)</label>
                    <div className="relative">
                        <input 
                            type="number" min="0" value={data.claimDays}
                            onChange={(e) => updateCategory(catName, 'claimDays', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all text-center"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">คืนเงิน (วัน)</label>
                    <div className="relative">
                        <input 
                            type="number" min="0" value={data.returnDays}
                            onChange={(e) => updateCategory(catName, 'returnDays', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all text-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
