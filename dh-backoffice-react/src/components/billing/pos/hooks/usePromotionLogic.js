import { useEffect } from 'react';
import { sanitizeNum } from './usePosActions';

/**
 * Hook สำหรับคำนวณและประยุกต์ใช้ Promotion อัตโนมัติในหน้า POS
 */
export const usePromotionLogic = (
    itemSubTotal, 
    activePromotions, 
    activeTab, 
    updateActiveTab, 
    applyPromotionLogic
) => {
    useEffect(() => {
        if (!activeTab) return;

        const now = new Date();
        const getEligible = (promo) => {
            const hasSkus = Array.isArray(promo.applicableSkus) && promo.applicableSkus.length > 0;
            const hasTypes = Array.isArray(promo.applicableTypes) && promo.applicableTypes.length > 0;
            const items = activeTab.items || [];
            if (!hasSkus && !hasTypes) {
                const totalQty = items.reduce((acc, item) => acc + Math.max(1, sanitizeNum(item.qty)), 0);
                return { subtotal: itemSubTotal, qty: totalQty, matched: items.length > 0 };
            }
            let subtotal = 0;
            let qty = 0;
            items.forEach((item) => {
                const itemSku = String(item.sku || '').toUpperCase();
                const itemType = String(item.type || item.category || '').toUpperCase();
                const okSku = hasSkus && promo.applicableSkus.some(s => String(s).toUpperCase() === itemSku);
                const okType = hasTypes && promo.applicableTypes.some(t => String(t).toUpperCase() === itemType);
                if (okSku || okType) {
                    const cleanPrice = Math.max(0, sanitizeNum(item.price));
                    const cleanDiscount = Math.min(cleanPrice, Math.max(0, sanitizeNum(item.discount)));
                    const cleanQty = Math.max(1, sanitizeNum(item.qty));
                    subtotal += (cleanPrice - cleanDiscount) * cleanQty;
                    qty += cleanQty;
                }
            });
            return { subtotal, qty, matched: qty > 0 };
        };

        // กรณีปิด Auto Promo
        if (!activeTab.autoPromoEnabled) {
            // หากมีโปรโมชันที่เลือกแบบ Manual ให้ตรวจสอบว่ายังคงเข้าเกณฑ์หรือไม่
            if (activeTab.appliedPromoDetails) {
                const promo = activeTab.appliedPromoDetails;
                const elig = getEligible(promo);
                let isStillEligible = elig.matched;
                if (promo.startDate && new Date(promo.startDate) > now) isStillEligible = false;
                if (promo.endDate && new Date(promo.endDate) < now) isStillEligible = false;
                if (promo.minSpend > 0 && elig.subtotal < promo.minSpend) isStillEligible = false;
                if (promo.minQty > 0 && elig.qty < promo.minQty) isStillEligible = false;

                if (!isStillEligible) {
                    updateActiveTab({
                        promoDiscount: 0,
                        appliedPromoId: null,
                        appliedPromoDetails: null
                    });
                } else {
                    const newDiscount = applyPromotionLogic(promo, itemSubTotal, activeTab.items);
                    if (newDiscount !== sanitizeNum(activeTab.promoDiscount)) {
                        updateActiveTab({ promoDiscount: newDiscount });
                    }
                }
            }
            return;
        }

        if (!activePromotions || activePromotions.length === 0) {
            if (activeTab.appliedPromoId) {
                updateActiveTab({
                    promoDiscount: 0,
                    appliedPromoId: null,
                    appliedPromoDetails: null
                });
            }
            return;
        }

        let bestPromo = null; 
        let maxDiscount = 0;
        
        activePromotions.forEach(promo => {
            // 1. Check Customer Type
            if (promo.customerType && promo.customerType !== 'ALL') {
                const isCompany = activeTab.customer?.accountName?.includes('บริษัท');
                const impliedRole = activeTab.customer?.role?.toUpperCase() || (isCompany ? 'WHOLESALE' : 'RETAIL');
                if (promo.customerType !== impliedRole && promo.customerType !== activeTab.priceMode?.toUpperCase()) {
                    return;
                }
            }

            // 1.5 Check start/end date
            if (promo.startDate && new Date(promo.startDate) > now) return;
            if (promo.endDate && new Date(promo.endDate) < now) return;

            // 2-4. Check applicable SKUs & Types (case-insensitive) + eligible minSpend & minQty
            const elig = getEligible(promo);
            if (!elig.matched) return;
            if (promo.minSpend > 0 && elig.subtotal < promo.minSpend) return;
            if (promo.minQty > 0 && elig.qty < promo.minQty) return;

            // 5. Check Quota Limit
            if (promo.quotaLimit && promo.quotaLimit > 0) {
                const used = promo.quotaUsed || 0;
                if (used >= promo.quotaLimit) return;
            }

            let discount = applyPromotionLogic(promo, itemSubTotal, activeTab.items);
            if (discount > maxDiscount) { 
                maxDiscount = discount; 
                bestPromo = promo; 
            }
        });

        const currentPromoId = activeTab.appliedPromoId;
        const currentDiscount = sanitizeNum(activeTab.promoDiscount);

        if (bestPromo && maxDiscount > 0) {
            if (bestPromo.id !== currentPromoId || currentDiscount !== maxDiscount) {
                updateActiveTab({ 
                    promoDiscount: maxDiscount, 
                    appliedPromoId: bestPromo.id, 
                    appliedPromoDetails: { ...bestPromo } 
                });
            }
        } else if (currentPromoId) {
            updateActiveTab({ 
                promoDiscount: 0, 
                appliedPromoId: null, 
                appliedPromoDetails: null 
            });
        }
    }, [
        itemSubTotal, 
        activePromotions, 
        activeTab?.autoPromoEnabled, 
        activeTab?.appliedPromoId, 
        activeTab?.promoDiscount, 
        activeTab?.appliedPromoDetails?.id,
        activeTab?.items, 
        activeTab?.customer, 
        activeTab?.priceMode, 
        updateActiveTab,
        applyPromotionLogic
    ]);
};
