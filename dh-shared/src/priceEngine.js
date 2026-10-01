/**
 * Price Engine
 * Centralized business logic for calculating Net Total, Discounts, and Promotions.
 */
import { calculateDetailedVat } from './taxEngine.js';

const safeNum = (val, defaultVal = 0) => {
    const parsed = Number(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

export const calculateItemTotal = (item) => {
    if (!item || typeof item !== 'object') return 0;
    if (item.isFreebie) return 0;
    const price = safeNum(item.retailPrice || item.Price || item.price || 0);
    const qty = safeNum(item.qty || item.quantity, 1);
    return price * Math.max(0, qty); // Prevent negative quantity from messing up totals unless strictly intended
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
            const itemSku = String(item.id || item.sku || '').trim().toUpperCase();
            const isMatch = promotion.applicableSkus.some(s => String(s).trim().toUpperCase() === itemSku);
            if (isMatch) {
                return sum + calculateItemTotal(item);
            }
            return sum;
        }, 0);
    }

    if (applicableSubtotal <= 0) return 0;

    let discount = 0;
    const promoType = String(promotion.type || '').toUpperCase();
    if (promoType === 'PERCENTAGE') {
        discount = applicableSubtotal * (safeNum(promotion.value) / 100);
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
            discount = promotion.maxDiscount;
        }
    } else if (promoType === 'FIXED' || promoType === 'FIXED_AMOUNT') {
        discount = Math.min(safeNum(promotion.value), applicableSubtotal);
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
    walletUsed = 0,     // Wallet deduction
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
    let finalDiscount = safeNum(discountAmount) + safeNum(totalPromoDiscount);
    if (finalDiscount > subtotal) {
        finalDiscount = subtotal;
    }

    let netTotal = subtotal - finalDiscount + safeNum(shippingCost) + safeNum(otherFeeAmount);
    
    // Subtract wallet used from net total (not less than 0)
    const walletDeduction = Math.min(safeNum(walletUsed), netTotal);
    netTotal = netTotal - walletDeduction;
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(finalDiscount * 100) / 100,
        shippingCost: Math.round(safeNum(shippingCost) * 100) / 100,
        otherFeeAmount: Math.round(safeNum(otherFeeAmount) * 100) / 100,
        walletUsed: Math.round(walletDeduction * 100) / 100,
        netTotal: Math.max(0, Math.round(netTotal * 100) / 100)
    };
};

/**
 * Calculates canonical totals across an order object with complete VAT & discount breakdown.
 */
export const calculateCanonicalTotals = (order) => {
    if (!order || typeof order !== 'object') {
        return {
            itemsSubTotal: 0,
            manualDiscount: 0,
            promoDiscount: 0,
            totalDiscount: 0,
            shippingFee: 0,
            otherFees: 0,
            vatAmount: 0,
            netTotal: 0
        };
    }

    let subTotal = 0;
    const items = order.items || order.cartItems || [];
    if (items.length > 0) {
        subTotal = items.reduce((sum, item) => {
            if (item.isFreebie) return sum;
            const price = Number(item.price ?? item.priceAtPurchase ?? item.pricePerUnit ?? item.unitPrice ?? item.retailPrice ?? 0);
            const qty = Number(item.qty ?? item.quantity ?? item.count ?? 1);
            return sum + (price * qty);
        }, 0);
    }

    const manualDiscount = Number(order.summary?.manualDiscount || order.overallDiscount || order.discountAmount || order.totals?.discount || 0);
    const promoDiscount = Number(order.summary?.promoDiscount || order.promoDiscount || 0);
    const shippingFee = Number(order.shippingFee || order.shippingCost || order.summary?.shippingFee || order.totals?.shipping || 0);
    const otherFees = Number(order.otherFeeAmount || order.otherFees || order.summary?.otherFeeAmount || 0);
    const vatType = order.vatType || order.summary?.vatType || 'exempt';
    const vatOnShipping = Boolean(order.vatOnShipping || order.summary?.vatOnShipping);
    const vatRate = Number(order.vatRate || order.summary?.vatRate || 7);

    const productNet = Math.max(0, subTotal - manualDiscount - promoDiscount + otherFees);
    const vatBreakdown = calculateDetailedVat({
        productNet,
        shippingFee,
        vatType,
        vatOnShipping,
        vatRate
    });

    const calculatedNet = vatBreakdown.netTotal;
    const storedNet = Number(order.summary?.finalTotal ?? order.finalTotal ?? order.netTotal ?? order.summary?.netTotal ?? order.totals?.netTotal ?? order.totalAmount ?? 0);

    let finalNet = storedNet;
    if ((storedNet === 0 || (subTotal > 500 && storedNet < subTotal * 0.5)) && subTotal > 0) {
        finalNet = Math.max(0, Math.round(calculatedNet * 100) / 100);
    }

    return {
        itemsSubTotal: Math.round(subTotal * 100) / 100,
        manualDiscount: Math.round(manualDiscount * 100) / 100,
        promoDiscount: Math.round(promoDiscount * 100) / 100,
        totalDiscount: Math.round((manualDiscount + promoDiscount) * 100) / 100,
        shippingFee: Math.round(shippingFee * 100) / 100,
        otherFees: Math.round(otherFees * 100) / 100,
        vatAmount: vatBreakdown.vatAmount,
        vatBreakdown,
        netTotal: Math.round(finalNet * 100) / 100
    };
};

