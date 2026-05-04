import React, { useState, useEffect } from 'react';
import { Ticket, Coins, Wallet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export default function PrivilegeSelector({ orderMode = 'retail' }) {
  const { checkoutState, updateCheckoutConfig, totals } = useCart();
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'dh-notebook-69f3b';

  // 📡 1. ดึงข้อมูลจริงจาก Firebase (Points, Wallet, Promotions)
  const [availablePoints, setAvailablePoints] = useState(0);
  const [availableWallet, setAvailableWallet] = useState(0);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // ฟังข้อมูล User Profile (Points & Wallet) แบบ Real-time
      const userRef = doc(db, 'users', user.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvailablePoints(data.creditPoints || 0);
          setAvailableWallet(data.walletBalance || 0);
        }
      });

      // ฟังข้อมูลโปรโมชั่นจากฐานข้อมูลกลาง
      const promoRef = collection(db, 'artifacts', appId, 'public', 'data', 'promotions');
      const unsubPromo = onSnapshot(promoRef, (snap) => {
        setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubUser(); unsubPromo(); };
    }
  }, [appId]);

  // Local States
  const [promoCode, setPromoCode] = useState(checkoutState?.discountCode || '');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState(!!checkoutState?.discountCode);
  
  const [pointsInput, setPointsInput] = useState(checkoutState?.usePoints || '');
  const [useWallet, setUseWallet] = useState((checkoutState?.useWallet || 0) > 0);

  // 🛡 2. แก้ไขบั๊ก Infinite Loop (Maximum update depth exceeded)
  useEffect(() => {
    if (useWallet) {
      const remainingTotal = (totals?.subtotal || 0) + (checkoutState?.shippingCost || 0) - (checkoutState?.discountAmount || 0) - (checkoutState?.usePoints || 0);
      const walletToDeduct = Math.min(availableWallet, Math.max(0, remainingTotal));
      
      // อัปเดตเฉพาะเมื่อค่าเปลี่ยนจริงๆ เพื่อป้องกัน Loop
      if (checkoutState?.useWallet !== walletToDeduct) {
        updateCheckoutConfig({ useWallet: walletToDeduct });
      }
    } else if (checkoutState?.useWallet !== 0) {
       updateCheckoutConfig({ useWallet: 0 });
    }
  }, [totals?.subtotal, checkoutState?.shippingCost, checkoutState?.discountAmount, checkoutState?.usePoints, checkoutState?.useWallet, useWallet, availableWallet, updateCheckoutConfig]);

  // 🎟 จัดการโค้ดส่วนลด (เทียบกับ Firebase จริง)
  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess(false);

    if (!promoCode.trim()) {
      setPromoError('กรุณากรอกโค้ดส่วนลด');
      return;
    }

    // หาโปรที่รหัสตรงกัน และเปิดใช้งานอยู่
    const validPromo = promotions.find(p => (p.code || '').toUpperCase() === promoCode.toUpperCase() && p.isActive !== false);

    if (validPromo) {
      if ((totals?.subtotal || 0) < (validPromo.minAmount || 0)) {
        setPromoError(`ต้องมียอดสั่งซื้อขั้นต่ำ ฿${validPromo.minAmount}`);
        return;
      }
      setPromoSuccess(true);
      updateCheckoutConfig({ 
        discountCode: promoCode.toUpperCase(),
        discountAmount: validPromo.discountAmount || 0 
      });
    } else {
      setPromoError('โค้ดส่วนลดไม่ถูกต้อง หรือหมดอายุแล้ว');
      updateCheckoutConfig({ discountCode: null, discountAmount: 0 });
    }
  };

  // 🌟 จัดการ Credit Points
  const handlePointsChange = (e) => {
    let val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    const maxUsable = Math.min(availablePoints, (totals?.subtotal || 0) + (checkoutState?.shippingCost || 0) - (checkoutState?.discountAmount || 0));
    if (val > maxUsable) val = maxUsable;

    setPointsInput(val || '');
    updateCheckoutConfig({ usePoints: val });
  };

  const handleUseMaxPoints = () => {
    const maxUsable = Math.min(availablePoints, (totals?.subtotal || 0) + (checkoutState?.shippingCost || 0) - (checkoutState?.discountAmount || 0));
    setPointsInput(maxUsable);
    updateCheckoutConfig({ usePoints: maxUsable });
  };

  const handleWalletToggle = (e) => {
    setUseWallet(e.target.checked);
  };

  // 🛡 3. แก้ไขบั๊ก Rendered fewer hooks (ต้องย้าย Early Return มาไว้ล่างสุดเสมอ)
  if (orderMode === 'wholesale') {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
        <Ticket className="w-5 h-5 text-blue-600" />
        สิทธิพิเศษและส่วนลด
      </h2>

      <div className="space-y-4">
        {/* โค้ดส่วนลด */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">โค้ดส่วนลด</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoSuccess(false); setPromoError(''); }}
                placeholder="กรอกโค้ดส่วนลด" 
                className={`w-full px-3 py-2.5 text-sm bg-gray-50 border ${promoError ? 'border-red-300' : promoSuccess ? 'border-emerald-300' : 'border-gray-200 focus:border-blue-500'} rounded-xl focus:bg-white transition-all uppercase outline-none`}
              />
              {promoSuccess && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500" />}
              {promoError && <XCircle className="absolute right-3 top-2.5 w-4 h-4 text-red-500" />}
            </div>
            <button 
              type="button"
              onClick={handleApplyPromo}
              disabled={!promoCode || promoSuccess}
              className="px-4 py-2.5 text-sm bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl disabled:bg-gray-300 transition-colors"
            >
              ใช้โค้ด
            </button>
          </div>
          {promoError && <p className="text-[10px] text-red-500 mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {promoError}</p>}
          {promoSuccess && <p className="text-[10px] text-emerald-600 mt-1.5 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> โค้ดถูกใช้งานแล้ว (ลด ฿{(checkoutState?.discountAmount || 0).toLocaleString()})</p>}
        </div>

        <hr className="border-gray-100" />

        {/* Credit Points - ปรับ UI ให้มินิมอล เล็กกะทัดรัด */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              หัก Credit Point
            </label>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              มี: {availablePoints.toLocaleString()} P
            </span>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={pointsInput}
              onChange={handlePointsChange}
              placeholder="ใส่จำนวน Point ที่ต้องการใช้" 
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 transition-all font-medium pr-16 outline-none"
            />
            <button 
              type="button"
              onClick={handleUseMaxPoints}
              className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-bold rounded-lg transition-colors"
            >
              ใช้สูงสุด
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">อัตราแลกเปลี่ยน 1 Point = 1 บาท</p>
        </div>

        {/* Wallet Balance - ปรับ UI เล็กลงและดูเนียนตา */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">จ่ายด้วย Wallet</p>
              <p className="text-[10px] font-medium text-blue-600 mt-0.5">ยอดคงเหลือ: ฿{availableWallet.toLocaleString()}</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={useWallet}
              onChange={handleWalletToggle}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
          </label>
        </div>
      </div>
    </div>
  );
}