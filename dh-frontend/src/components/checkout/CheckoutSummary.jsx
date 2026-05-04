import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Info, ShoppingBag, Sparkles, Gift, Loader2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function CheckoutSummary({ orderMode = 'retail', loading = false, onCheckout }) {
  const { cartItems, totals, checkoutState } = useCart();
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'dh-notebook-69f3b';

  // 📡 Real-time Fetch: Promotions และ กฎของแถม
  const [promotions, setPromotions] = useState([]);
  const [freebieRules, setFreebieRules] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // ดึงโปรโมชั่นที่ใช้งานอยู่
    const promoRef = collection(db, 'artifacts', appId, 'public', 'data', 'promotions');
    const unsubPromo = onSnapshot(promoRef, (snap) => {
      setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // ดึงกฎของแถม
    const freebieRef = collection(db, 'artifacts', appId, 'public', 'data', 'freebieSettings');
    const unsubFreebie = onSnapshot(freebieRef, (snap) => {
      setFreebieRules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsDataLoaded(true);
    });

    return () => { unsubPromo(); unsubFreebie(); };
  }, [appId]);

  // 🎁 Logic ค้นหาของแถมที่ลูกค้าควรได้รับ (ตัวอย่าง: แถมตามยอดซื้อ)
  const qualifiedFreebies = freebieRules.filter(rule => totals.subtotal >= (rule.minAmount || 0));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24 transition-all duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-blue-600" />
        สรุปคำสั่งซื้อ
      </h2>
      
      {/* รายการสินค้า */}
      <div className="space-y-4 mb-6 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
        {cartItems.length > 0 ? cartItems.map((item) => (
          <div key={item.id} className="flex justify-between items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <div className="w-14 h-14 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center">
              {item.image || item.images?.[0] ? (
                <img src={item.image || item.images?.[0]} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
              <p className="text-xs text-gray-500 mt-1">จำนวน: <span className="font-semibold text-gray-700">{item.quantity}</span> ชิ้น</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">
                ฿{((item.price || 0) * item.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        )) : (
          <p className="text-center py-4 text-sm text-gray-400">กำลังดึงข้อมูลตะกร้า...</p>
        )}
      </div>

      {/* 🚀 Real Promotions & Freebies (สีสันตื่นเต้น) */}
      <div className="mb-6 space-y-3">
        {(promotions.length > 0 || qualifiedFreebies.length > 0) ? (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
            <div className="flex items-center gap-2 mb-2.5 relative z-10">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
              <h3 className="font-bold text-sm text-white tracking-wide uppercase">สิทธิพิเศษที่คุณได้รับ!</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold relative z-10">
              {promotions.filter(p => p.isActive).map(p => (
                <li key={p.id} className="flex items-start gap-2 bg-white/20 p-1.5 rounded-lg border border-white/20">
                  <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                  <span>{p.title || p.description}</span>
                </li>
              ))}
              {qualifiedFreebies.map(f => (
                <li key={f.id} className="flex items-start gap-2 bg-yellow-400/20 p-1.5 rounded-lg border border-yellow-400/30">
                  <Gift className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                  <span>ฟรี! {f.itemName} (เมื่อซื้อครบ {f.minAmount}.-)</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-gray-50 border border-gray-100 text-center flex flex-col items-center justify-center opacity-60">
            <Gift className="w-6 h-6 text-gray-300 mb-2" />
            <p className="text-[10px] font-bold text-gray-400">ยังไม่มีโปรโมชั่นพิเศษในขณะนี้</p>
          </div>
        )}
      </div>

      {/* รายละเอียดค่าใช้จ่าย */}
      <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>มูลค่าสินค้า ({totals.count} ชิ้น)</span>
          <span className="font-medium">฿{totals.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>ค่าจัดส่ง</span>
          <span className={orderMode === 'wholesale' ? 'text-gray-400' : (totals.shipping === 0 ? 'text-emerald-500 font-bold' : 'font-medium')}>
            {orderMode === 'wholesale' ? 'รอประเมิน' : `฿${totals.shipping.toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>ส่วนลดทั้งหมด</span>
          <span className="text-emerald-500 font-medium">{totals.discount > 0 ? `- ฿${totals.discount.toLocaleString()}` : '฿0'}</span>
        </div>
      </div>

      {/* ยอดสุทธิ */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-end">
          <span className="text-base font-bold text-gray-900">{orderMode === 'wholesale' ? 'ยอดรอประเมิน' : 'ยอดชำระสุทธิ'}</span>
          <div className="text-right">
            <span className={`text-2xl tracking-tighter font-black ${orderMode === 'wholesale' ? 'text-gray-400' : 'text-blue-600'}`}>
              {orderMode === 'wholesale' ? `฿${totals.subtotal.toLocaleString()}` : `฿${totals.grandTotal.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={loading || cartItems.length === 0}
        className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
          orderMode === 'wholesale' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:bg-gray-200 disabled:shadow-none`}
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (orderMode === 'wholesale' ? 'ส่งคำร้องขอราคาส่ง' : 'สั่งสินค้าทันที')}
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <CheckCircle2 className="w-5 h-5 text-blue-600" />
      </div>
    </div>
  );
}