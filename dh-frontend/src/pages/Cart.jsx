import React, { useState, useEffect } from 'react';
import { calculateEarnedPoints, getCreditSettings, getWalletBalance } from '../firebase/creditService';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { cartService } from '../firebase/cartService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingBag, ChevronLeft, Loader2 } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);
  const [cartData, setCartData] = useState({ items: [], total: 0, totalQty: 0 });
  
  const [creditConfig, setCreditConfig] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [freebies, setFreebies] = useState([]);

  useEffect(() => {
    fetchFreebies();
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchCart(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCart = async (uid) => {
    try {
      const data = await cartService.getCart(uid);
      if (data && Array.isArray(data.items)) {
          setCartData(data);
      } else {
          setCartData({ items: [], total: 0, totalQty: 0 });
      }
    } catch (error) {
      console.error("🔥 Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateQty = async (productId, currentQty, change) => {
    if (!user) return;
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    if (newQty === 0) {
      if (!window.confirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;
    }

    setUpdatingId(productId);
    try {
      if (newQty === 0) {
        await cartService.removeItem(user.uid, productId);
      } else {
        await cartService.updateCartItemQty(user.uid, productId, newQty);
      }
      await fetchCart(user.uid); 
    } catch (error) {
      console.error("🔥 Error updating quantity:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!user) return;
    if (!productId) {
      alert("ไม่พบรหัสอ้างอิงสินค้า (Data Error)");
      return;
    }

    if (!window.confirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;

    setUpdatingId(productId);
    try {
      await cartService.removeItem(user.uid, productId);
      await fetchCart(user.uid);
    } catch (error) {
      console.error("🔥 Error removing item:", error);
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const subTotal = parseSafeNumber(cartData.total);
  const netTotal = Math.max(0, subTotal);
  const earnedPoints = creditConfig ? calculateEarnedPoints(netTotal, creditConfig, cartItems) : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium font-tech animate-pulse">Synchronizing Cart Protocol...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ตะกร้าสินค้าของคุณ</h2>
        <p className="text-gray-500 mb-8 max-w-sm">กรุณาเข้าสู่ระบบเพื่อดูสินค้าในตะกร้า หรือดำเนินการสั่งซื้อต่อ</p>
        <Link to="/profile" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm active:scale-95">
          เข้าสู่ระบบ / สมัครสมาชิก
        </Link>
      </div>
    );
  }

  const items = cartData?.items || [];

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 font-tech uppercase tracking-tight">
          <ShoppingBag className="text-emerald-600" size={28} strokeWidth={2.5} /> 
          Purchase Order <span className="text-lg text-gray-400 font-medium">({cartData.totalQty || 0} Units)</span>
        </h1>
        <button onClick={() => navigate(-1)} className="hidden md:flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> เลือกซื้อสินค้าต่อ
        </button>
      </div>

      <CartFreebieProgress freebies={freebies} subTotal={subTotal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
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