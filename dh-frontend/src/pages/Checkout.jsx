import React, { useState, useRef, useEffect } from 'react';
import { useCheckoutLogic } from '../components/checkout/hooks/useCheckoutLogic';
import { useToast } from '../context/ToastContext';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

import AddressSelector from '../components/checkout/AddressSelector';
import ShippingMethod from '../components/checkout/ShippingMethod';
import PaymentMethod from '../components/checkout/PaymentMethod';
import TaxInvoiceForm from '../components/checkout/TaxInvoiceForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import CheckoutSuccess from '../components/checkout/CheckoutSuccess';
import WholesaleRequestModal from '../components/checkout/WholesaleRequestModal';

import CreditToggleBox from '../components/checkout/CreditToggleBox';
import TrustBadges from '../components/checkout/TrustBadges';

// 🚀 Accordion Wrapper Component
const AccordionSection = ({ title, step, activeStep, setActiveStep, isCompleted, children }) => {
  const isOpen = activeStep === step;
  return (
    <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${isOpen ? 'border-emerald-500 shadow-md' : 'border-gray-200 bg-white'}`}>
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-50'}`}
        onClick={() => setActiveStep(isOpen ? null : step)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCompleted ? 'bg-emerald-500 text-white' : (isOpen ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600')}`}>
            {isCompleted ? <CheckCircle2 size={18} /> : step}
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>
      
      {isOpen && (
        <div className="p-4 md:p-6 border-t border-gray-100 bg-white animate-fade-in">
          {children}
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setActiveStep(step + 1)}
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Checkout = () => {
  const {
    user,
    cartItems,
    totals,
    creditBalance,
    creditLoading,
    useCreditToggle,
    setUseCreditToggle,
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

  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const errorRef = useRef(null);

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
          <div ref={errorRef} className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex items-start animate-fade-in">
            <div className="flex-shrink-0">
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
              step={2} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep}
              isCompleted={checkoutState.shippingCost !== null}
            >
              <ShippingMethod 
                selectedMethod={checkoutState.shippingCost}
                onUpdate={(cost) => handleUpdateCheckoutState('shippingCost', cost)}
              />
            </AccordionSection>
            
            <AccordionSection 
              title="ใบกำกับภาษี (ถ้ามี)" 
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
              />
            </AccordionSection>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              
              {/* 💎 [NEW] Gimmick: กล่องเปิด-ปิด การใช้ DH Point แบบ Premium */}
              <CreditToggleBox 
                user={user}
                creditLoading={creditLoading}
                creditBalance={creditBalance}
                useCreditToggle={useCreditToggle}
                setUseCreditToggle={setUseCreditToggle}
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

      {/* Modal ขอราคาส่ง */}
      {isWholesaleModalOpen && (
        <WholesaleRequestModal 
          isOpen={isWholesaleModalOpen}
          onClose={() => setIsWholesaleModalOpen(false)}
          onSubmit={handleSubmitWholesale}
          companyName={checkoutState.customerData?.company || ''}
        />
      )}
    </div>
  );
};

export default Checkout;