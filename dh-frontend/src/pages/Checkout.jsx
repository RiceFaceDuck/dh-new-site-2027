import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { ShieldCheck, Truck, Loader2, CreditCard, CheckCircle2, ShieldAlert, User } from 'lucide-react';
import { cartService } from '../firebase/cartService';
import { checkoutService } from '../firebase/checkoutService';

// 🚀 นำเข้า Component ลูกที่แยกไว้
import PrivilegeSelector from '../components/checkout/PrivilegeSelector';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 🌟 State สำหรับแจ้งเตือนแบบ Popup Modal
  const [messageBox, setMessageBox] = useState(null);

  // ข้อมูลการจัดส่งและส่วนลด
  const [contactName, setContactName] = useState(''); // เพิ่มฟิลด์ชื่อผู้รับให้ตรงกับ Database เดิม
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0); 

  const showMessage = (type, text) => {
    setMessageBox({ type, text });
  };

  useEffect(() => {
    const fetchCart = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/profile');
        return;
      }

      // ดึงชื่อผู้ใช้ตั้งต้นมาใส่ให้
      if (user.displayName) {
        setContactName(user.displayName);
      }

      try {
        const cartResponse = await cartService.getCart(user.uid);
        
        // 🛑 [FIX BUG สำคัญ]: ถอดรหัสข้อมูลตะกร้าให้ถูกต้อง ป้องกันการถูกเตะกลับหน้าเดิม
        let extractedItems = [];
        if (cartResponse && cartResponse.items) {
           extractedItems = cartResponse.items; // กรณีข้อมูลเป็น Object { items: [...] }
        } else if (Array.isArray(cartResponse)) {
           extractedItems = cartResponse; // กรณีข้อมูลเป็น Array โดยตรง
        }

        // ถ้ายอดตะกร้าเป็น 0 ถึงจะให้เด้งกลับ
        if (extractedItems.length === 0) {
          navigate('/cart'); 
        } else {
          setCartItems(extractedItems);
        }
      } catch (error) {
        console.error("Error fetching cart for checkout:", error);
        setCartItems([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const subTotal = safeCartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
  const shippingFee = subTotal > 5000 ? 0 : 50; 
  const grandTotal = Math.max(0, subTotal + shippingFee - appliedPoints);

  // 🚀 ฟังก์ชันกดสั่งซื้อ (ผสานการทำงานกับ Transaction Backend เดิมของคุณ)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!contactName || !shippingAddress || !contactPhone) {
      showMessage('error', 'กรุณากรอก ชื่อผู้รับ, ที่อยู่จัดส่ง และเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      // 📦 สร้าง Payload ก้อนใหญ่ ให้ [ตรงสเปค 100%] กับ `checkoutService.js` ของเดิมของคุณ!
      const orderPayload = {
        user: user,
        cartData: { items: safeCartItems, total: subTotal },
        shippingInfo: { 
          address: shippingAddress, 
          phone: contactPhone, 
          fullName: contactName, 
          logisticProvider: 'DH Express' 
        },
        taxInfo: null,
        b2bInfo: null,
        walletUsed: appliedPoints, // 🌟 ส่งแต้มเครดิตไปตัดยอดที่ Transaction หลังบ้าน
        finalPayable: grandTotal,
        slipUrl: null, // โอนเงินสด ยังไม่แนบสลิป
        matchedFreebie: null,
        promoDiscount: 0,
        shippingFee: shippingFee,
        appliedPromos: [],
        saveAddress: true // สั่งให้ Backend อัปเดตที่อยู่ลง Profile อัตโนมัติ
      };

      // ยิงคำสั่งซื้อไปยัง Transaction Service ของคุณ
      const result = await checkoutService.processCheckout(orderPayload);
      
      if (result && result.success) {
        showMessage('success', `สั่งซื้อสำเร็จ! รหัสคำสั่งซื้อ #${result.orderId.substring(0,8).toUpperCase()}`);
      }

    } catch (error) {
      console.error("Checkout error:", error);
      showMessage('error', error.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ หรือยอดเครดิตไม่เพียงพอ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#0870B8]" />
        <p className="font-tech tracking-wider uppercase">Loading Secure Checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-20 relative">
      
      {/* 🌟 Popup Message Box */}
      {messageBox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            {messageBox.type === 'success' ? (
               <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-200">
                 <CheckCircle2 size={32} />
               </div>
            ) : (
               <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-200">
                 <ShieldAlert size={32} />
               </div>
            )}
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {messageBox.type === 'success' ? 'ทำรายการสำเร็จ!' : 'ข้อผิดพลาด'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">{messageBox.text}</p>
            
            <button 
              onClick={() => {
                setMessageBox(null);
                if (messageBox.type === 'success') {
                  navigate('/profile'); // ไปหน้า profile เพื่อส่งสลิปโอนเงิน
                }
              }}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                messageBox.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <ShieldCheck className="text-emerald-500 w-8 h-8" /> 
          Secure Checkout
        </h1>
        <p className="text-sm text-slate-500 mt-1">ยืนยันคำสั่งซื้อและที่อยู่จัดส่งของคุณให้ถูกต้อง</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ซ้าย: ฟอร์มจัดส่ง และ การใช้แต้ม */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* กล่องกรอกข้อมูลจัดส่ง */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="text-[#0870B8] w-5 h-5" /> ข้อมูลการจัดส่ง (Shipping Address)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <User size={14}/> ชื่อผู้รับสินค้า
                  </label>
                  <input 
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ระบุชื่อ-นามสกุล"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ที่อยู่สำหรับจัดส่งแบบสมบูรณ์</label>
                <textarea 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* กล่องส่วนลด (DH Points) */}
          <PrivilegeSelector 
            orderTotal={subTotal + shippingFee} 
            onApplyPoints={(points) => setAppliedPoints(points)} 
          />

          {/* วิธีการชำระเงิน */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="text-[#0870B8] w-5 h-5" /> วิธีการชำระเงิน
            </h2>
            <div className="border-2 border-[#0870B8] bg-[#f8fbff] rounded-xl p-4 flex items-start gap-3 cursor-pointer">
              <div className="w-5 h-5 rounded-full border-4 border-[#0870B8] bg-white flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-bold text-[#0870B8]">โอนเงินผ่านธนาคาร (Bank Transfer)</h4>
                <p className="text-xs text-slate-500 mt-1">หลังจากยืนยันคำสั่งซื้อ กรุณาแนบสลิปการโอนเงินที่หน้าประวัติการสั่งซื้อ (Profile)</p>
              </div>
            </div>
          </div>

        </div>

        {/* ขวา: สรุปยอด และปุ่มสั่งซื้อ */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <CheckoutSummary 
            cartItems={safeCartItems}
            subTotal={subTotal}
            shippingFee={shippingFee}
            discountFromPoints={appliedPoints}
          />
          
          <button 
            onClick={handlePlaceOrder}
            disabled={submitting || safeCartItems.length === 0}
            className="w-full py-4 rounded-xl font-black text-lg tracking-wide text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/30 relative overflow-hidden"
          >
            {submitting ? (
              <><Loader2 size={20} className="animate-spin" /> กำลังดำเนินการ...</>
            ) : (
              <><ShieldCheck size={20} /> ยืนยันคำสั่งซื้อ (Place Order)</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;