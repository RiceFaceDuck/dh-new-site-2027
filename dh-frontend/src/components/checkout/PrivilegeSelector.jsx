import { useState, useEffect, useMemo } from 'react';
import { Ticket, Coins, Wallet, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { usePromotions } from '../../hooks/usePromotions';
import { db, auth } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { trackPromotionSelect } from '../../firebase/promotionAnalyticsService';

// 🚀 Quota Optimization: Shared Singleton Listener to prevent re-subscribing on remount
let cachedUserData = null;
let currentSubscribingUid = null;
let activeUnsub = null;
const profileListeners = new Set();

const subscribeToUserProfile = (uid, callback) => {
  if (!uid) {
    callback(null);
    return () => {};
  }

  profileListeners.add(callback);

  if (cachedUserData && currentSubscribingUid === uid) {
    callback(cachedUserData);
  }

  if (currentSubscribingUid !== uid) {
    if (activeUnsub) activeUnsub();
    currentSubscribingUid = uid;
    const userRef = doc(db, getCollectionPath('users'), uid);
    activeUnsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        cachedUserData = docSnap.data();
        profileListeners.forEach(cb => cb(cachedUserData));
      }
    });
  }

  return () => {
    profileListeners.delete(callback);
    if (profileListeners.size === 0 && activeUnsub) {
      activeUnsub();
      activeUnsub = null;
      currentSubscribingUid = null;
      cachedUserData = null;
    }
  };
};

export default function PrivilegeSelector({ orderMode = 'retail' }) {
  const { checkoutState, updateCheckoutConfig, totals, cartItems } = useCart();
  const appId = typeof import.meta.env.VITE_FIREBASE_APP_ID !== 'undefined' ? import.meta.env.VITE_FIREBASE_APP_ID : 'dh-notebook-69f3b';

  // 📡 1. ดึงข้อมูลผู้ใช้และ Promotions/Freebies
  const [availablePoints, setAvailablePoints] = useState(0);
  const [availableWallet, setAvailableWallet] = useState(0);
  const [customerType, setCustomerType] = useState('RETAIL');

  const { promotions, freebies, isLoading, evaluatePromotion, evaluateFreebie } = usePromotions();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const cleanup = subscribeToUserProfile(user.uid, (data) => {
        if (data) {
          setAvailablePoints(data.creditPoints || 0);
          setAvailableWallet(data.walletBalance || 0);
          
          let cType = 'RETAIL';
          if (data.customerType === 'VIP') cType = 'VIP';
          else if (data.customerType === 'WHOLESALE' || data.level === 'agent') cType = 'WHOLESALE';
          setCustomerType(cType);
        }
      });
      return cleanup;
    }
  }, [appId]);

  // Local States
  const [useWallet, setUseWallet] = useState((checkoutState?.useWallet || 0) > 0);
  
  // 🛡 2. Pure Calculation using useMemo (คำนวณโปรโมชั่นและของแถมแบบ Pure Function)
  const { bestPromo, bestDiscount, validFreebies } = useMemo(() => {
    if (isLoading || !cartItems?.length) {
      return { bestPromo: null, bestDiscount: 0, validFreebies: [] };
    }

    const subtotal = totals?.subtotal || 0;

    // Evaluate Freebies
    const qualifiedFreebies = [];
    freebies.forEach(f => {
      const evalRes = evaluateFreebie(f, cartItems, subtotal, customerType);
      if (evalRes && evalRes.isApplicable) {
        qualifiedFreebies.push({
          ...f,
          qty: evalRes.calculatedQty,
          calculatedQty: evalRes.calculatedQty,
          eligibleQty: evalRes.eligibleQty
        });
      }
    });

    // Evaluate Promotions
    let maxDiscount = 0;
    let selectedPromo = null;

    promotions.forEach(p => {
      const { isApplicable, discountValue } = evaluatePromotion(p, cartItems, subtotal, customerType);
      if (isApplicable && discountValue > maxDiscount) {
        maxDiscount = discountValue;
        selectedPromo = p;
      }
    });

    return {
      bestPromo: selectedPromo,
      bestDiscount: maxDiscount,
      validFreebies: qualifiedFreebies
    };
  }, [isLoading, cartItems, freebies, promotions, totals?.subtotal, customerType, evaluateFreebie, evaluatePromotion]);

  // Primitive hash for freebies to prevent JSON.stringify in dependencies
  const freebiesHash = useMemo(() => {
    return validFreebies.map(f => `${f.id}:${f.calculatedQty || f.qty}`).join(',');
  }, [validFreebies]);

  // 🛡 3. Sync Calculated Promotion to Checkout Context cleanly
  useEffect(() => {
    if (isLoading) return;

    const currentPromoTitle = checkoutState?.discountCode;
    const newPromoTitle = bestPromo ? bestPromo.title : null;
    const currentDiscount = checkoutState?.discountAmount || 0;
    const currentFreebiesHash = (checkoutState?.qualifiedFreebies || []).map(f => `${f.id}:${f.calculatedQty || f.qty}`).join(',');

    if (currentDiscount !== bestDiscount || currentPromoTitle !== newPromoTitle || currentFreebiesHash !== freebiesHash) {
      if (bestPromo && newPromoTitle !== currentPromoTitle) {
        trackPromotionSelect(bestPromo);
      }
      updateCheckoutConfig({
        discountAmount: bestDiscount,
        discountCode: newPromoTitle,
        appliedPromotions: bestPromo ? [bestPromo] : [],
        qualifiedFreebies: validFreebies
      });
    }
  }, [bestDiscount, bestPromo, freebiesHash, isLoading, checkoutState?.discountAmount, checkoutState?.discountCode, checkoutState?.qualifiedFreebies, validFreebies, updateCheckoutConfig]);

  // 🛡 4. Sync Wallet Calculation to Checkout Context
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

  // Early Return
  if (orderMode === 'wholesale') {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 transition-all duration-300 hover:shadow-md">
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
        {validFreebies.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">ของแถมที่ได้รับ</label>
            <div className="space-y-2">
              {validFreebies.map(f => (
                <div key={f.id} className="p-3 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm font-bold text-pink-800">{f.itemName}</span>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-1 rounded-md">
                    x{f.calculatedQty || Math.min(f.qty, f.maxPerBill || f.qty)} ชิ้น
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Credit Points */}
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
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed outline-hidden"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">อัตราแลกเปลี่ยน 1 Point = 1 บาท</p>
        </div>

        {/* Wallet Balance */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-lg shadow-xs text-blue-600">
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
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-xs"></div>
          </label>
        </div>
      </div>
    </div>
  );
}