import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { submitOrder, createWholesaleRequest } from '../firebase/checkoutService';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// นำเข้า Components ย่อย (อ้างอิงจากโครงสร้างโปรเจกต์)
import AddressSelector from '../components/checkout/AddressSelector';
import ShippingMethod from '../components/checkout/ShippingMethod';
import PaymentMethod from '../components/checkout/PaymentMethod';
import TaxInvoiceForm from '../components/checkout/TaxInvoiceForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import CheckoutSuccess from '../components/checkout/CheckoutSuccess';
import WholesaleRequestModal from '../components/checkout/WholesaleRequestModal';
import PaymentUploader from '../components/checkout/PaymentUploader';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, totals, clearCart } = useCart();
  const [user, setUser] = useState(null);

  // 1. Centralized State (ศูนย์รวมข้อมูลของหน้า Checkout)
  const [checkoutState, setCheckoutState] = useState({
    customerData: null, // ข้อมูลที่อยู่จัดส่ง
    taxData: null, // ข้อมูลใบกำกับภาษี
    paymentMethod: 'transfer', // ค่าเริ่มต้น: โอนเงิน
    shippingCost: 0,
    appliedPromotions: [],
    discountAmount: 0,
    usePoints: 0,
    useWallet: 0,
    wholesaleReason: '', // เหตุผลประกอบการขอราคาส่ง
  });

  const [slipUrl, setSlipUrl] = useState(null);
  const [saveProfile, setSaveProfile] = useState(true); // Default ให้จดจำข้อมูลลง Profile
  
  // 2. UI & UX States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderResult, setOrderResult] = useState(null); // เก็บผลลัพธ์เมื่อสำเร็จ { orderId, isWholesale, message }
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);

  // ตรวจสอบสถานะ User และ ตะกร้าสินค้า
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // บังคับ Login หากยังไม่เข้าระบบ
        navigate('/profile?tab=login', { state: { returnUrl: '/checkout' } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // ป้องกันการเข้าหน้า Checkout เมื่อตะกร้าว่างเปล่า (ยกเว้นเพิ่งสั่งซื้อสำเร็จ)
    if (!orderResult && (!cartItems || cartItems.length === 0)) {
      navigate('/cart');
    }
  }, [cartItems, orderResult, navigate]);

  // Handler: อัปเดตข้อมูลจาก Component ลูก
  const handleUpdateCheckoutState = (key, value) => {
    setCheckoutState((prev) => ({ ...prev, [key]: value }));
    // ลบ Error Message ทิ้งเมื่อผู้ใช้เริ่มแก้ไขข้อมูล
    if (errorMessage) setErrorMessage('');
  };

  // 3. ฟังก์ชันตรวจสอบความถูกต้องก่อนส่ง (Validation)
  const validateOrder = () => {
    if (!checkoutState.customerData) {
      setErrorMessage('กรุณาระบุที่อยู่สำหรับจัดส่งสินค้า');
      return false;
    }
    if (checkoutState.paymentMethod === 'transfer' && !slipUrl) {
      // หมายเหตุ: กรณีระบบอนุญาตให้ส่งออเดอร์ก่อนโอนทีหลังได้ สามารถเอาเงื่อนไขนี้ออกได้
      // แต่เพื่อความสมบูรณ์ แนะนำให้อัปโหลดสลิปก่อน หรือ ให้สถานะเป็น "pending_payment"
    }
    return true;
  };

  // 4. กระแสการสั่งซื้อปกติ
  const handlePlaceOrder = async () => {
    if (!validateOrder()) {
      // เลื่อนหน้าจอขึ้นไปบนสุดเพื่อให้เห็น Error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitOrder(
        user,
        cartItems,
        checkoutState,
        totals,
        slipUrl,
        saveProfile
      );

      if (result.success) {
        clearCart();
        setOrderResult(result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Order Error:", error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. กระแสการขอราคาส่ง
  const handleSubmitWholesale = async (reasonText) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setIsWholesaleModalOpen(false);

    try {
      // อัปเดตเหตุผลลงใน State ก่อนส่ง
      const updatedState = { ...checkoutState, wholesaleReason: reasonText };
      
      const result = await createWholesaleRequest(
        user,
        cartItems,
        updatedState,
        totals
      );

      if (result.success) {
        clearCart();
        setOrderResult({ ...result, isWholesale: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Wholesale Request Error:", error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการส่งคำขอราคาส่ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          {/* Loading Overlay (บังส่วนฟอร์มเมื่อกำลังประมวลผล) */}
          {isSubmitting && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-800 font-medium">กำลังดำเนินการอย่างปลอดภัย...</p>
                <p className="text-xs text-gray-500 mt-1">กรุณาอย่าปิดหน้าต่างนี้</p>
              </div>
            </div>
          )}

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
            />

            {/* แสดง Uploader เมื่อเลือกโอนเงิน */}
            {checkoutState.paymentMethod === 'transfer' && (
              <PaymentUploader 
                onSlipUploaded={setSlipUrl}
                slipUrl={slipUrl}
              />
            )}
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <CheckoutSummary 
                cartItems={cartItems}
                totals={totals}
                checkoutState={checkoutState}
                onPlaceOrder={handlePlaceOrder}
                onRequestWholesale={() => setIsWholesaleModalOpen(true)}
                isSubmitting={isSubmitting}
              />
              
              {/* Trust Badges - ย้ำความเชื่อมั่นก่อนกดชำระเงิน */}
              <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <span className="flex-shrink-0 bg-green-100 p-1.5 rounded-full text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </span>
                  <span>ข้อมูลทั้งหมดถูกเข้ารหัส 256-bit อย่างปลอดภัย</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </span>
                  <span>รับประกันสินค้าคุณภาพโดย DH Notebook</span>
                </div>
              </div>
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