import React from 'react';
import { X } from 'lucide-react';

export default function PromoModal({ setIsPromoModalOpen, activePromotions, itemSubTotal, activeTab, actions }) {
    return (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-(--dh-bg-surface) dh-glass border border-(--dh-glass-border) rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden dh-hover-lift">
                <div className="p-4 border-b border-(--dh-border) flex justify-between items-center bg-(--dh-bg-base)">
                    <h2 className="text-sm font-black text-(--dh-text-main) dh-text-glow">โปรโมชันที่มี</h2>
                    <button onClick={() => setIsPromoModalOpen(false)} className="text-(--dh-text-muted) hover:text-rose-500 dh-active-press"><X size={18}/></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {activePromotions.length === 0 ? (<p className="text-center py-6 text-(--dh-text-muted) text-sm font-bold">ไม่มีโปรโมชัน</p>) : (
                        activePromotions.map(promo => {
                            const isEligible = promo.minSpend <= 0 || itemSubTotal >= promo.minSpend;
                            const isApplied = activeTab.appliedPromoId === promo.id;
                            return (
                                <div key={promo.id} className={`p-4 rounded-xl border-2 transition-all ${isApplied ? 'border-(--dh-accent) bg-(--dh-accent-light)' : isEligible ? 'border-(--dh-border) hover:border-(--dh-text-main) bg-(--dh-bg-base) cursor-pointer dh-active-press' : 'border-(--dh-border) bg-(--dh-bg-base) opacity-50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-black text-sm ${isApplied ? 'text-(--dh-accent)' : 'text-(--dh-text-main)'}`}>{promo.title}</h3>
                                            <p className="text-[11px] text-(--dh-text-muted) mt-1 font-bold">{promo.description}</p>
                                        </div>
                                        <div className={`font-black text-lg ${isApplied ? 'text-(--dh-accent)' : 'text-(--dh-text-main)'}`}>ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-(--dh-border)/50">
                                        <p className="text-[10px] text-(--dh-text-muted) font-black uppercase tracking-wider">{promo.minSpend > 0 ? `ขั้นต่ำ ${promo.minSpend.toLocaleString()} ฿` : 'ไม่มีขั้นต่ำ'}</p>
                                        <button onClick={() => isEligible ? actions.handleApplyPromotion(promo) : null} disabled={!isEligible} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-colors dh-active-press ${isApplied ? 'bg-(--dh-accent) text-white shadow-md' : isEligible ? 'bg-(--dh-bg-surface) border border-(--dh-border) text-(--dh-text-main) hover:bg-(--dh-text-main) hover:text-(--dh-bg-surface)' : 'bg-(--dh-bg-base) text-(--dh-text-muted) border border-(--dh-border)'}`}>
                                            {isApplied ? 'ใช้งานอยู่' : isEligible ? 'เลือก' : 'ยอดไม่ถึง'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
