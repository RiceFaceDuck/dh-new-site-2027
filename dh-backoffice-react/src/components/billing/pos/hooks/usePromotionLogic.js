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
        if (!activeTab || activePromotions.length === 0) return;
        if (!activeTab.autoPromoEnabled) return; 

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

            // 2. Check minSpend
            if (promo.minSpend > 0 && itemSubTotal < promo.minSpend) return;

            // 3. Check minQty
            if (promo.minQty > 0) {
                const totalQty = activeTab.items.reduce((acc, item) => acc + sanitizeNum(item.qty), 0);
                if (totalQty < promo.minQty) return;
            }

            // 4. Check applicable SKUs
            if (promo.applicableSkus && promo.applicableSkus.length > 0) {
                const hasSku = activeTab.items.some(item => promo.applicableSkus.includes(item.sku));
                if (!hasSku) return;
            }

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

        if (bestPromo) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemSubTotal, activePromotions, activeTab?.autoPromoEnabled, activeTab?.appliedPromoId, activeTab?.promoDiscount, activeTab?.items, activeTab?.customer, activeTab?.priceMode]);
};
