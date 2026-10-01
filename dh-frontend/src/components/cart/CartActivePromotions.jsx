import { useState, useEffect } from 'react';
import { Tag, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { usePromotions } from '../../hooks/usePromotions';
import { trackPromotionView } from '../../firebase/promotionAnalyticsService';

const CartActivePromotions = ({ cartItems, subTotal, user, onPromotionsEvaluated, hidden = false }) => {
  const [bestPromoId, setBestPromoId] = useState(null);
  const { promotions, isLoading, evaluatePromotion } = usePromotions();

  useEffect(() => {
    if (!isLoading && promotions.length > 0) {
      trackPromotionView(promotions);
    }
  }, [isLoading, promotions]);

  useEffect(() => {
    if (!isLoading && onPromotionsEvaluated) {
      let best = null;
      let maxDiscount = 0;

      promotions.forEach(promo => {
        const { isApplicable, discountValue } = evaluatePromotion(promo, cartItems, subTotal, user?.role?.toUpperCase() || 'RETAIL');
        if (isApplicable) {
           if (discountValue > maxDiscount) {
             maxDiscount = discountValue;
             best = {
               id: promo.id,
               name: promo.title,
               discountValue: discountValue,
               type: promo.type,
               value: promo.value
             };
           }
        }
      });
      
      setBestPromoId(best ? best.id : null);
      onPromotionsEvaluated(best ? [best] : []);
    }
  }, [isLoading, promotions, subTotal, cartItems, user, onPromotionsEvaluated, evaluatePromotion]);

  if (isLoading || promotions.length === 0) return null;
  if (hidden) return null;

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
          const { isApplicable, missingSpend, missingQty, hasApplicableSku } = evaluatePromotion(promo, cartItems, subTotal, user?.role?.toUpperCase() || 'RETAIL');
          const isBest = isApplicable && promo.id === bestPromoId;
          const isEligibleButNotBest = isApplicable && promo.id !== bestPromoId;
          
          // ⌛ Calculate Expiry
          let hoursLeft = null;
          if (promo.endDate) {
             const end = promo.endDate.toDate ? promo.endDate.toDate() : new Date(promo.endDate);
             const diff = end.getTime() - new Date().getTime();
             if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
                 hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
             }
          }
          
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
                  <h3 className={`font-bold text-sm ${isBest ? 'text-emerald-900 drop-shadow-xs' : 'text-gray-600'}`}>
                    {promo.title}
                  </h3>
                  {isBest && (
                    <span className="text-[10px] font-bold text-white bg-linear-to-r from-emerald-500 to-teal-400 px-2 py-0.5 rounded-sm shadow-xs uppercase tracking-wider animate-pulse">
                      APPLIED
                    </span>
                  )}
                  {isEligibleButNotBest && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      ELIGIBLE
                    </span>
                  )}
                  {hoursLeft !== null && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-sm border border-orange-200 animate-pulse ml-auto sm:ml-0">
                      <Clock size={10} /> หมดอายุใน {hoursLeft} ชม.
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
