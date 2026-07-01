import React, { useState, useEffect } from 'react';
import { Ticket, Coins, Wallet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export default function PrivilegeSelector({ orderMode = 'retail' }) {
  const { checkoutState, updateCheckoutConfig, totals, cartItems } = useCart();
  const appId = typeof import.meta.env.VITE_FIREBASE_APP_ID !== 'undefined' ? import.meta.env.VITE_FIREBASE_APP_ID : 'dh-notebook-69f3b';

  // 📡 1. ดึงข้อมูลจริงจาก Firebase (Points, Wallet, Promotions, Freebies)
  const [availablePoints, setAvailablePoints] = useState(0);
  const [availableWallet, setAvailableWallet] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [freebies, setFreebies] = useState([]);
  const [customerType, setCustomerType] = useState('RETAIL');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvailablePoints(data.creditPoints || 0);
          setAvailableWallet(data.walletBalance || 0);
          
          let cType = 'RETAIL';
          if (data.customerType === 'VIP') cType = 'VIP';
          else if (data.customerType === 'WHOLESALE' || data.level === 'agent') cType = 'WHOLESALE';
          setCustomerType(cType);
        }
      });

      const promoRef = collection(db, 'promotions');
      const unsubPromo = onSnapshot(promoRef, (snap) => {
        setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const freebieRef = collection(db, 'freebies');
      const unsubFreebie = onSnapshot(freebieRef, (snap) => {
        setFreebies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubUser(); unsubPromo(); unsubFreebie(); };
    }
  }, [appId]);

  // Local States
  const [useWallet, setUseWallet] = useState((checkoutState?.useWallet || 0) > 0);
  
  // Auto-calculation States for UI Display
  const [bestPromo, setBestPromo] = useState(null);
  const [earnedFreebies, setEarnedFreebies] = useState([]);

  // 🛡 2. Auto-Apply Promotions and Freebies based on subtotal
  useEffect(() => {
    const getEligibleTotals = (skus, types) => {
      const items = cartItems || [];
      const hasSkus = skus && skus.length > 0;
      const hasTypes = types && types.length > 0;

      if (!hasSkus && !hasTypes) {
        const fullSubtotal = totals?.subtotal || 0;
        const fullQty = items.reduce((sum, item) => sum + Math.max(1, item.qty || item.quantity || 1), 0);
        return { subtotal: fullSubtotal, qty: fullQty };
      }

      let eligibleSubtotal = 0;
      let eligibleQty = 0;
      items.forEach(item => {
        let isEligible = false;
        const itemSku = String(item.sku || '').toUpperCase();
        const itemType = String(item.type || item.category || '').toUpperCase();

        if (hasSkus && skus.some(s => String(s).toUpperCase() === itemSku)) isEligible = true;
        if (hasTypes && types.some(t => String(t).toUpperCase() === itemType)) isEligible = true;
        
        if (isEligible) {
          const itemPrice = item.price || 0;
          const itemQty = Math.max(1, item.qty || item.quantity || 1);
          eligibleSubtotal += (itemPrice * itemQty);
          eligibleQty += itemQty;
        }
      });
      return { subtotal: eligibleSubtotal, qty: eligibleQty };
    };
    
    // Evaluate Freebies
    const validFreebies = freebies.filter(f => {
      const { subtotal, qty } = getEligibleTotals(f.applicableSkus, f.applicableTypes);

      if (!f.isActive || subtotal <= 0) return false;
      if (f.minSpend && subtotal < f.minSpend) return false;
      if (f.minQty && qty < f.minQty) return false;
      if (f.startDate && new Date(f.startDate) > new Date()) return false;
      if (f.endDate && new Date(f.endDate) < new Date()) return false;
      if (f.quotaLimit && (f.quotaUsed || 0) >= f.quotaLimit) return false;
      if (f.customerType && f.customerType !== 'ALL' && f.customerType !== customerType) return false;
      return true;
    });

    setEarnedFreebies(validFreebies);

    // Evaluate Promotions
    let bestDiscount = 0;
    let selectedPromo = null;

    const validPromos = promotions.filter(p => {
      const { subtotal, qty } = getEligibleTotals(p.applicableSkus, p.applicableTypes);

      if (!p.isActive) return false;
      if (p.minSpend > 0 && subtotal < p.minSpend) return false;
      if (p.minQty > 0 && qty < p.minQty) return false;
      if (p.startDate && new Date(p.startDate) > new Date()) return false;
      if (p.endDate && new Date(p.endDate) < new Date()) return false;
      if (p.quotaLimit && (p.quotaUsed || 0) >= p.quotaLimit) return false;
      if (p.customerType && p.customerType !== 'ALL' && p.customerType !== customerType) return false;
      return true;
    });

    validPromos.forEach(p => {
      const { subtotal } = getEligibleTotals(p.applicableSkus, p.applicableTypes);
      let calc = p.type === 'PERCENTAGE' ? subtotal * (p.value / 100) : p.value;
      if (p.type === 'PERCENTAGE' && p.maxDiscount > 0) {
        calc = Math.min(calc, p.maxDiscount);
      }
      calc = Math.floor(calc);
      if (calc > bestDiscount) {
        bestDiscount = calc;
        selectedPromo = p;
      }
    });

    setBestPromo(selectedPromo);

    // Sync to checkout context
    if (
      checkoutState?.discountAmount !== bestDiscount ||
      JSON.stringify(checkoutState?.qualifiedFreebies) !== JSON.stringify(validFreebies)
    ) {
      updateCheckoutConfig({
        discountAmount: bestDiscount,
        discountCode: selectedPromo ? selectedPromo.title : null,
        appliedPromotions: selectedPromo ? [selectedPromo] : [],
        qualifiedFreebies: validFreebies
      });
    }

  }, [totals?.subtotal, promotions, freebies, customerType, checkoutState?.discountAmount, cartItems, updateCheckoutConfig]);

  // 🛡 3. Wallet Loop Prevention
  useEffect(() => {
    if (useWallet) {
      const remainingTotal = (totals?.subtotal || 0) + (checkoutState?.shippingCost || 0) - (checkoutState?.discountAmount || 0) - (checkoutState?.usePoints || 0);
      const walletToDeduct = Math.min(availableWallet, Math.max(0, remainingTotal));
      
      if (checkoutState?.useWallet !== walletToDeduct) {
        updateCheckoutConfig({ useWallet: walletToDeduct });
      }
    } else if (checkoutState?.useWallet !== 0) {
       updateCheckoutConfig({ useWallet: 0 });
    }
  }, [totals?.subtotal, checkoutState?.shippingCost, checkoutState?.discountAmount, checkoutState?.usePoints, checkoutState?.useWallet, useWallet, availableWallet, updateCheckoutConfig]);

  const handleWalletToggle = (e) => {
    setUseWallet(e.target.checked);
  };

  // 🛡 4. แก้ไขบั๊ก Rendered fewer hooks (ต้องย้าย Early Return มาไว้ล่างสุดเสมอ)
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
        {/* แสดงส่วนลดอัตโนมัติ */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex justify-between">
            โปรโมชั่นที่ได้รับ
            <span className="text-emerald-600">คำนวณอัตโนมัติ</span>
          </label>
          {bestPromo ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-800">{bestPromo.title}</p>
                <p className="text-xs text-emerald-600 mt-0.5">ส่วนลด: ฿{(checkoutState?.discountAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-500 text-center py-1">ยังไม่เข้าเงื่อนไขโปรโมชั่นใดๆ ในขณะนี้</p>
            </div>
          )}
        </div>

        {/* แสดงของแถมอัตโนมัติ */}
        {earnedFreebies.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">ของแถมที่ได้รับ</label>
            <div className="space-y-2">
              {earnedFreebies.map(f => (
                <div key={f.id} className="p-3 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm font-bold text-pink-800">{f.itemName}</span>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-1 rounded-md">
                    x{Math.min(f.qty, f.maxPerBill || f.qty)} ชิ้น
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Credit Points - ปรับ UI ให้มินิมอล เล็กกะทัดรัด */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-gray-400" />
              หัก Credit Point
            </label>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
              ยังไม่รองรับการใช้งาน
            </span>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value=""
              disabled
              placeholder="ยังไม่รองรับการใช้งาน" 
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed outline-none"
            />
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