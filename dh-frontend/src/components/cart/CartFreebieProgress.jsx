import { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { productService } from '../../firebase/productService';
import { usePromotions } from '../../hooks/usePromotions';

const CartFreebieProgress = ({ freebies: propFreebies, subTotal, isLoading: propIsLoading, cartItems, checkoutState, updateCheckoutConfig, hidden = false }) => {
  const [freebieProduct, setFreebieProduct] = useState(null);
  
  const { freebies: hookFreebies, isLoading: hookIsLoading, getEligibleTotals, evaluateFreebie } = usePromotions();
  
  const freebies = propFreebies || hookFreebies;
  const isLoading = propIsLoading || hookIsLoading;

  const nextFreebie = !isLoading && freebies ? freebies.find(f => {
    const { subtotal, qty } = getEligibleTotals(f.applicableSkus, f.applicableTypes, cartItems, subTotal);
    if (f.minSpend > 0 && f.minSpend > subtotal) return true;
    if (f.minQty > 0 && f.minQty > qty) return true;
    return false;
  }) : null; 

  const currentFreebie = !isLoading && freebies ? [...freebies].reverse().find(f => {
    const evalRes = evaluateFreebie ? evaluateFreebie(f, cartItems, subTotal) : null;
    if (evalRes) return evalRes.isApplicable;
    
    const { subtotal, qty } = getEligibleTotals(f.applicableSkus, f.applicableTypes, cartItems, subTotal);
    const hasSkus = f.applicableSkus && f.applicableSkus.length > 0;
    const hasTypes = f.applicableTypes && f.applicableTypes.length > 0;
    
    if ((hasSkus || hasTypes) && qty <= 0) return false;
    if (f.minSpend > 0 && subtotal < f.minSpend) return false;
    if (f.minQty > 0 && qty < f.minQty) return false;
    
    return true;
  }) : null;  

  const currentFreebieEval = currentFreebie && evaluateFreebie ? evaluateFreebie(currentFreebie, cartItems, subTotal) : null;
  const currentCalculatedQty = currentFreebieEval?.calculatedQty || Number(currentFreebie?.qty) || 1;

  useEffect(() => {
    if (!updateCheckoutConfig) return;
    
    // Evaluate if the current freebie is actually available (not out of stock, not exhausted quota)
    const isOutOfStock = freebieProduct?.isOutOfStock || (freebieProduct && freebieProduct.stockQuantity < currentCalculatedQty);
    const isQuotaExhausted = currentFreebie?.quotaLimit > 0 && currentFreebie?.quotaUsed >= currentFreebie?.quotaLimit;
    const isUnavailable = isOutOfStock || isQuotaExhausted;

    const currentQualified = checkoutState?.qualifiedFreebies || [];
    
    // Create an enriched freebie object with the actual product name and calculated quantity
    const enrichedFreebie = currentFreebie ? {
      ...currentFreebie,
      qty: currentCalculatedQty,
      calculatedQty: currentCalculatedQty,
      productName: freebieProduct?.name || currentFreebie.title
    } : null;

    const newQualified = (enrichedFreebie && !isUnavailable) ? [enrichedFreebie] : [];
    
    // We compare IDs, quantities, and product names to avoid infinite loops from object reference changes
    const currentIds = currentQualified.map(f => `${f.id}:${f.calculatedQty || f.qty}`).join(',');
    const newIds = newQualified.map(f => `${f.id}:${f.calculatedQty || f.qty}`).join(',');
    const currentProductName = currentQualified[0]?.productName;
    const newProductName = newQualified[0]?.productName;
    
    if (currentIds !== newIds || currentProductName !== newProductName) {
      updateCheckoutConfig({ qualifiedFreebies: newQualified });
    }
  }, [currentFreebie, currentCalculatedQty, freebieProduct, checkoutState?.qualifiedFreebies, updateCheckoutConfig]);

  useEffect(() => {
    if (currentFreebie && currentFreebie.itemName) {
      if (freebieProduct && (freebieProduct.id === currentFreebie.itemName || freebieProduct.sku === currentFreebie.itemName)) {
        return; // Cache Guard: หลีกเลี่ยงการยิง Firestore ซ้ำเมื่อเป็นสินค้าของแถมเดิม
      }
      productService.getProduct(currentFreebie.itemName)
        .then(product => {
          if (product) setFreebieProduct(product);
        })
        .catch(e => console.error("Error fetching freebie product", e));
    }
  }, [currentFreebie?.id, currentFreebie?.itemName]);

  if (hidden) return null;
  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5 mb-8 shadow-xs flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-sm w-32"></div>
            <div className="h-3 bg-slate-200 rounded-sm w-24"></div>
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  if (!freebies || freebies.length === 0) return null;

  return (
    <div className="w-full">
      {nextFreebie && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 md:p-5 mb-8 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 opacity-20 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="text-emerald-500 animate-pulse" size={20} />
                <span className="text-xs md:text-sm font-bold text-emerald-800">
                ซื้อเพิ่มอีก <span className="text-emerald-600">{nextFreebie.minQty > 0 && nextFreebie.minSpend === 0 ? `${nextFreebie.minQty - getEligibleTotals(nextFreebie.applicableSkus, nextFreebie.applicableTypes, cartItems, subTotal).qty} ชิ้น` : `฿${(nextFreebie.minSpend - getEligibleTotals(nextFreebie.applicableSkus, nextFreebie.applicableTypes, cartItems, subTotal).subtotal).toLocaleString()}`}</span>
                </span>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1.5 rounded-lg shadow-xs border border-emerald-200 transition-colors hover:bg-emerald-200">
                รับฟรี: {nextFreebie.title}
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${Math.min(nextFreebie.minQty > 0 && nextFreebie.minSpend === 0 ? (getEligibleTotals(nextFreebie.applicableSkus, nextFreebie.applicableTypes, cartItems, subTotal).qty / nextFreebie.minQty) * 100 : (getEligibleTotals(nextFreebie.applicableSkus, nextFreebie.applicableTypes, cartItems, subTotal).subtotal / nextFreebie.minSpend) * 100, 100)}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentFreebie && (
        (() => {
          const isOutOfStock = freebieProduct?.isOutOfStock || (freebieProduct && freebieProduct.stockQuantity < currentFreebie.qty);
          const isQuotaExhausted = currentFreebie.quotaLimit > 0 && currentFreebie.quotaUsed >= currentFreebie.quotaLimit;
          const isUnavailable = isOutOfStock || isQuotaExhausted;
          const statusText = isQuotaExhausted ? 'สิทธิ์ของแถมเต็มแล้ว' : (isOutOfStock ? 'ขออภัย ของแถมหมด' : 'ได้รับของแถมฟรี!');

          return (
            <div className={`rounded-2xl shadow-lg border p-3 flex items-center gap-3 relative overflow-hidden mb-8 transition-transform duration-300 group cursor-default ${
              isUnavailable 
                ? 'shadow-gray-500/10 border-gray-300 bg-linear-to-r from-gray-400 via-slate-400 to-gray-500 opacity-90' 
                : 'shadow-emerald-500/20 border-emerald-400 bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:scale-[1.01]'
            }`}>
              
              {/* Background Effects */}
              {!isUnavailable && (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/4 animate-[pulse_3s_ease-in-out_infinite]"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/4"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 mix-blend-overlay"></div>
                </>
              )}
              {isUnavailable && (
                <div className="absolute inset-0 bg-stripes-gray opacity-10"></div>
              )}

              {/* Product Image Thumbnail */}
              <div className={`w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 relative z-10 shadow-md ${isUnavailable ? 'opacity-70 grayscale' : ''}`}>
                <img loading="lazy" 
                  src={freebieProduct?.imageUrl || '/logo.png'} 
                  alt={freebieProduct?.name || currentFreebie.itemName} 
                  className={`w-full h-full object-contain transition-transform duration-500 ${isUnavailable ? '' : 'group-hover:scale-110'}`}
                  onError={(e) => e.target.src='/logo.png'}
                 loading="lazy" />
              </div>

              {/* Details */}
              <div className="flex-1 relative z-10 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 md:mb-1">
                   <Gift className={`${isUnavailable ? 'text-gray-200' : 'text-emerald-100 animate-bounce'}`} size={14} />
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider ${
                     isUnavailable ? 'text-gray-600 bg-gray-200' : 'text-emerald-700 bg-emerald-100'
                   }`}>
                     {statusText}
                   </span>
                </div>
                <h3 className={`text-sm md:text-base font-bold text-white line-clamp-1 leading-snug drop-shadow-xs pr-2 ${isUnavailable ? 'opacity-80' : ''}`}>
                  {freebieProduct?.name || currentFreebie.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                  <p className={`text-[10px] md:text-xs font-medium font-tech uppercase ${isUnavailable ? 'text-gray-200' : 'text-emerald-100'}`}>
                    SKU: {currentFreebie.itemName}
                  </p>
                  <span className={`w-1 h-1 rounded-full ${isUnavailable ? 'bg-gray-300' : 'bg-emerald-300/50'}`}></span>
                  <p className={`text-[10px] md:text-xs font-bold ${isUnavailable ? 'text-gray-200' : 'text-emerald-50'}`}>
                    จำนวน: {currentCalculatedQty}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="relative z-10 flex flex-col items-end pl-2 shrink-0">
                {freebieProduct?.price ? (
                  <span className={`text-[10px] md:text-xs line-through font-tech font-medium mb-0.5 ${
                    isUnavailable ? 'text-gray-300 decoration-gray-400' : 'text-emerald-200/70 decoration-emerald-400'
                  }`}>
                    ฿{freebieProduct.price.toLocaleString()}
                  </span>
                ) : null}
                <span className={`font-black text-xl md:text-3xl font-tech text-white leading-none drop-shadow-md ${isUnavailable ? 'opacity-80' : ''}`}>
                  {isUnavailable ? 'หมด' : '฿0'}
                </span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default CartFreebieProgress;
