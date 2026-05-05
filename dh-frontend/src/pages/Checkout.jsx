import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useOrderConfig } from '../context/OrderContext';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { submitOrder, createWholesaleRequest } from '../firebase/checkoutService';
import { driveService } from '../firebase/driveService';
import { Receipt, AlertCircle, Package, User, Store, CheckCircle2, Coins, Wallet, Loader2 } from 'lucide-react';

import AddressSelector from '../components/checkout/AddressSelector';
import ShippingMethod from '../components/checkout/ShippingMethod';
import TaxInvoiceForm from '../components/checkout/TaxInvoiceForm';
import PrivilegeSelector from '../components/checkout/PrivilegeSelector';
import PaymentMethod from '../components/checkout/PaymentMethod';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import PaymentUploader from '../components/checkout/PaymentUploader';

export default function Checkout() {
  const navigate = useNavigate();
  const appId = typeof import.meta.env.VITE_FIREBASE_APP_ID !== 'undefined' ? import.meta.env.VITE_FIREBASE_APP_ID : 'dh-notebook-69f3b';
  const { cartItems, totals, checkoutState, clearCart, isInitialized } = useCart();
  const { shippingRules: configShippingRules, isConfigLoaded } = useOrderConfig();
  
  const [orderMode, setOrderMode] = useState('retail');
  const { updateCheckoutConfig: updateMode } = useCart();

  useEffect(() => {
    updateMode({ isWholesaleRequest: orderMode === 'wholesale' });
  }, [orderMode, updateMode]);
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Real Firestore Data States
  const [userData, setUserData] = useState({ creditPoints: 0, walletBalance: 0 });
  const isComplete = orderMode === 'retail' 
    ? checkoutState?.addressInfo?.fullName?.length > 2 && checkoutState?.addressInfo?.phone?.length >= 12 && checkoutState?.addressInfo?.address?.length > 10
    : checkoutState?.addressInfo?.companyName?.length > 2 && checkoutState?.addressInfo?.fullName?.length > 2 && checkoutState?.addressInfo?.phone?.length >= 12 && checkoutState?.addressInfo?.address?.length > 10;
  const [shippingRules, setShippingRules] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);

  // 📡 Real-time Fetch: ข้อมูลผู้ใช้ (Points/Wallet) และ กฎการขนส่ง
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ดึง Point/Wallet จริงจาก Profile
        const userRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) setUserData(doc.data());
        }, (err) => console.error("User data fetch error", err));

        setFetchingData(false);
        return () => { unsubUser(); };
      } else {
        setFetchingData(false);
      }
    });
    return () => unsubscribeAuth();
  }, [appId]);

  useEffect(() => {
    if (isConfigLoaded) {
      setShippingRules(configShippingRules);
    }
  }, [isConfigLoaded, configShippingRules]);

  // 📝 Draft Order Persistence: สำรองข้อมูลชั่วคราว
  useEffect(() => {
    const timer = setTimeout(() => {
      if (auth.currentUser && cartItems.length > 0) {
        const draftRef = doc(db, 'users', auth.currentUser.uid, 'drafts', 'current');
        setDoc(draftRef, {
          checkoutState,
          totals,
          lastUpdated: new Date()
        }, { merge: true }).catch(err => console.error("Draft sync error", err));
      }
    }, 1500); // ดีเลย์ 1.5 วิ ป้องกันการยิงถี่เกินไป

    return () => clearTimeout(timer);
  }, [checkoutState, totals, cartItems.length]);

  const handleCheckout = async () => {
    setError('');
    const user = auth.currentUser;
    if (!user) { setError('กรุณาเข้าสู่ระบบก่อนดำเนินการ'); return; }
    
    const addr = checkoutState?.addressInfo;
    if (orderMode === 'retail') {
      if (!addr?.fullName || !addr?.phone || !addr?.address) { setError('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน'); return; }
      if (!slipFile) { setError('กรุณาแนบสลิปหลักฐานการโอนเงิน'); return; }
    } else {
      if (!addr?.companyName) { setError('กรุณากรอกชื่อร้านค้า/ช่าง'); return; }
    }

    setLoading(true);
    try {
      
      if (orderMode === 'retail') {
        const slipUrl = await driveService.uploadSlipImage(slipFile);
        await submitOrder(user, cartItems, checkoutState, totals, slipUrl, true);
      } else {
        await createWholesaleRequest(user, cartItems, { 
          name: addr.fullName, company: addr.companyName, wholesaleNote: checkoutState?.wholesaleNote, note: addr.address 
        }, totals, checkoutState);
      }
      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/'), 3500);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">ทำรายการสำเร็จ!</h2>
        <p className="text-gray-500 mt-2">ระบบได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว</p>
      </div>
    </div>
  );

  // 🛡 แก้ไขปัญหา "ตะกร้าว่าง" ช่วงโหลด: ถ้ายังไม่ initialized หรือกำลังดึงข้อมูล ให้โชว์ Loading แทน
  if (fetchingData || !isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">กำลังตรวจสอบข้อมูลตะกร้า...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-blue-600" />
              ตรวจสอบและชำระเงิน
            </h1>
          </div>
          
          {/* 🤏 ย่อขนาด Credit Point & Wallet ให้เล็กลง (ข้อมูลจริง) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full text-amber-700 shadow-sm hover:shadow transition-shadow">
              <Coins className="w-5 h-5" />
              <span className="text-sm font-bold">{userData.creditPoints?.toLocaleString() || 0} P</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 shadow-sm hover:shadow transition-shadow">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-bold">฿{userData.walletBalance?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-2/3 space-y-5">
            {/* Order Mode Selection */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setOrderMode('retail')} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${orderMode === 'retail' ? 'border-blue-600 bg-blue-50' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                  <User className="w-5 h-5" />
                  <span className="font-bold text-sm">สั่งสินค้าทันที</span>
                </button>
                <button onClick={() => setOrderMode('wholesale')} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${orderMode === 'wholesale' ? 'border-orange-500 bg-orange-50' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                  <Store className="w-5 h-5" />
                  <span className="font-bold text-sm text-left leading-tight">ขอราคาส่ง (ช่าง/ร้านค้า)</span>
                </button>
              </div>
            </div>

            <AddressSelector orderMode={orderMode} />
            {/* ส่ง Shipping Rules จริงเข้าไปแสดงผล */}
            <ShippingMethod orderMode={orderMode} availableRules={shippingRules} />
            {orderMode === 'retail' && <TaxInvoiceForm />}
            <PrivilegeSelector orderMode={orderMode} userPoints={userData.creditPoints} />
            <PaymentMethod orderMode={orderMode} onSlipChange={setSlipFile} />
            {orderMode === 'retail' && !slipFile && <PaymentUploader onUpload={setSlipFile} />}
          </div>

          <div className="w-full lg:w-1/3">
            <CheckoutSummary orderMode={orderMode} loading={loading} isComplete={isComplete} onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  );
}