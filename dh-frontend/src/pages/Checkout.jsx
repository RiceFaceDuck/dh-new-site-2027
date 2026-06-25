import React from 'react';
import { useCheckoutLogic } from '../components/checkout/hooks/useCheckoutLogic';

import AddressSelector from '../components/checkout/AddressSelector';
import ShippingMethod from '../components/checkout/ShippingMethod';
import PaymentMethod from '../components/checkout/PaymentMethod';
import TaxInvoiceForm from '../components/checkout/TaxInvoiceForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import CheckoutSuccess from '../components/checkout/CheckoutSuccess';
import WholesaleRequestModal from '../components/checkout/WholesaleRequestModal';

import CreditToggleBox from '../components/checkout/CreditToggleBox';
import TrustBadges from '../components/checkout/TrustBadges';

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

  // Scroll to top when there's an error so the user sees it immediately
  React.useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

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
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex items-start animate-fade-in">
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
          <div className="lg:col-span-8 space-y-6">
            <AddressSelector 
              selectedData={checkoutState.customerData}
              onUpdate={(data) => handleUpdateCheckoutState('customerData', data)}
              saveProfile={saveProfile}
              onSaveProfileChange={setSaveProfile}
            />
            
            <ShippingMethod 
              selectedMethod={checkoutState.shippingCost}
              onUpdate={(cost) => handleUpdateCheckoutState('shippingCost', cost)}
            />
            
            <TaxInvoiceForm 
              taxData={checkoutState.taxData}
              onUpdate={(data) => handleUpdateCheckoutState('taxData', data)}
            />
            
            <PaymentMethod 
              selectedMethod={checkoutState.paymentMethod}
              onUpdate={(method) => handleUpdateCheckoutState('paymentMethod', method)}
              onSlipChange={setSlipUrl}
            />
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