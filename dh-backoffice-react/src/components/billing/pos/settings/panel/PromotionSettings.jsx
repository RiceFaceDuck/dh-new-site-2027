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
                <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200 shadow-sm rounded-lg p-3 flex flex-col mt-3 animate-in slide-in-from-bottom-2 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-fuchsia-100 rounded-full opacity-50"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-[12px] font-black text-fuchsia-700 flex items-center gap-1.5 truncate pr-2">
                            <div className="bg-fuchsia-600 text-white p-0.5 rounded-full shrink-0 shadow-sm"><Check size={10} /></div>
                            {activeTab.appliedPromoDetails.title}
                        </span>
                        <button disabled={isProcessing} onClick={handleRemovePromotion} className="p-1 hover:bg-fuchsia-200 text-fuchsia-500 rounded transition-colors shrink-0"><X size={14}/></button>
                    </div>
                    <div className="mt-1.5 relative z-10">
                        <p className="text-[10px] font-medium text-fuchsia-600 leading-tight">
                            {activeTab.autoPromoEnabled ? "✨ ระบบเลือกโปรโมชันที่ลดเยอะที่สุดให้อัตโนมัติ" : "🎯 พนักงานเลือกโปรโมชันนี้"}
                        </p>
                        {activeTab.appliedPromoDetails.minSpend > 0 && (
                            <p className="text-[9px] font-bold text-fuchsia-500/80 mt-0.5 border-l-2 border-fuchsia-300 pl-1">
                                ปลดล็อคจากยอดซื้อ {activeTab.appliedPromoDetails.minSpend.toLocaleString()} บาทขึ้นไป
                            </p>
                        )}
                        {activeTab.appliedPromoDetails.applicableSkus?.length > 0 && (
                            <p className="text-[9px] font-bold text-fuchsia-500/80 mt-0.5 border-l-2 border-fuchsia-300 pl-1">
                                ปลดล็อคเฉพาะสินค้า: {activeTab.appliedPromoDetails.applicableSkus.join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            {/* ของแถม */}
            {eligibleFreebies && eligibleFreebies.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 shadow-sm rounded-lg p-3 mt-3 animate-in slide-in-from-bottom-2">
                    <span className="text-[11px] font-black text-rose-700 mb-2 flex items-center gap-1.5">
                        <span className="text-[14px]">🎁</span> ได้รับของแถม:
                    </span>
                    <div className="flex flex-col gap-1.5">
                        {eligibleFreebies.map(f => (
                            <div key={f.id} className="flex flex-col bg-white/80 p-2 rounded-md border border-rose-100 shadow-sm">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-rose-600 truncate flex-1 pr-2">{f.itemName}</span>
                                    <span className="font-black text-rose-700 bg-rose-200/50 px-2 py-0.5 rounded-full">x{f.qty}</span>
                                </div>
                                <div className="mt-1 flex flex-col gap-0.5">
                                    <p className="text-[9px] font-medium text-rose-500/80">
                                        ได้รับเพราะ {f.minSpend > 0 ? `ยอดซื้อถึง ${f.minSpend.toLocaleString()} บาท` : "เงื่อนไขเข้าเกณฑ์"}
                                        {f.minQty > 0 ? ` และครบ ${f.minQty} ชิ้น` : ""}
                                    </p>
                                    {f.applicableSkus?.length > 0 && (
                                        <p className="text-[8px] font-bold text-rose-400">
                                            *(เฉพาะสินค้า: {f.applicableSkus.join(', ')})
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
