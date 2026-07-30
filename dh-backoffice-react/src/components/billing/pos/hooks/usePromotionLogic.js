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

        // กรณีปิด Auto Promo
        if (!activeTab.autoPromoEnabled) {
            // หากมีโปรโมชันที่เลือกแบบ Manual ให้ตรวจสอบว่ายังคงเข้าเกณฑ์หรือไม่
            if (activeTab.appliedPromoDetails) {
                const promo = activeTab.appliedPromoDetails;
                let isStillEligible = true;
                if (promo.minSpend > 0 && itemSubTotal < promo.minSpend) isStillEligible = false;
                
                if (promo.minQty > 0) {
                    const totalQty = activeTab.items?.reduce((acc, item) => acc + sanitizeNum(item.qty), 0) || 0;
                    if (totalQty < promo.minQty) isStillEligible = false;
                }

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

            // 2. Check minSpend
            if (promo.minSpend > 0 && itemSubTotal < promo.minSpend) return;

            // 3. Check minQty
            if (promo.minQty > 0) {
                const totalQty = activeTab.items?.reduce((acc, item) => acc + sanitizeNum(item.qty), 0) || 0;
                if (totalQty < promo.minQty) return;
            }

            // 4. Check applicable SKUs & Types
            if (promo.applicableSkus && promo.applicableSkus.length > 0) {
                const hasSku = activeTab.items?.some(item => promo.applicableSkus.includes(item.sku));
                if (!hasSku) return;
            }
            if (promo.applicableTypes && promo.applicableTypes.length > 0) {
                const hasType = activeTab.items?.some(item => promo.applicableTypes.includes(item.type || item.category));
                if (!hasType) return;
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
        activeTab?.appliedPromoDetails,
        activeTab?.items, 
        activeTab?.customer, 
        activeTab?.priceMode, 
        updateActiveTab,
        applyPromotionLogic
    ]);
};
