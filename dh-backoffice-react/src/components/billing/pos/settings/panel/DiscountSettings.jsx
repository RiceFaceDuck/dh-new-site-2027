import React from 'react';
import { Tag, FileText } from 'lucide-react';

export default function DiscountSettings({
    activeTab, updateActiveTab, isProcessing,
    localDiscount, setLocalDiscount,
    localOtherName, setLocalOtherName,
    localOtherAmount, setLocalOtherAmount,
    sectionClass, labelClass, inputClass
}) {
    return (
        <div className={`${sectionClass} grid grid-cols-2 gap-4`}>
            <div>
                <label className={labelClass}><Tag size={12}/> ลดท้ายบิล (฿)</label>
                <input disabled={isProcessing} type="number" min="0" placeholder="0" value={localDiscount} onChange={(e) => setLocalDiscount(e.target.value)} onBlur={() => updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ overallDiscount: parseFloat(localDiscount) || 0 }); }} className={`${inputClass} border-red-200 bg-red-50 text-right text-red-600 font-bold focus:border-red-400 focus:ring-red-500/20`} />
                {/* ✨ คีย์ลัดส่วนลด ล้าง, 50, 100, 500 */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                    <button onClick={() => { setLocalDiscount(''); updateActiveTab({ overallDiscount: 0 }); }} disabled={isProcessing} className="text-[10px] bg-red-100 hover:bg-red-200 border border-red-200 text-red-600 px-2 py-0.5 rounded transition-colors active:scale-95">ล้าง</button>
                    {[50, 100, 500].map(val => (
                        <button key={val} onClick={() => { setLocalDiscount(val); updateActiveTab({ overallDiscount: val }); }} disabled={isProcessing} className="text-[10px] bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors active:scale-95">
                            -{val}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className={labelClass}><FileText size={12}/> ยอดอื่นๆ (+/-)</label>
                <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input disabled={isProcessing} type="text" placeholder="ชื่อ..." value={localOtherName} onChange={(e) => setLocalOtherName(e.target.value)} onBlur={() => updateActiveTab({ otherFeeName: localOtherName })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeName: localOtherName }); }} className="w-1/2 bg-transparent px-3 py-2 text-xs font-medium text-gray-800 outline-none border-r border-gray-200" />
                    <input disabled={isProcessing} type="number" placeholder="0" value={localOtherAmount} onChange={(e) => setLocalOtherAmount(e.target.value)} onBlur={() => updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ otherFeeAmount: parseFloat(localOtherAmount) || 0 }); }} className="w-1/2 bg-transparent px-3 py-2 text-xs text-right font-bold text-gray-800 outline-none" />
                </div>
            </div>
        </div>
    );
}
