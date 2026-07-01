import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Sparkles, Tag, CheckCircle, AlertCircle } from 'lucide-react';

const CartActivePromotions = ({ cartItems, subTotal, user, onPromotionsEvaluated }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bestPromoId, setBestPromoId] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // 🔥 Caching เพื่อลดจำนวน Reads ใน Firestore ประหยัดโควต้า
        const cacheKey = 'active_promotions_cache';
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(cacheKey + '_time');
        const now = new Date().getTime();

        if (cachedData && cacheTime && now - parseInt(cacheTime) < 1000 * 60 * 5) {
          setPromotions(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const q = query(collection(db, 'promotions'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const validItems = items.filter(p => !p.deletedAt); // Exclude soft deleted

        sessionStorage.setItem(cacheKey, JSON.stringify(validItems));
        sessionStorage.setItem(cacheKey + '_time', now.toString());

        setPromotions(validItems);
      } catch (error) {
        console.error("🔥 Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  // Function to evaluate if promotion is applicable
  const evaluatePromotion = (promo) => {
    let isApplicable = true;
    let missingSpend = 0;
    let missingQty = 0;

    // Check customerType
    if (promo.customerType && promo.customerType !== 'ALL') {
      const userRole = user?.role?.toUpperCase() || 'RETAIL';
      if (promo.customerType !== userRole) {
        isApplicable = false;
      }
    }

    // Check date range
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) isApplicable = false;
    if (promo.endDate && new Date(promo.endDate) < now) isApplicable = false;

    // Check quota limit
    if (promo.quotaLimit && promo.quotaLimit > 0) {
      const used = promo.quotaUsed || 0;
      if (used >= promo.quotaLimit) isApplicable = false;
    }

    // Check minSpend
    if (promo.minSpend && subTotal < promo.minSpend) {
      isApplicable = false;
      missingSpend = promo.minSpend - subTotal;
    }

    // Check minQty
    if (promo.minQty) {
      const totalQty = cartItems.reduce((acc, item) => acc + (item.qty || item.quantity || 1), 0);
      if (totalQty < promo.minQty) {
        isApplicable = false;
        missingQty = promo.minQty - totalQty;
      }
    }

    // Check applicable SKUs
    let hasApplicableSku = true;
    if (promo.applicableSkus && promo.applicableSkus.length > 0) {
      hasApplicableSku = cartItems.some(item => promo.applicableSkus.includes(item.sku));
      if (!hasApplicableSku) isApplicable = false;
    }

    return { isApplicable, missingSpend, missingQty, hasApplicableSku };
  };

  const calculateDiscount = (promo) => {
    let eligibleTotal = subTotal;
    if (promo.applicableSkus && promo.applicableSkus.length > 0) {
      eligibleTotal = cartItems.reduce((acc, item) => {
        if (promo.applicableSkus.includes(item.sku)) {
          return acc + ((item.price || 0) * (item.qty || item.quantity || 1));
        }
        return acc;
      }, 0);
    }
    
    if (promo.type === 'PERCENTAGE') {
      let discount = eligibleTotal * ((promo.value || 0) / 100);
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
      return discount;
    } else if (promo.type === 'FIXED_AMOUNT') {
      return Math.min(promo.value || 0, eligibleTotal);
    }
    return 0;
  };

  useEffect(() => {
    if (!loading && onPromotionsEvaluated) {
      let best = null;
      let maxDiscount = 0;

      promotions.forEach(promo => {
        const { isApplicable } = evaluatePromotion(promo);
        if (isApplicable) {
           const discount = calculateDiscount(promo);
           if (discount > maxDiscount) {
             maxDiscount = discount;
             best = {
               id: promo.id,
               name: promo.title,
               discountValue: discount,
               type: promo.type,
               value: promo.value
             };
           }
        }
      });
      
      setBestPromoId(best ? best.id : null);
      onPromotionsEvaluated(best ? [best] : []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, promotions, subTotal, cartItems]);

  if (loading || promotions.length === 0) return null;

  return (
    <div className="w-full">
      <style>{`
        @keyframes premiumGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .promo-premium-active {
          background: linear-gradient(270deg, #ecfdf5, #fef3c7, #d1fae5, #ecfdf5);
          background-size: 300% 300%;
          animation: premiumGradientFlow 4s ease infinite;
          border: 1px dashed #10b981; /* emerald-500 */
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.15);
        }
      `}</style>
      
      <div className="flex items-center gap-1.5 mb-3">
        <Tag size={14} className="text-gray-400" />
        <h2 className="text-[13px] font-bold text-gray-700">
          โปรโมชันที่เข้าร่วมรายการ
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {promotions.map(promo => {
          const { isApplicable, missingSpend, missingQty, hasApplicableSku } = evaluatePromotion(promo);
          const isBest = isApplicable && promo.id === bestPromoId;
          const isEligibleButNotBest = isApplicable && promo.id !== bestPromoId;
          
          return (
            <div 
              key={promo.id} 
              className={`p-3 rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isBest 
                  ? 'promo-premium-active transform hover:scale-[1.02]' 
                  : (isEligibleButNotBest ? 'bg-emerald-50 border border-emerald-200 opacity-70' : 'bg-gray-50 border border-dashed border-gray-300')
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-sm ${isBest ? 'text-emerald-900 drop-shadow-sm' : 'text-gray-600'}`}>
                    {promo.title}
                  </h3>
                  {isBest && (
                    <span className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider animate-pulse">
                      APPLIED
                    </span>
                  )}
                  {isEligibleButNotBest && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      ELIGIBLE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{promo.description}</p>
                
                {!isApplicable && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missingSpend > 0 && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 bg-gray-200/50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> ซื้อเพิ่มอีก ฿{missingSpend.toLocaleString()}
                      </span>
                    )}
                    {missingQty > 0 && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 bg-gray-200/50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> ซื้อเพิ่มอีก {missingQty} ชิ้น
                      </span>
                    )}
                    {!hasApplicableSku && promo.applicableSkus?.length > 0 && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 bg-gray-200/50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> เฉพาะสินค้าที่ร่วมรายการ
                      </span>
                    )}
                    {promo.customerType !== 'ALL' && (user?.role?.toUpperCase() !== promo.customerType) && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        (สำหรับลูกค้า {promo.customerType})
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="shrink-0 pt-1 sm:pt-0">
                {isBest ? (
                  <div className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> ใช้สิทธิ์แล้ว
                  </div>
                ) : isEligibleButNotBest ? (
                  <div className="text-[10px] font-medium text-gray-500">
                    มีโปรอื่นคุ้มกว่า
                  </div>
                ) : (
                  <div className="text-[10px] font-medium text-gray-400">
                    ยังไม่เข้าเงื่อนไข
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartActivePromotions;
