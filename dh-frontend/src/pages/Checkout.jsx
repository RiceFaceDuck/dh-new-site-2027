import { useState, useRef, useEffect } from 'react';
import { evaluateShippingRules } from 'dh-shared';
import { useCheckoutLogic } from '../components/checkout/hooks/useCheckoutLogic';
import { useToast } from '../context/ToastContext';
import { useCart } from '../hooks/useCart';
import CartActivePromotions from '../components/cart/CartActivePromotions';
import CartFreebieProgress from '../components/cart/CartFreebieProgress';
import { memoryCache } from '../utils/memoryCache';

import {
  AddressSelector,
  ShippingMethod,
  PaymentMethod,
  TaxInvoiceForm,
  CheckoutSummary,
  CheckoutSuccess,
  WholesaleRequestModal,
  CreditToggleBox,
  TrustBadges
} from '../components/checkout';

import AccordionSection from '../components/checkout/AccordionSection';
const Checkout = () => {
  const {
    user,
    cartItems,
    totals,
    walletBalance,
    walletLoading,
    useWalletToggle,
    setUseWalletToggle,
    checkoutState,
    handleUpdateCheckoutState,
    slipUrl,
    setSlipUrl,
    saveProfile,
    setSaveProfile,
    isSubmitting,
    errorMessage,
    orderResult,
    isWholesaleModalOpen,
    setIsWholesaleModalOpen,
    handlePlaceOrder,
    handleSubmitWholesale
  } = useCheckoutLogic();

  const { updateCheckoutConfig } = useCart();
  const [freebies, setFreebies] = useState([]);
  const [isFetchingFreebies, setIsFetchingFreebies] = useState(true);

  const [shippingRules, setShippingRules] = useState([]);
  const [isFetchingRules, setIsFetchingRules] = useState(true);

  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setIsFetchingFreebies(true);
        setIsFetchingRules(true);

        const fetchFreebiesFn = async () => {
          const { storefrontSettingsService } = await import('../firebase/storefrontSettingsService');
          return await storefrontSettingsService.getActiveFreebies();
        };

        const fetchRulesFn = async () => {
          const { storefrontSettingsService } = await import('../firebase/storefrontSettingsService');
          return await storefrontSettingsService.getActiveShippingRules();
        };

        const [cachedFreebies, cachedRules] = await Promise.all([
          memoryCache.getOrFetch('active_freebies', fetchFreebiesFn, 10 * 60 * 1000), // Cache 10 นาที
          memoryCache.getOrFetch('active_shipping_rules', fetchRulesFn, 60 * 60 * 1000) // Cache 1 ชม.
        ]);

        setFreebies(cachedFreebies || []);
        setShippingRules(cachedRules || []);

      } catch (error) {
        console.error("🔥 Error fetching checkout data:", error);
      } finally {
        setIsFetchingFreebies(false);
        setIsFetchingRules(false);
      }
    };

    loadCheckoutData();
  }, []);

  // 🧮 ประเมินราคาจัดส่งและประกันตามกฎ
  const { shippingOptions, insuranceFee } = evaluateShippingRules(cartItems, shippingRules);
  const insuranceCost = insuranceFee || 0;

  // อัปเดตค่าประกันใน checkoutState อัตโนมัติเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (checkoutState.insuranceCost !== insuranceCost) {
      handleUpdateCheckoutState('insuranceCost', insuranceCost);
    }
    }, [insuranceCost, checkoutState.insuranceCost]);

  const handlePromotionsEvaluated = (applicablePromotions) => {
    const current = checkoutState.appliedPromotions || [];
    if (JSON.stringify(current) !== JSON.stringify(applicablePromotions)) {
      updateCheckoutConfig({ appliedPromotions: applicablePromotions });
    }
  };

  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const errorRef = useRef(null);

  // 🧮 คำนวณยอดชำระเงินโอนสุทธิ (ตรงกับตารางสรุปขวา)
  const subtotal = totals?.subtotal || 0;
  const shippingCost = checkoutState?.shippingCost || 0;
  const appliedPromotions = checkoutState?.appliedPromotions || [];
  const extraDiscountAmount = checkoutState?.discountAmount || 0;
  const usedWallet = checkoutState?.useWallet || 0;
  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalDiscount = totalPromoDiscount + extraDiscountAmount;
  const totalCreditDiscount = usedWallet;
  const calculatedNetTotal = Math.max(0, (subtotal - totalDiscount) + shippingCost + insuranceCost - totalCreditDiscount);

  // Show error as a toast instead of forcing a scroll jump, but also scroll to error box
  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errorMessage, showToast]);

  // -------------------------------------------------------------
  // RENDER: หน้า Success (เมื่อสั่งซื้อหรือส่งคำขอสำเร็จ)
  // -------------------------------------------------------------
  if (orderResult) {
    return <CheckoutSuccess result={orderResult} />;
  }

  // -------------------------------------------------------------
  // RENDER: หน้า Checkout ปกติ
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ดำเนินการชำระเงิน</h1>
          <p className="mt-2 text-sm text-gray-500">ตรวจสอบข้อมูลการจัดส่งและรายการสินค้าของคุณ</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div ref={errorRef} className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-xs flex items-start animate-fade-in">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8">
            <AccordionSection 
              title="ที่อยู่จัดส่ง" 
              summary={checkoutState.customerData ? `จัดส่งที่: ${checkoutState.customerData.name || 'ไม่ได้ระบุชื่อ'}` : ''}
              step={1} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              isCompleted={!!checkoutState.customerData}
            >
              <AddressSelector 
                selectedData={checkoutState.customerData}
                onUpdate={(data) => handleUpdateCheckoutState('customerData', data)}
                saveProfile={saveProfile}
                onSaveProfileChange={setSaveProfile}
              />
            </AccordionSection>
            
            <AccordionSection 
              title="วิธีการจัดส่ง" 
              summary={checkoutState.shippingCost !== null ? `ค่าจัดส่ง: ฿${checkoutState.shippingCost}` : ''}
              step={2} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              isCompleted={checkoutState.shippingCost !== null}
            >
              <ShippingMethod 
                selectedMethod={checkoutState.shippingCost}
                onUpdate={(cost) => handleUpdateCheckoutState('shippingCost', cost)}
                availableRules={shippingOptions}
              />
            </AccordionSection>
            
            <AccordionSection 
              title="ใบกำกับภาษี (ถ้ามี)" 
              summary={checkoutState.requestTax && checkoutState.taxData ? `ออกใบกำกับภาษีให้: ${checkoutState.taxData.companyName || ''}` : 'ไม่รับใบกำกับภาษี'}
              step={3} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              isCompleted={checkoutState.requestTax ? !!checkoutState.taxData : true}
            >
              <TaxInvoiceForm 
                taxData={checkoutState.taxData}
                onUpdate={(data) => handleUpdateCheckoutState('taxData', data)}
              />
            </AccordionSection>
            
            <AccordionSection 
              title="วิธีการชำระเงิน" 
              summary={checkoutState.paymentMethod ? `${checkoutState.paymentMethod}` : ''}
              step={4} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              isCompleted={!!checkoutState.paymentMethod}
            >
              <PaymentMethod 
                selectedMethod={checkoutState.paymentMethod}
                onUpdate={(method) => handleUpdateCheckoutState('paymentMethod', method)}
                onSlipChange={setSlipUrl}
                slipUrl={slipUrl}
                calculatedNetTotal={calculatedNetTotal}
              />
            </AccordionSection>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              
              {/* 💰 กล่องเปิด-ปิด การใช้ DH Wallet ยอดเงินค้างในระบบ */}
              <CreditToggleBox 
                user={user}
                walletLoading={walletLoading}
                walletBalance={walletBalance}
                useWalletToggle={useWalletToggle}
                setUseWalletToggle={setUseWalletToggle}
                useWallet={checkoutState.useWallet}
              />

              <CheckoutSummary 
                cartItems={cartItems}
                totals={totals}
                checkoutState={checkoutState}
                onPlaceOrder={handlePlaceOrder}
                onRequestWholesale={() => setIsWholesaleModalOpen(true)}
                isSubmitting={isSubmitting}
                slipUrl={slipUrl}
              />
              
              {/* Trust Badges - ย้ำความเชื่อมั่นก่อนกดชำระเงิน */}
              <TrustBadges />
            </div>
          </div>

        </div>
      </div>

      {/* Background Silent Evaluators for B2B Bails & Retail Discounts */}
      <CartActivePromotions 
        cartItems={cartItems} 
        subTotal={subtotal} 
        user={user} 
        onPromotionsEvaluated={handlePromotionsEvaluated} 
        hidden={true} 
      />
      <CartFreebieProgress 
        freebies={freebies} 
        subTotal={subtotal} 
        isLoading={isFetchingFreebies} 
        cartItems={cartItems} 
        checkoutState={checkoutState}
        updateCheckoutConfig={updateCheckoutConfig}
        hidden={true}
      />

      {/* Modal ขอราคาส่ง */}
      <WholesaleRequestModal 
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
        onSubmit={handleSubmitWholesale}
        companyName={checkoutState.customerData?.company || ''}
      />
    </div>
  );
};

export default Checkout;