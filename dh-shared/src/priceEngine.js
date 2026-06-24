/**
 * Price Engine
 * Centralized business logic for calculating Net Total, Discounts, and Promotions.
 */

export const calculateItemTotal = (item) => {
    if (!item) return 0;
    if (item.isFreebie) return 0;
    const price = Number(item.retailPrice || item.Price || item.price || 0);
    const qty = Number(item.qty || 1);
    return price * qty;
};

export const calculateSubtotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

/**
 * Calculates promotion discount based on promotion rules and applicable items.
 * Note: A real strict system should fetch the promotion from DB. 
 * This engine handles the calculation pure-logic.
 */
export const calculatePromotionDiscount = (subtotal, items, promotion) => {
    if (!promotion) return 0;

    // Check minimum spend
    if (promotion.minSpend && subtotal < promotion.minSpend) {
        return 0; // Does not qualify
    }

    // Check applicable SKUs if any
    let applicableSubtotal = subtotal;
    if (promotion.applicableSkus && promotion.applicableSkus.length > 0) {
        applicableSubtotal = items.reduce((sum, item) => {
            const itemSku = item.id || item.sku;
            if (promotion.applicableSkus.includes(itemSku)) {
                return sum + calculateItemTotal(item);
            }
            return sum;
        }, 0);
    }

    if (applicableSubtotal <= 0) return 0;

    let discount = 0;
    if (promotion.type === 'PERCENTAGE') {
        discount = applicableSubtotal * (Number(promotion.value) / 100);
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
            discount = promotion.maxDiscount;
        }
    } else if (promotion.type === 'FIXED') {
        discount = Number(promotion.value);
    }

    return Math.round(discount * 100) / 100;
};

/**
 * Central Price Calculator
 */
export const calculateNetTotal = ({
    items = [],
    shippingCost = 0,
    otherFeeAmount = 0, // Manual extra fees like packaging
    discountAmount = 0, // Manual overall discount
    promotions = [],    // Array of promo objects or single promo
}) => {
    const subtotal = calculateSubtotal(items);
    
    // Promotions
    let totalPromoDiscount = 0;
    const promoList = Array.isArray(promotions) ? promotions : [promotions];
    promoList.forEach(promo => {
        if (promo) {
             totalPromoDiscount += calculatePromotionDiscount(subtotal, items, promo);
        }
    });

    // Ensure total discount doesn't exceed subtotal
    let finalDiscount = discountAmount + totalPromoDiscount;
    if (finalDiscount > subtotal) {
        finalDiscount = subtotal;
    }

    const netTotal = subtotal - finalDiscount + shippingCost + otherFeeAmount;
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(finalDiscount * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        otherFeeAmount: Math.round(otherFeeAmount * 100) / 100,
        netTotal: Math.max(0, Math.round(netTotal * 100) / 100)
    };
};
