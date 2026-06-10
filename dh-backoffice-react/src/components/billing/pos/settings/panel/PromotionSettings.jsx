import React from 'react';
import { Megaphone, Check, X } from 'lucide-react';

export default function PromotionSettings({
    activeTab, updateActiveTab, isProcessing,
    setIsPromoModalOpen, handleRemovePromotion, eligibleFreebies,
    sectionClass, labelClass
}) {
    return (
        <div className={sectionClass}>
            <div className="flex items-center justify-between mb-2.5">
                <label className={`${labelClass} text-fuchsia-600`}><Megaphone size={12}/> โปรโมชันและของแถม</label>
                <button disabled={isProcessing} onClick={() => setIsPromoModalOpen(true)} className="bg-white border border-fuchsia-300 hover:bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2.5 py-1 rounded transition-colors">เลือกโปร</button>
            </div>
            
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 bg-white p-2.5 rounded border border-gray-200 cursor-pointer hover:border-fuchsia-300 transition-colors">
                <input disabled={isProcessing} type="checkbox" checked={activeTab.autoPromoEnabled} onChange={(e) => updateActiveTab({ autoPromoEnabled: e.target.checked })} className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 bg-white cursor-pointer" />
                รับโปรโมชันคุ้มสุดอัตโนมัติ
            </label>

            {activeTab.appliedPromoDetails && (
                <div className="bg-fuchsia-50 border border-fuchsia-200 rounded p-2.5 flex items-center justify-between mt-2 animate-in slide-in-from-bottom-2">
                    <span className="text-[11px] font-bold text-fuchsia-700 flex items-center gap-1.5 truncate pr-2">
                        <div className="bg-fuchsia-200 p-0.5 rounded-full shrink-0"><Check size={10} className="text-fuchsia-700"/></div>
                        {activeTab.appliedPromoDetails.title}
                    </span>
                    <button disabled={isProcessing} onClick={handleRemovePromotion} className="p-1 hover:bg-fuchsia-200 text-fuchsia-500 rounded transition-colors shrink-0"><X size={12}/></button>
                </div>
            )}
            
            {/* ของแถม */}
            {eligibleFreebies && eligibleFreebies.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded p-2.5 mt-2 animate-in slide-in-from-bottom-2">
                    <span className="text-[10px] font-black text-rose-700 uppercase mb-1.5 block">ได้รับของแถม:</span>
                    <div className="flex flex-col gap-1.5">
                        {eligibleFreebies.map(f => (
                            <div key={f.id} className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-rose-600 truncate">{f.itemName}</span>
                                <span className="font-black text-rose-700 bg-rose-100 px-1.5 rounded">x{f.qty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
