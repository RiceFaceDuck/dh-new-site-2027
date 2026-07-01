import { useMemo } from 'react';
import { calculateVat } from 'dh-shared';
const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

export function usePosPayment({ activeTab, activePromotions, activeFreebies, currentCustomerType }) {
    const itemSubTotal = activeTab?.items?.reduce((sum, item) => sum + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty))), 0) || 0;
    const itemTotalQty = activeTab?.items?.reduce((sum, item) => sum + Math.max(1, sanitizeNum(item.qty)), 0) || 0;
    
    const manualDiscount = activeTab ? sanitizeNum(activeTab.overallDiscount) : 0;
    const shippingFee = activeTab ? sanitizeNum(activeTab.shippingFee) : 0;
    const otherFeeAmount = activeTab ? sanitizeNum(activeTab.otherFeeAmount) : 0;

    const getEligibleTotals = (skus, types) => {
        const hasSkus = skus && skus.length > 0;
        const hasTypes = types && types.length > 0;

        if (!hasSkus && !hasTypes) return { subtotal: itemSubTotal, qty: itemTotalQty };

        let eligibleSubtotal = 0;
        let eligibleQty = 0;
        activeTab?.items?.forEach(item => {
            let isEligible = false;
            const itemSku = String(item.sku || '').toUpperCase();
            const itemType = String(item.type || item.category || '').toUpperCase();

            if (hasSkus && skus.some(s => String(s).toUpperCase() === itemSku)) isEligible = true;
            if (hasTypes && types.some(t => String(t).toUpperCase() === itemType)) isEligible = true;

            if (isEligible) {
                eligibleSubtotal += ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty)));
                eligibleQty += Math.max(1, sanitizeNum(item.qty));
            }
        });
        return { subtotal: eligibleSubtotal, qty: eligibleQty };
    };

    const eligibleFreebies = useMemo(() => {
        return activeFreebies.filter(f => {
            const { subtotal, qty } = getEligibleTotals(f.applicableSkus, f.applicableTypes);
            if (subtotal <= 0) return false;
            if (f.minSpend && subtotal < f.minSpend) return false;
            if (f.minQty && qty < f.minQty) return false;
            if (f.startDate && new Date(f.startDate) > new Date()) return false;
            if (f.endDate && new Date(f.endDate) < new Date()) return false;
            if (f.quotaLimit && (f.quotaUsed || 0) >= f.quotaLimit) return false;
            if (f.customerType && f.customerType !== 'ALL' && f.customerType !== currentCustomerType) return false;
            return true;
        });
    }, [activeFreebies, activeTab, currentCustomerType]);

    const validPromotions = useMemo(() => {
        return activePromotions.filter(p => {
            const { subtotal, qty } = getEligibleTotals(p.applicableSkus, p.applicableTypes);
            if (p.minSpend > 0 && subtotal < p.minSpend) return false;
            if (p.minQty > 0 && qty < p.minQty) return false;
            if (p.startDate && new Date(p.startDate) > new Date()) return false;
            if (p.endDate && new Date(p.endDate) < new Date()) return false;
            if (p.quotaLimit && (p.quotaUsed || 0) >= p.quotaLimit) return false;
            if (p.customerType && p.customerType !== 'ALL' && p.customerType !== currentCustomerType) return false;
            return true;
        });
    }, [activePromotions, activeTab, currentCustomerType]);

    let autoPromoDiscount = 0;
    let autoPromoDetails = null;
    
    if (activeTab?.autoPromoEnabled && validPromotions.length > 0) {
        let bestDiscount = 0;
        let bestPromo = null;
        validPromotions.forEach(promo => {
            const { subtotal } = getEligibleTotals(promo.applicableSkus, promo.applicableTypes);
            let calculated = promo.type === 'PERCENTAGE' ? subtotal * (promo.value / 100) : promo.value;
            if (promo.type === 'PERCENTAGE' && promo.maxDiscount > 0) {
                calculated = Math.min(calculated, promo.maxDiscount);
            }
            if (calculated > bestDiscount) {
                bestDiscount = calculated;
                bestPromo = promo;
            }
        });
        autoPromoDiscount = Math.floor(bestDiscount);
        autoPromoDetails = bestPromo;
    }

    const promoDiscount = activeTab?.autoPromoEnabled ? autoPromoDiscount : sanitizeNum(activeTab?.promoDiscount);
    const appliedPromoDetails = activeTab?.autoPromoEnabled ? autoPromoDetails : activeTab?.appliedPromoDetails;
    const totalDiscount = manualDiscount + promoDiscount;
    
    let baseTotal = Math.max(0, itemSubTotal - totalDiscount) + otherFeeAmount;
    let taxableAmount = baseTotal + (activeTab?.vatOnShipping ? shippingFee : 0);
    let vatTypeMapped = 'ไม่มี VAT';
    if (activeTab?.vatType === 'included') vatTypeMapped = 'รวม VAT';
    if (activeTab?.vatType === 'excluded') vatTypeMapped = 'แยก VAT';

    const vatResult = calculateVat(taxableAmount, vatTypeMapped);
    let vatAmount = vatResult.vatAmount;
    let netTotal = vatResult.finalTotal + (activeTab?.vatType !== 'excluded' ? shippingFee : 0);
    if (activeTab?.vatType === 'excluded') {
         // if excluded, calculateVat returns finalTotal = taxableAmount + vat. But taxableAmount included shipping already. So finalTotal already includes shipping.
         netTotal = vatResult.finalTotal;
    }


    let walletUsed = sanitizeNum(activeTab?.walletUsed);
    if (activeTab?.useWallet && activeTab?.customer) {
        walletUsed = Math.min(sanitizeNum(activeTab.customer.walletBalance), netTotal);
    }
    
    const remainingToPay = Math.max(0, netTotal - walletUsed);
    const earnedPoints = activeTab?.customer ? Math.floor(remainingToPay / 100) : 0;
    const changeAmount = (activeTab?.paymentMethod === 'Cash' && activeTab?.cashReceived) 
        ? (sanitizeNum(activeTab.cashReceived) - remainingToPay) : 0;

    return {
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, changeAmount, 
        eligibleFreebies, appliedPromoDetails, validPromotions
    };
}
