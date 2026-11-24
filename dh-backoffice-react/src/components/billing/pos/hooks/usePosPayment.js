import { useMemo, useCallback, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { unwrapCreditConfig } from 'dh-shared/src/utils/creditUtils';
import { calculateEarnedPoints, getUserTier, fetchAndCacheRoleTiers, setCachedTiers } from '../../../../firebase/credit/creditFormatService';

const CREDIT_CONFIG_CACHE_KEY = 'dh_pos_credit_config_cache_v1';
const ROLE_TIERS_CACHE_KEY = 'dh_pos_role_tiers_cache_v1';
const CREDIT_CACHE_TIME_KEY = 'dh_pos_credit_cache_time_v1';
const CREDIT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let memoryCreditConfig = null;
let memoryTiersLoaded = false;

const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

export function usePosPayment({ activeTab, activePromotions, activeFreebies, currentCustomerType }) {
    const [creditConfig, setCreditConfig] = useState(() => memoryCreditConfig);
    const [tiersLoaded, setTiersLoaded] = useState(() => memoryTiersLoaded);

    // ⚡ Read-only Session & Memory Cache for Credit Config + Role Tiers (Cold Start +2 reads, Warm Cache 0 reads)
    useEffect(() => {
        if (memoryCreditConfig && memoryTiersLoaded) return;
        let isMounted = true;

        const hydrateCreditConfigs = async () => {
            const now = Date.now();
            try {
                const cachedTime = sessionStorage.getItem(CREDIT_CACHE_TIME_KEY);
                if (cachedTime && (now - Number(cachedTime)) < CREDIT_CACHE_TTL) {
                    const rawCfg = sessionStorage.getItem(CREDIT_CONFIG_CACHE_KEY);
                    const rawTiers = sessionStorage.getItem(ROLE_TIERS_CACHE_KEY);
                    if (rawCfg) {
                        const parsedCfg = JSON.parse(rawCfg);
                        memoryCreditConfig = parsedCfg;
                        if (isMounted) setCreditConfig(parsedCfg);
                    }
                    if (rawTiers) {
                        const parsedTiers = JSON.parse(rawTiers);
                        if (Array.isArray(parsedTiers) && parsedTiers.length > 0) {
                            setCachedTiers(parsedTiers);
                        }
                        memoryTiersLoaded = true;
                        if (isMounted) setTiersLoaded(true);
                    }
                    if (rawCfg) return;
                }
            } catch (e) {
                console.warn('[usePosPayment] SessionStorage credit cache read warning:', e);
            }

            try {
                const [cfgSnap, tiers] = await Promise.all([
                    getDoc(doc(db, getCollectionPath('settings'), 'credit_config')),
                    fetchAndCacheRoleTiers()
                ]);
                const resolvedCfg = cfgSnap.exists() ? unwrapCreditConfig(cfgSnap.data()) : { earningRate: 100 };
                memoryCreditConfig = resolvedCfg;
                memoryTiersLoaded = true;

                try {
                    sessionStorage.setItem(CREDIT_CONFIG_CACHE_KEY, JSON.stringify(resolvedCfg));
                    if (Array.isArray(tiers)) {
                        sessionStorage.setItem(ROLE_TIERS_CACHE_KEY, JSON.stringify(tiers));
                    }
                    sessionStorage.setItem(CREDIT_CACHE_TIME_KEY, String(Date.now()));
                } catch (storageErr) {
                    console.warn('[usePosPayment] SessionStorage credit cache write warning:', storageErr);
                }

                if (isMounted) {
                    setCreditConfig(resolvedCfg);
                    setTiersLoaded(true);
                }
            } catch (err) {
                console.warn('[usePosPayment] Could not load credit_config/role_tier_config:', err);
            }
        };

        hydrateCreditConfigs();
        return () => { isMounted = false; };
    }, []);

    const itemSubTotal = activeTab?.items?.reduce((sum, item) => sum + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty))), 0) || 0;
    const itemTotalQty = activeTab?.items?.reduce((sum, item) => sum + Math.max(1, sanitizeNum(item.qty)), 0) || 0;
    
    const discountType = activeTab?.overallDiscountType || 'BAHT';
    const rawDiscount = activeTab ? sanitizeNum(activeTab.overallDiscount) : 0;
    const manualDiscount = discountType === 'PERCENT'
        ? Math.round(itemSubTotal * (rawDiscount / 100) * 100) / 100
        : rawDiscount;
    const shippingFee = activeTab ? sanitizeNum(activeTab.shippingFee) : 0;
    const otherFeeAmount = activeTab ? sanitizeNum(activeTab.otherFeeAmount) : 0;

    const items = activeTab?.items;
    const getEligibleTotals = useCallback((skus, types) => {
        const hasSkus = skus && skus.length > 0;
        const hasTypes = types && types.length > 0;

        if (!hasSkus && !hasTypes) return { subtotal: itemSubTotal, qty: itemTotalQty };

        let eligibleSubtotal = 0;
        let eligibleQty = 0;
        items?.forEach(item => {
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
    }, [itemSubTotal, itemTotalQty, items]);

    const autoFreebieEnabled = activeTab?.autoFreebieEnabled !== false;
    const disabledFreebieIds = activeTab?.disabledFreebieIds || [];
    const manualFreebieIds = activeTab?.manualFreebieIds || [];

    const eligibleFreebies = useMemo(() => {
        return activeFreebies.filter(f => {
            if (autoFreebieEnabled) {
                if (disabledFreebieIds.includes(f.id)) return false;
                const { subtotal, qty } = getEligibleTotals(f.applicableSkus, f.applicableTypes);
                if (subtotal <= 0) return false;
                if (f.minSpend && subtotal < f.minSpend) return false;
                if (f.minQty && qty < f.minQty) return false;
                if (f.startDate && new Date(f.startDate) > new Date()) return false;
                if (f.endDate && new Date(f.endDate) < new Date()) return false;
                if (f.quotaLimit && (f.quotaUsed || 0) >= f.quotaLimit) return false;
                if (f.customerType && f.customerType !== 'ALL' && f.customerType !== currentCustomerType) return false;
                return true;
            } else {
                return manualFreebieIds.includes(f.id);
            }
        }).map(f => {
            const { qty: eligibleQty } = getEligibleTotals(f.applicableSkus, f.applicableTypes);
            const baseQty = Number(f.qty) || 1;
            const maxLimit = (f.maxPerBill && Number(f.maxPerBill) > 0) ? Number(f.maxPerBill) : Infinity;

            let calculatedQty = baseQty;
            if (f.distributionMode === 'per_item') {
                calculatedQty = baseQty * Math.max(1, eligibleQty);
            }
            calculatedQty = Math.min(calculatedQty, maxLimit);

            if (f.quotaLimit && f.quotaLimit > 0) {
                const remainingQuota = Math.max(0, f.quotaLimit - (f.quotaUsed || 0));
                calculatedQty = Math.min(calculatedQty, remainingQuota);
            }

            return {
                ...f,
                calculatedQty: Math.max(1, calculatedQty),
                qty: Math.max(1, calculatedQty)
            };
        });
    }, [activeFreebies, autoFreebieEnabled, disabledFreebieIds, manualFreebieIds, currentCustomerType, getEligibleTotals]);

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
    }, [activePromotions, currentCustomerType, getEligibleTotals]);

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
        autoPromoDiscount = Math.round(bestDiscount * 100) / 100;
        autoPromoDetails = bestPromo;
    }

    const promoDiscount = activeTab?.autoPromoEnabled ? autoPromoDiscount : (activeTab?.appliedPromoId ? sanitizeNum(activeTab?.promoDiscount) : 0);
    const appliedPromoDetails = activeTab?.autoPromoEnabled ? autoPromoDetails : (activeTab?.appliedPromoId ? activeTab?.appliedPromoDetails : null);
    const totalDiscount = manualDiscount + promoDiscount;
    
    // 🧮 Clean Separation of Calculations (VAT 7% & Shipping Correction)
    // 🛡️ Post-Tax/Shipping Adjustment: otherFeeAmount is applied at the very end so it does NOT distort taxable base
    const baseTotal = Math.max(0, itemSubTotal - totalDiscount);
    const isVatOnShipping = Boolean(activeTab?.vatOnShipping);
    const taxableAmount = baseTotal + (isVatOnShipping ? shippingFee : 0);
    const vatType = activeTab?.vatType || 'exempt';

    let vatAmount = 0;
    let preOtherFeeTotal = 0;

    if (vatType === 'included') {
        // VAT 7% extracted: (taxableAmount * 7 / 107). Net total is baseTotal + shippingFee. Zero double-counting of shipping!
        vatAmount = Math.round((taxableAmount * 7 / 107) * 100) / 100;
        preOtherFeeTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
    } else if (vatType === 'excluded') {
        // VAT 7% added: (taxableAmount * 0.07). Net total is baseTotal + shippingFee + vatAmount. Zero dropping of shipping fee!
        vatAmount = Math.round((taxableAmount * 0.07) * 100) / 100;
        preOtherFeeTotal = Math.round((baseTotal + shippingFee + vatAmount) * 100) / 100;
    } else {
        // 'exempt' or 'none': VAT is 0. Net total is baseTotal + shippingFee.
        vatAmount = 0;
        preOtherFeeTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
    }

    // 🎯 ยอดอื่นๆ (+/-) คิดท้ายสุด (หลังภาษี VAT และค่าส่ง)
    const netTotal = Math.max(0, Math.round((preOtherFeeTotal + otherFeeAmount) * 100) / 100);

    let walletUsed = sanitizeNum(activeTab?.walletUsed);
    if (activeTab?.useWallet && activeTab?.customer) {
        walletUsed = Math.min(sanitizeNum(activeTab.customer.walletBalance), netTotal);
    }
    
    const remainingToPay = Math.max(0, Math.round((netTotal - walletUsed) * 100) / 100);
    const { earnedPoints, pointsBreakdown } = useMemo(() => {
        if (!activeTab?.customer || activeTab.customer.uid === 'WALK-IN' || remainingToPay <= 0) {
            return { earnedPoints: 0, pointsBreakdown: null };
        }
        const userTotalAccumulated = sanitizeNum(
            activeTab.customer.totalAccumulatedPoints ?? activeTab.customer.creditPoints ?? 0
        );
        if (creditConfig) {
            const earningRate = creditConfig.earningRate || creditConfig.pointsEarningRate || 100;
            const tier = getUserTier(userTotalAccumulated, creditConfig.tiers || creditConfig.tierList);
            const multiplier = creditConfig.tierMultiplier || tier.multiplier || 1;
            const basePoints = Math.floor(remainingToPay / earningRate);
            const tierPoints = Math.floor(basePoints * multiplier);
            const totalPts = calculateEarnedPoints(remainingToPay, creditConfig, activeTab.items || [], userTotalAccumulated);
            const skuBonusPoints = Math.max(0, totalPts - tierPoints);
            return {
                earnedPoints: totalPts,
                pointsBreakdown: {
                    earningRate,
                    tierName: tier?.name || 'Member',
                    tierMultiplier: multiplier,
                    skuBonusPoints
                }
            };
        }
        return {
            earnedPoints: Math.floor(remainingToPay / 100),
            pointsBreakdown: { earningRate: 100, tierName: 'Member', tierMultiplier: 1, skuBonusPoints: 0 }
        };
    }, [activeTab?.customer, activeTab?.items, remainingToPay, creditConfig, tiersLoaded]);
    const changeAmount = (activeTab?.paymentMethod === 'Cash' && activeTab?.cashReceived) 
        ? Math.round((sanitizeNum(activeTab.cashReceived) - remainingToPay) * 100) / 100 : 0;

    return {
        itemSubTotal, manualDiscount, promoDiscount, totalDiscount,
        shippingFee, otherFeeAmount, vatAmount, netTotal,
        walletUsed, remainingToPay, earnedPoints, pointsBreakdown, changeAmount, 
        eligibleFreebies, appliedPromoDetails, validPromotions
    };
}
