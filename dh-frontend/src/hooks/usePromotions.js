import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

/**
 * Pure helper to calculate eligible subtotal and quantity based on SKUs/Types
 */
export const getEligibleTotals = (applicableSkus = [], applicableTypes = [], cartItems = [], defaultSubtotal = 0) => {
  const hasSkus = Array.isArray(applicableSkus) && applicableSkus.length > 0;
  const hasTypes = Array.isArray(applicableTypes) && applicableTypes.length > 0;

  if (!hasSkus && !hasTypes) {
    const totalQty = (cartItems || []).reduce((acc, item) => acc + (Number(item?.qty || item?.quantity || 1) || 1), 0);
    const totalSub = defaultSubtotal || (cartItems || []).reduce((acc, item) => {
      const price = Number(item?.price ?? item?.retailPrice ?? 0) || 0;
      const q = Number(item?.qty || item?.quantity || 1) || 1;
      return acc + (price * q);
    }, 0);
    return { subtotal: totalSub, qty: totalQty };
  }

  let eligibleSubtotal = 0;
  let eligibleQty = 0;

  (cartItems || []).forEach(item => {
    let isEligible = false;
    const itemSku = String(item?.sku || '').trim().toUpperCase();
    const itemType = String(item?.type || item?.category || '').trim().toUpperCase();

    if (hasSkus && applicableSkus.some(s => String(s).trim().toUpperCase() === itemSku)) {
      isEligible = true;
    }
    if (hasTypes && applicableTypes.some(t => String(t).trim().toUpperCase() === itemType)) {
      isEligible = true;
    }

    if (isEligible) {
      const price = Number(item?.price ?? item?.retailPrice ?? 0) || 0;
      const q = Number(item?.qty || item?.quantity || 1) || 1;
      eligibleSubtotal += (price * q);
      eligibleQty += q;
    }
  });

  return { subtotal: eligibleSubtotal, qty: eligibleQty };
};

/**
 * Pure helper to evaluate promotion applicability and discount
 */
export const evaluatePromotion = (promo, cartItems = [], subTotal = 0, customerType = 'RETAIL') => {
  if (!promo || promo.isActive === false || promo.deletedAt) {
    return { isApplicable: false, discountValue: 0, missingSpend: 0, missingQty: 0, hasApplicableSku: false };
  }

  // 1. Check customer type
  if (promo.customerType && String(promo.customerType).trim().toUpperCase() !== 'ALL') {
    const userRole = String(customerType || 'RETAIL').trim().toUpperCase();
    if (String(promo.customerType).trim().toUpperCase() !== userRole) {
      return { isApplicable: false, discountValue: 0, missingSpend: 0, missingQty: 0, hasApplicableSku: false };
    }
  }

  // 2. Check date range
  const now = new Date();
  if (promo.startDate) {
    const start = promo.startDate.toDate ? promo.startDate.toDate() : new Date(promo.startDate);
    if (now < start) return { isApplicable: false, discountValue: 0, missingSpend: 0, missingQty: 0, hasApplicableSku: false };
  }
  if (promo.endDate) {
    const end = promo.endDate.toDate ? promo.endDate.toDate() : new Date(promo.endDate);
    if (now > end) return { isApplicable: false, discountValue: 0, missingSpend: 0, missingQty: 0, hasApplicableSku: false };
  }

  // 3. Check quota limit
  if (promo.quotaLimit && promo.quotaLimit > 0) {
    const used = promo.quotaUsed || 0;
    if (used >= promo.quotaLimit) return { isApplicable: false, discountValue: 0, missingSpend: 0, missingQty: 0, hasApplicableSku: false };
  }

  // 4. Calculate eligible totals
  const { subtotal: eligibleSubtotal, qty: eligibleQty } = getEligibleTotals(promo.applicableSkus, promo.applicableTypes, cartItems, subTotal);

  let isApplicable = true;
  let missingSpend = 0;
  let missingQty = 0;

  // Check minSpend
  if (promo.minSpend && promo.minSpend > 0) {
    if (eligibleSubtotal < promo.minSpend) {
      isApplicable = false;
      missingSpend = promo.minSpend - eligibleSubtotal;
    }
  }

  // Check minQty
  if (promo.minQty && promo.minQty > 0) {
    if (eligibleQty < promo.minQty) {
      isApplicable = false;
      missingQty = promo.minQty - eligibleQty;
    }
  }

  // Check applicable SKUs/Types
  const hasSpecificRules = (promo.applicableSkus?.length > 0) || (promo.applicableTypes?.length > 0);
  const hasApplicableSku = hasSpecificRules ? eligibleQty > 0 : true;
  if (hasSpecificRules && !hasApplicableSku) {
    isApplicable = false;
  }

  // Calculate discount value
  let discountValue = 0;
  if (isApplicable) {
    if (promo.type === 'PERCENTAGE') {
      let discount = eligibleSubtotal * ((promo.value || 0) / 100);
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        discount = Math.min(discount, promo.maxDiscount);
      }
      discountValue = Math.round(discount * 100) / 100;
    } else if (promo.type === 'FIXED_AMOUNT') {
      discountValue = Math.max(0, Math.min(Number(promo.value) || 0, eligibleSubtotal));
    }
  }

  return { isApplicable, discountValue, missingSpend, missingQty, hasApplicableSku };
};

/**
 * Pure helper to evaluate freebie applicability
 */
export const evaluateFreebie = (freebie, cartItems = [], subTotal = 0, customerType = 'RETAIL') => {
  if (!freebie || freebie.isActive === false || freebie.deletedAt) {
    return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  // 1. Check customer type
  if (freebie.customerType && String(freebie.customerType).trim().toUpperCase() !== 'ALL') {
    const userRole = String(customerType || 'RETAIL').trim().toUpperCase();
    if (String(freebie.customerType).trim().toUpperCase() !== userRole) {
      return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
    }
  }

  // 2. Check date range
  const now = new Date();
  if (freebie.startDate) {
    const start = freebie.startDate.toDate ? freebie.startDate.toDate() : new Date(freebie.startDate);
    if (now < start) return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }
  if (freebie.endDate) {
    const end = freebie.endDate.toDate ? freebie.endDate.toDate() : new Date(freebie.endDate);
    if (now > end) return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  // 3. Check quota limit
  if (freebie.quotaLimit && freebie.quotaLimit > 0) {
    const used = freebie.quotaUsed || 0;
    if (used >= freebie.quotaLimit) return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  // 4. Calculate eligible totals
  const { subtotal: eligibleSubtotal, qty: eligibleQty } = getEligibleTotals(freebie.applicableSkus, freebie.applicableTypes, cartItems, subTotal);

  const hasSpecificRules = (freebie.applicableSkus?.length > 0) || (freebie.applicableTypes?.length > 0);
  if (hasSpecificRules && eligibleQty <= 0) {
    return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  if (freebie.minSpend && freebie.minSpend > 0 && eligibleSubtotal < freebie.minSpend) {
    return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  if (freebie.minQty && freebie.minQty > 0 && eligibleQty < freebie.minQty) {
    return { isApplicable: false, calculatedQty: 0, eligibleQty: 0, eligibleSubtotal: 0 };
  }

  // 5. Calculate quantity based on distributionMode
  const baseQty = Number(freebie.qty) || 1;
  const maxLimit = (freebie.maxPerBill && Number(freebie.maxPerBill) > 0) ? Number(freebie.maxPerBill) : Infinity;

  let calculatedQty = baseQty;
  if (freebie.distributionMode === 'per_item') {
    calculatedQty = baseQty * Math.max(1, eligibleQty);
  }
  calculatedQty = Math.min(calculatedQty, maxLimit);

  // Remaining quota clamp if limited
  if (freebie.quotaLimit && freebie.quotaLimit > 0) {
    const remainingQuota = Math.max(0, freebie.quotaLimit - (freebie.quotaUsed || 0));
    calculatedQty = Math.min(calculatedQty, remainingQuota);
    if (calculatedQty <= 0) {
      return { isApplicable: false, calculatedQty: 0, eligibleQty, eligibleSubtotal };
    }
  }

  return { 
    isApplicable: true,
    calculatedQty,
    eligibleQty,
    eligibleSubtotal
  };
};

const PROMO_CACHE_TTL_MS = 30 * 60 * 1000; // 30 นาที แคชในเครื่อง ลด 2 Snapshot Queries
let inMemoryPromoCache = {
  promotions: null,
  freebies: null,
  timestamp: 0
};

export const invalidatePromoCache = () => {
  inMemoryPromoCache = { promotions: null, freebies: null, timestamp: 0 };
};

export function usePromotions() {
  const [promotions, setPromotions] = useState(() => inMemoryPromoCache.promotions || []);
  const [freebies, setFreebies] = useState(() => inMemoryPromoCache.freebies || []);
  const [loading, setLoading] = useState(() => !inMemoryPromoCache.promotions);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const now = Date.now();

    // หากมีแคชและยังไม่หมดอายุ (30 นาที) ใช้ทันที: 0 Reads, 0 Listener
    if (inMemoryPromoCache.promotions && (now - inMemoryPromoCache.timestamp) < PROMO_CACHE_TTL_MS) {
      setPromotions(inMemoryPromoCache.promotions);
      setFreebies(inMemoryPromoCache.freebies || []);
      setLoading(false);
      return;
    }

    const loadPromotionsAndFreebies = async () => {
      try {
        setLoading(true);

        const qPromo = query(
          collection(db, getCollectionPath('promotions')),
          where('isActive', '==', true)
        );
        const qFreebie = query(
          collection(db, getCollectionPath('freebies')),
          where('isActive', '==', true)
        );

        const [promoSnap, freebieSnap] = await Promise.all([
          getDocs(qPromo),
          getDocs(qFreebie)
        ]);

        const activePromos = [];
        promoSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.deletedAt) {
            activePromos.push({ id: doc.id, ...data });
          }
        });
        activePromos.sort((a, b) => {
          if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        const activeFreebies = [];
        freebieSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.deletedAt) {
            activeFreebies.push({ id: doc.id, ...data });
          }
        });
        activeFreebies.sort((a, b) => (a.minSpend || 0) - (b.minSpend || 0));

        inMemoryPromoCache = {
          promotions: activePromos,
          freebies: activeFreebies,
          timestamp: Date.now()
        };

        if (isMounted) {
          setPromotions(activePromos);
          setFreebies(activeFreebies);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching promotions/freebies:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadPromotionsAndFreebies();

    return () => {
      isMounted = false;
    };
  }, []);

  const memoEvaluatePromotion = useCallback((promo, cartItems, subTotal, customerType) => {
    return evaluatePromotion(promo, cartItems, subTotal, customerType);
  }, []);

  const memoEvaluateFreebie = useCallback((freebie, cartItems, subTotal, customerType) => {
    return evaluateFreebie(freebie, cartItems, subTotal, customerType);
  }, []);

  const memoGetEligibleTotals = useCallback((applicableSkus, applicableTypes, cartItems, defaultSubtotal) => {
    return getEligibleTotals(applicableSkus, applicableTypes, cartItems, defaultSubtotal);
  }, []);

  return {
    promotions,
    freebies,
    loading,
    isLoading: loading,
    error,
    evaluatePromotion: memoEvaluatePromotion,
    evaluateFreebie: memoEvaluateFreebie,
    getEligibleTotals: memoGetEligibleTotals,
    invalidateCache: invalidatePromoCache
  };
}
