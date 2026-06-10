import React from 'react';
import { X } from 'lucide-react';

export default function PromoModal({ setIsPromoModalOpen, activePromotions, itemSubTotal, activeTab, actions }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[var(--dh-bg-surface)] dh-glass border border-[var(--dh-glass-border)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden dh-hover-lift">
                <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)]">
                    <h2 className="text-sm font-black text-[var(--dh-text-main)] dh-text-glow">โปรโมชันที่มี</h2>
                    <button onClick={() => setIsPromoModalOpen(false)} className="text-[var(--dh-text-muted)] hover:text-rose-500 dh-active-press"><X size={18}/></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {activePromotions.length === 0 ? (<p className="text-center py-6 text-[var(--dh-text-muted)] text-sm font-bold">ไม่มีโปรโมชัน</p>) : (
                        activePromotions.map(promo => {
                            const isEligible = promo.minSpend <= 0 || itemSubTotal >= promo.minSpend;
                            const isApplied = activeTab.appliedPromoId === promo.id;
                            return (
                                <div key={promo.id} className={`p-4 rounded-xl border-2 transition-all ${isApplied ? 'border-[var(--dh-accent)] bg-[var(--dh-accent-light)]' : isEligible ? 'border-[var(--dh-border)] hover:border-[var(--dh-text-main)] bg-[var(--dh-bg-base)] cursor-pointer dh-active-press' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-black text-sm ${isApplied ? 'text-[var(--dh-accent)]' : 'text-[var(--dh-text-main)]'}`}>{promo.title}</h3>
                                            <p className="text-[11px] text-[var(--dh-text-muted)] mt-1 font-bold">{promo.description}</p>
                                        </div>
                                        <div className={`font-black text-lg ${isApplied ? 'text-[var(--dh-accent)]' : 'text-[var(--dh-text-main)]'}`}>ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--dh-border)]/50">
                                        <p className="text-[10px] text-[var(--dh-text-muted)] font-black uppercase tracking-wider">{promo.minSpend > 0 ? `ขั้นต่ำ ${promo.minSpend.toLocaleString()} ฿` : 'ไม่มีขั้นต่ำ'}</p>
                                        <button onClick={() => isEligible ? actions.handleApplyPromotion(promo) : null} disabled={!isEligible} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-colors dh-active-press ${isApplied ? 'bg-[var(--dh-accent)] text-white shadow-md' : isEligible ? 'bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] hover:bg-[var(--dh-text-main)] hover:text-[var(--dh-bg-surface)]' : 'bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] border border-[var(--dh-border)]'}`}>
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
