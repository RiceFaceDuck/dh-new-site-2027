import React, { useState, useEffect } from 'react';
// 🚀 [NEW] นำเข้า formatCredit และไอคอน เพื่อยกระดับ UI
import { formatCredit } from '../../firebase/creditService';
import { Award } from 'lucide-react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { parseConsentText } from '../../utils/textParser';
import { productService } from '../../firebase/productService';

const FreebieDisplayName = ({ freebie, className }) => {
  const [productName, setProductName] = useState(freebie.productName || freebie.title || freebie.itemName);

  useEffect(() => {
    if (freebie.itemName) {
      productService.getProduct(freebie.itemName)
        .then(product => {
          if (product && product.name) {
            setProductName(product.name);
          }
        })
        .catch(err => console.error("Error fetching freebie name", err));
    }
  }, [freebie.itemName]);

  return <span className={className || "truncate"} title={productName}>{productName}</span>;
};

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
  const { config } = useCookieConsent();

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
      // Allow user to cancel waiting and reset
      setBtnState('idle');
      setCountdown(0);
      return;
    }
    
    setBtnState('checking');
    
    // Simulate brief checking time for UX
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
  
  // ดึงข้อมูลโปรโมชั่น ของแถม และส่วนลดอื่นๆ
  const appliedPromotions = checkoutState?.appliedPromotions || [];
  const qualifiedFreebies = checkoutState?.qualifiedFreebies || [];
  const extraDiscountAmount = checkoutState?.discountAmount || 0;
  
  // ดึงข้อมูล Credit Point และ Wallet
  const usedWallet = checkoutState?.useWallet || 0;

  // 🧮 การคำนวณยอดเงิน (Real-time Calculation)
  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalDiscount = totalPromoDiscount + extraDiscountAmount;
  const totalCreditDiscount = usedWallet;

  // คำนวณยอดสุทธิขั้นสุดท้าย
  const calculatedNetTotal = Math.max(0, (subtotal - totalDiscount) + shippingCost - totalCreditDiscount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ส่วนหัว */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          สรุปคำสั่งซื้อ
        </h2>
      </div>

      <div className="p-6">
        
        {/* --- ส่วนที่ 1: ส่วนแสดงภาพ และข้อมูลสินค้าในตะกร้า --- */}
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {cartItems?.map((item, index) => (
            <div key={item.id || index} className="flex gap-4 items-start text-sm pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              {/* ภาพสินค้า */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                )}
              </div>
              
              {/* รายละเอียดสินค้า */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">จำนวน: {item.quantity}</p>
                  <p className="font-semibold text-gray-900">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* เส้นคั่น */}
        <div className="border-t-2 border-dashed border-gray-200 my-5"></div>

        {/* --- ส่วนที่ 2: ส่วนการคิดคำนวนค่าใช้จ่าย (ตาม Requirement 1-8) --- */}
        <div className="space-y-3.5 text-sm text-gray-600">
          
          {/* 1. ยอดรวมสินค้า */}
          <div className="flex justify-between items-center">
            <span>1. ยอดรวมสินค้า ({cartItems?.length || 0} รายการ)</span>
            <span className="font-semibold text-gray-900">฿{subtotal.toLocaleString()}</span>
          </div>

          {/* 2. โปรโมชั่น */}
          <div className="flex justify-between items-start">
            <span>2. โปรโมชั่น</span>
            <div className="text-right">
              {appliedPromotions.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {appliedPromotions.map((promo, idx) => (
                    <span key={idx} className="text-green-600 font-medium flex items-center justify-end gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      {promo.name} (-฿{(promo.discountValue || 0).toLocaleString()})
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">฿0</span>
              )}
            </div>
          </div>

          {/* 3. ค่าขนส่ง */}
          <div className="flex justify-between items-center">
            <span>3. ค่าจัดส่ง</span>
            <span className="font-medium text-gray-900">
              ฿{shippingCost.toLocaleString()}
            </span>
          </div>

          {/* 4. vat% */}
          <div className="flex justify-between items-center">
            <span>4. ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
            <span className="text-gray-400 text-xs">รวมในยอดสุทธิแล้ว</span>
          </div>

          {/* 5. ใช้ยอดเงินคงเหลือ */}
          <div className="flex justify-between items-center mt-2">
            <span>5. ใช้ยอดเงินคงเหลือ (Wallet)</span>
            <span className={usedWallet > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>
              {usedWallet > 0 ? `- ฿${formatCredit(usedWallet)}` : '฿0'}
            </span>
          </div>

          {/* 6. ส่วนลดอื่นๆ */}
          <div className="flex justify-between items-center">
            <span>6. ส่วนลดอื่นๆ</span>
            <span className={extraDiscountAmount > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
              {extraDiscountAmount > 0 ? `- ฿${extraDiscountAmount.toLocaleString()}` : '฿0'}
            </span>
          </div>

          {/* 7. ของแถมที่ได้รับ */}
          <div className="flex justify-between items-start pt-2 border-t border-dashed border-gray-200 mt-2 gap-2">
            <span className="whitespace-nowrap shrink-0">7. ของแถมที่ได้รับ</span>
            <div className="text-right flex flex-col items-end gap-1 min-w-0">
              {qualifiedFreebies.length > 0 ? (
                qualifiedFreebies.map((freebie, idx) => {
                  const qty = freebie.quantity || Math.min(freebie.qty, freebie.maxPerBill || freebie.qty) || 1;
                  return (
                    <span key={idx} className="text-emerald-600 font-medium flex items-center justify-end gap-1 max-w-[130px] sm:max-w-[180px]">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <FreebieDisplayName freebie={freebie} className="truncate" />
                      <span className="shrink-0 ml-0.5">x{qty}</span>
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400">ไม่มีของแถม</span>
              )}
            </div>
          </div>

        </div>

        {/* เส้นคั่น */}
        <div className="border-t-2 border-dashed border-gray-200 my-5"></div>

        {/* ยอดสุทธิ */}
        <div className="flex justify-between items-end mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <span className="text-base font-bold text-indigo-950">ยอดชำระสุทธิ</span>
          <div className="text-right">
            {/* 🚀 อัปเดตการแสดงผลให้ใช้ formatCredit รองรับทศนิยม */}
            <span className="text-3xl font-black text-indigo-700">฿{formatCredit(calculatedNetTotal)}</span>
          </div>
        </div>

        {/* 📜 เงื่อนไขการให้บริการ (PDPA / Legal) */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="flex items-center h-5">
              <input 
                id="terms-checkbox"
                type="checkbox" 
                checked={isTermsAccepted}
                onChange={(e) => setIsTermsAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div className="text-sm">
              {config?.consentTexts?.checkout 
                ? parseConsentText(config.consentTexts.checkout, undefined, config?.policyLinks?.privacyPolicyUrl)
                : parseConsentText("ข้าพเจ้าได้อ่านและยอมรับ [terms] และ [privacy] ของบริษัทแล้ว")}
            </div>
          </label>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="space-y-3">
          {/* ปุ่มสั่งซื้อปกติ */}
          <button
            id="place-order-btn"
            onClick={handlePlaceOrderClick}
            disabled={!isTermsAccepted || isSubmitting}

            className={`w-full py-4 px-4 rounded-xl text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2
              ${isSubmitting || btnState === 'checking'
                ? 'bg-indigo-400 cursor-not-allowed' 
                : btnState === 'missing_slip'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                กำลังดำเนินการ...
              </>
            ) : btnState === 'checking' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                กำลังตรวจ
              </>
            ) : btnState === 'missing_slip' ? (
              <>
                ยังไม่ได้รับ สลิปโอน {countdown > 0 ? `(${countdown})` : ''}
              </>
            ) : (
              <>
                สั่งสินค้าทันที
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </>
            )}
          </button>

          {/* ปุ่มขอราคาส่ง */}
          <button
            onClick={onRequestWholesale}
            disabled={!isTermsAccepted || isSubmitting}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2
              ${(!isTermsAccepted || isSubmitting)
                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                : 'border-gray-200 text-gray-700 bg-white hover:border-indigo-600 hover:text-indigo-600 active:scale-[0.98]'
              }`}
          >
            ฉันเป็นร้านช่าง ต้องการ ราคาส่ง
          </button>
        </div>

      </div>
    </div>
  );
};

export default CheckoutSummary;