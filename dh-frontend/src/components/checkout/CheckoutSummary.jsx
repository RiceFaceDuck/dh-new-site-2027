import { useState, useEffect } from 'react';
import CheckoutSummaryItems from './summary/CheckoutSummaryItems';
import CheckoutSummaryDetails from './summary/CheckoutSummaryDetails';
import CheckoutSummaryActions from './summary/CheckoutSummaryActions';

const CheckoutSummary = ({ 
  cartItems, 
  totals, 
  checkoutState, 
  onPlaceOrder, 
  onRequestWholesale, 
  isSubmitting,
  slipUrl 
}) => {
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // 💎 [NEW] UX for Place Order Button
  const [btnState, setBtnState] = useState('idle'); // 'idle' | 'checking' | 'missing_slip'
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (btnState === 'missing_slip' && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (btnState === 'missing_slip' && countdown === 0) {
      setBtnState('idle');
    }
    return () => clearTimeout(timer);
  }, [btnState, countdown]);

  const handlePlaceOrderClick = async () => {
    if (btnState === 'missing_slip') {
      setBtnState('idle');
      setCountdown(0);
      return;
    }
    
    setBtnState('checking');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (checkoutState?.paymentMethod === 'transfer' && !slipUrl) {
       setBtnState('missing_slip');
       setCountdown(3);
       return;
    }
    
    setBtnState('idle');
    onPlaceOrder();
  };

  // ดึงค่าเบื้องต้น
  const subtotal = totals?.subtotal || 0;
  const shippingCost = checkoutState?.shippingCost || 0;
  const insuranceCost = checkoutState?.insuranceCost || 0;
  
  const appliedPromotions = checkoutState?.appliedPromotions || [];
  const qualifiedFreebies = checkoutState?.qualifiedFreebies || [];
  const extraDiscountAmount = checkoutState?.discountAmount || 0;
  const usedWallet = checkoutState?.useWallet || 0;

  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalDiscount = totalPromoDiscount + extraDiscountAmount;
  const totalCreditDiscount = usedWallet;

  const calculatedNetTotal = Math.max(0, (subtotal - totalDiscount) + shippingCost + insuranceCost - totalCreditDiscount);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          สรุปคำสั่งซื้อ
        </h2>
      </div>

      <div className="p-6">
        <CheckoutSummaryItems cartItems={cartItems} />
        
        <div className="border-t-2 border-dashed border-gray-200 my-5"></div>

        <CheckoutSummaryDetails 
          cartItems={cartItems}
          subtotal={subtotal}
          shippingCost={shippingCost}
          insuranceCost={insuranceCost}
          appliedPromotions={appliedPromotions}
          usedWallet={usedWallet}
          extraDiscountAmount={extraDiscountAmount}
          qualifiedFreebies={qualifiedFreebies}
          calculatedNetTotal={calculatedNetTotal}
        />

        <CheckoutSummaryActions 
          isTermsAccepted={isTermsAccepted}
          setIsTermsAccepted={setIsTermsAccepted}
          isSubmitting={isSubmitting}
          btnState={btnState}
          countdown={countdown}
          handlePlaceOrderClick={handlePlaceOrderClick}
          onRequestWholesale={onRequestWholesale}
        />
      </div>
    </div>
  );
};

export default CheckoutSummary;