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
            if (itemSubTotal >= promo.minSpend) {
                let discount = applyPromotionLogic(promo, itemSubTotal);
                if (discount > maxDiscount) { 
                    maxDiscount = discount; 
                    bestPromo = promo; 
                }
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
    }, [itemSubTotal, activePromotions, activeTab?.autoPromoEnabled, activeTab?.appliedPromoId, activeTab?.promoDiscount]);
};
