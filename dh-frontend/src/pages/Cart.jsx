import React, { useState, useEffect } from 'react';
import { calculateEarnedPoints, getCreditSettings } from '../firebase/creditService';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingBag, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartProvider';

import CartEmptyState from '../components/cart/CartEmptyState';
import CartFreebieProgress from '../components/cart/CartFreebieProgress';
import CartItemCard from '../components/cart/CartItemCard';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';

const parseSafeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  return isNaN(num) ? 0 : num;
};

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // 🔥 ดึงข้อมูลจาก CartContext (รองรับทั้ง Guest และ User)
  const { cartItems, totals, updateQuantity, removeFromCart, isInitialized } = useCart();
  
  const [creditConfig, setCreditConfig] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [freebies, setFreebies] = useState([]);

  // 🔔 Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchFreebies();
    const loadCreditSettings = async () => {
      try {
        const config = await getCreditSettings();
        setCreditConfig(config);
      } catch (e) {
        console.error(e);
      }
    };
    loadCreditSettings();

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchFreebies = async () => {
    try {
      const q = query(collection(db, 'freebies'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => a.minSpend - b.minSpend);
      setFreebies(items);
    } catch (error) {
      console.error("🔥 Error fetching freebies:", error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleUpdateQty = async (productId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    // ถ้าจำนวนจะเป็น 0 ให้ลบออกแทน แต่ไม่ต้องใช้ window.confirm
    if (newQty === 0) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingId(productId);
    try {
      // เรียกใช้ Context (Optimistic UI ภายใน)
      await updateQuantity(productId, change);
    } catch (error) {
      console.error("🔥 Error updating quantity:", error);
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!productId) return;
    setUpdatingId(productId);
    try {
      await removeFromCart(productId);
      showToast("ลบสินค้าออกจากตะกร้าแล้ว", "success");
    } catch (error) {
      console.error("🔥 Error removing item:", error);
      showToast("เกิดข้อผิดพลาดในการลบ: " + error.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const subTotal = parseSafeNumber(totals.subtotal);
  const netTotal = Math.max(0, subTotal);
  const earnedPoints = creditConfig ? calculateEarnedPoints(netTotal, creditConfig, cartItems) : 0;

  // จำลอง Loading เพื่อ UX ที่สมูท
  if (!isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium font-tech animate-pulse">Synchronizing Cart Protocol...</p>
      </div>
    );
  }

  // 💡 ไม่บังคับ Login อีกต่อไป (Guest สามารถดูตะกร้าได้)
  if (cartItems.length === 0) {
    return (
      <div className="w-full relative">
        {toast.show && (
          <div className="fixed top-20 right-4 md:right-8 z-[100] px-6 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border bg-emerald-50 border-emerald-200 text-emerald-700">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}
        <CartEmptyState />
      </div>
    );
  }

  // ดัดแปลงให้เข้ากับ CartSummaryPanel เดิม
  const cartData = {
    items: cartItems,
    total: totals.subtotal,
    totalQty: totals.count
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500 relative">
      
      {/* 🌟 Toast Notification แทนที่ window.confirm / alert */}
      {toast.show && (
        <div className={`fixed top-20 right-4 md:right-8 z-[100] px-6 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle2 size={20} />
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 font-tech uppercase tracking-tight">
          <ShoppingBag className="text-emerald-600" size={28} strokeWidth={2.5} /> 
          Purchase Order <span className="text-lg text-gray-400 font-medium">({totals.count || 0} Units)</span>
        </h1>
        <button onClick={() => navigate(-1)} className="hidden md:flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> เลือกซื้อสินค้าต่อ
        </button>
      </div>

      <CartFreebieProgress freebies={freebies} subTotal={subTotal} />

      {!user && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-800">คุณยังไม่ได้เข้าสู่ระบบ</h3>
            <p className="text-sm text-blue-600">เข้าสู่ระบบตอนนี้เพื่อสะสมแต้มและรับสิทธิพิเศษมากมาย</p>
          </div>
          <Link to="/profile" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            เข้าสู่ระบบ
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => (
            <CartItemCard 
              key={item.id || index}
              item={item}
              index={index}
              updatingId={updatingId}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <CartSummaryPanel 
            cartData={cartData}
            currentUser={user}
            subTotal={subTotal}
            netTotal={netTotal}
            earnedPoints={earnedPoints}
          />
        </div>

      </div>
    </div>
  );
};

export default Cart;