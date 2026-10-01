import React from 'react';
import { X, CheckCircle, AlertCircle, Percent, Banknote, ShieldAlert } from 'lucide-react';

export default function PromoModal({ setIsPromoModalOpen, activePromotions, itemSubTotal, activeTab, actions }) {
    const totalQty = (activeTab?.items || []).reduce((acc, item) => acc + (Number(item?.qty) || 1), 0);
    const now = new Date();

    return (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        🏷️ เลือกโปรโมชันในบิล
                    </h2>
                    <button onClick={() => setIsPromoModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors dh-active-press">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-4 max-h-[65vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {activePromotions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-bold">
                            <p className="text-base">ไม่มีโปรโมชันที่กำลังออนไลน์</p>
                            <p className="text-xs text-slate-400 mt-1">สามารถสร้างแคมเปญใหม่ได้ที่เมนู ผู้จัดการ &gt; จัดการโปรโมชั่น</p>
                        </div>
                    ) : (
                        activePromotions.map(promo => {
                            // 1. Check Customer Type
                            let isCustomerEligible = true;
                            if (promo.customerType && promo.customerType !== 'ALL') {
                                const isCompany = activeTab.customer?.accountName?.includes('บริษัท');
                                const impliedRole = activeTab.customer?.role?.toUpperCase() || (isCompany ? 'WHOLESALE' : 'RETAIL');
                                if (promo.customerType !== impliedRole && promo.customerType !== activeTab.priceMode?.toUpperCase()) {
                                    isCustomerEligible = false;
                                }
                            }

                            // 2. Check Date Range
                            const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
                            const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;

                            // 3. Check Quota Limit
                            const isQuotaAvailable = !promo.quotaLimit || (promo.quotaUsed || 0) < promo.quotaLimit;

                            // 4. Check minSpend
                            const isSpendEligible = !promo.minSpend || itemSubTotal >= promo.minSpend;

                            // 5. Check minQty
                            const isQtyEligible = !promo.minQty || totalQty >= promo.minQty;

                            // 6. Check applicable SKUs & Types
                            let isProductEligible = true;
                            if (promo.applicableSkus && promo.applicableSkus.length > 0) {
                                const hasSku = (activeTab.items || []).some(item => {
                                    const itemSku = String(item.sku || item.id || '').trim().toUpperCase();
                                    return promo.applicableSkus.some(s => String(s).trim().toUpperCase() === itemSku);
                                });
                                if (!hasSku) isProductEligible = false;
                            }
                            if (promo.applicableTypes && promo.applicableTypes.length > 0) {
                                const hasType = (activeTab.items || []).some(item => {
                                    const itemType = String(item.type || item.category || '').trim().toUpperCase();
                                    return promo.applicableTypes.some(t => String(t).trim().toUpperCase() === itemType);
                                });
                                if (!hasType) isProductEligible = false;
                            }

                            const isEligible = isCustomerEligible && isStarted && isNotExpired && isQuotaAvailable && isSpendEligible && isQtyEligible && isProductEligible;
                            const isApplied = activeTab.appliedPromoId === promo.id;

                            // Reason for ineligibility badge
                            let ineligibilityReason = '';
                            if (!isNotExpired) ineligibilityReason = 'หมดอายุแล้ว';
                            else if (!isStarted) ineligibilityReason = 'ยังไม่ถึงวันเริ่ม';
                            else if (!isQuotaAvailable) ineligibilityReason = 'สิทธิ์เต็มแล้ว';
                            else if (!isCustomerEligible) ineligibilityReason = promo.customerType === 'VIP' ? 'เฉพาะ VIP' : (promo.customerType === 'WHOLESALE' ? 'เฉพาะลูกค้าส่ง' : 'เฉพาะลูกค้าปลีก');
                            else if (!isSpendEligible) ineligibilityReason = `ยอดขาดอีก ${(promo.minSpend - itemSubTotal).toLocaleString()}฿`;
                            else if (!isQtyEligible) ineligibilityReason = `ขาดอีก ${promo.minQty - totalQty} ชิ้น`;
                            else if (!isProductEligible) ineligibilityReason = 'ไม่มีสินค้าที่ร่วมรายการ';

                            return (
                                <div 
                                    key={promo.id} 
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        isApplied 
                                            ? 'border-fuchsia-500 bg-fuchsia-50/60 dark:bg-fuchsia-950/20' 
                                            : isEligible 
                                                ? 'border-slate-200 dark:border-slate-700 hover:border-fuchsia-400 bg-white dark:bg-slate-800' 
                                                : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-black text-sm ${isApplied ? 'text-fuchsia-700 dark:text-fuchsia-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                    {promo.title}
                                                </h3>
                                                {isApplied && (
                                                    <span className="text-[10px] font-bold text-white bg-fuchsia-600 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                        <CheckCircle size={10} /> ใช้งานอยู่
                                                    </span>
                                                )}
                                                {!isEligible && (
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <AlertCircle size={10} /> {ineligibilityReason}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                {promo.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                                            </p>
                                        </div>
                                        <div className={`font-black text-base shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                                            promo.type === 'PERCENTAGE' 
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' 
                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                        }`}>
                                            {promo.type === 'PERCENTAGE' ? <Percent size={14}/> : <Banknote size={14}/>}
                                            ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex flex-wrap items-center gap-2 text-slate-500">
                                            <span className="font-bold text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                {promo.minSpend > 0 ? `ขั้นต่ำ ${promo.minSpend.toLocaleString()} ฿` : 'ไม่มีขั้นต่ำ'}
                                            </span>
                                            {promo.customerType && promo.customerType !== 'ALL' && (
                                                <span className="font-bold text-[10px] text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 px-2 py-0.5 rounded-md border border-fuchsia-200 dark:border-fuchsia-800">
                                                    {promo.customerType === 'VIP' ? 'เฉพาะ VIP' : promo.customerType}
                                                </span>
                                            )}
                                            {promo.quotaLimit && (
                                                <span className="text-[10px] text-slate-400">
                                                    โควต้า: {promo.quotaUsed || 0}/{promo.quotaLimit}
                                                </span>
                                            )}
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => isEligible ? actions.handleApplyPromotion(promo) : null} 
                                            disabled={!isEligible} 
                                            className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all dh-active-press cursor-pointer ${
                                                isApplied 
                                                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20' 
                                                    : isEligible 
                                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-fuchsia-600 hover:text-white' 
                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {isApplied ? 'ใช้งานอยู่' : isEligible ? 'เลือกโปรนี้' : ineligibilityReason}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
