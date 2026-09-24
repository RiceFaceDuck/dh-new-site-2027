import { Tag, FileText } from 'lucide-react';

export default function DiscountSettings({
    activeTab, updateActiveTab, isProcessing,
    localDiscount, setLocalDiscount,
    localOtherName, setLocalOtherName,
    localOtherAmount, setLocalOtherAmount,
    sectionClass, labelClass
}) {
    const discountType = activeTab?.overallDiscountType || 'BAHT';
    const isPercent = discountType === 'PERCENT';

    const itemSubTotal = activeTab?.items?.reduce((sum, item) => {
        const p = Number(item.price) || 0;
        const d = Number(item.discount) || 0;
        const q = Math.max(1, Number(item.qty) || 1);
        return sum + ((p - d) * q);
    }, 0) || 0;

    const calcDiscountBaht = isPercent 
        ? Math.round(itemSubTotal * ((parseFloat(localDiscount) || 0) / 100))
        : (parseFloat(localDiscount) || 0);

    return (
        <div className={`${sectionClass} grid grid-cols-2 gap-3`}>
            {/* Left: ลดท้ายบิล */}
            <div>
                <div className="flex items-center justify-between h-6 mb-1.5">
                    <label className={labelClass || "text-xs font-bold text-white/90 mb-1 flex items-center gap-1.5 uppercase tracking-wider"}>
                        <Tag size={12} className="text-rose-500"/> ลดท้ายบิล
                    </label>
                    <div className="inline-flex rounded-none rounded-tr-md p-0.5 bg-slate-200/80 border border-slate-300 text-[10px] font-black">
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => updateActiveTab({ overallDiscountType: 'BAHT' })}
                            className={`px-1.5 py-0.5 rounded-none rounded-tr-xs transition-all cursor-pointer ${!isPercent ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900 font-bold'}`}
                        >
                            ฿
                        </button>
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => updateActiveTab({ overallDiscountType: 'PERCENT' })}
                            className={`px-1.5 py-0.5 rounded-none rounded-tr-xs transition-all cursor-pointer ${isPercent ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900 font-bold'}`}
                        >
                            %
                        </button>
                    </div>
                </div>

                <div className="h-9 relative flex items-center">
                    <input 
                        disabled={isProcessing} 
                        type="number" 
                        min="0" 
                        max={isPercent ? "100" : undefined}
                        placeholder={isPercent ? "0 %" : "0 ฿"} 
                        value={localDiscount} 
                        onChange={(e) => setLocalDiscount(e.target.value)} 
                        onBlur={() => updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0, overallDiscountType: discountType })} 
                        onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0, overallDiscountType: discountType }); }} 
                        className="w-full h-full bg-white border border-gray-300 rounded-none rounded-tr-md px-3 text-right text-xs font-black text-rose-600 outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500/20 shadow-xs placeholder-gray-400" 
                    />
                </div>

                {isPercent && parseFloat(localDiscount) > 0 && itemSubTotal > 0 && (
                    <div className="text-[9px] text-rose-600 font-extrabold text-right mt-1">
                        (ลดจริง -฿{calcDiscountBaht.toLocaleString()})
                    </div>
                )}
            </div>

            {/* Right: ยอดอื่นๆ (+/-) */}
            <div>
                <div className="flex items-center justify-between h-6 mb-1.5">
                    <label className={labelClass || "text-xs font-bold text-white/90 mb-1 flex items-center gap-1.5 uppercase tracking-wider"}>
                        <FileText size={12} className="text-indigo-400"/> ยอดอื่นๆ (+/-)
                    </label>
                </div>

                <div className="h-9 flex bg-white rounded-none rounded-tr-md border border-gray-300 overflow-hidden shadow-xs focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                    <input 
                        disabled={isProcessing} 
                        type="text" 
                        placeholder="ชื่อรายการ..." 
                        value={localOtherName} 
                        onChange={(e) => setLocalOtherName(e.target.value)} 
                        onBlur={() => updateActiveTab({ otherFeeName: localOtherName })} 
                        onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeName: localOtherName }); }} 
                        className="w-1/2 h-full bg-transparent px-2.5 text-xs font-semibold text-slate-800 outline-hidden border-r border-gray-200 placeholder-gray-400" 
                    />
                    <input 
                        disabled={isProcessing} 
                        type="number" 
                        placeholder="0" 
                        value={localOtherAmount} 
                        onChange={(e) => setLocalOtherAmount(e.target.value)} 
                        onBlur={() => updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 })} 
                        onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 }); }} 
                        className="w-1/2 h-full bg-transparent px-2.5 text-xs text-right font-black text-slate-900 outline-hidden placeholder-gray-400" 
                    />
                </div>
            </div>
        </div>
    );
}
