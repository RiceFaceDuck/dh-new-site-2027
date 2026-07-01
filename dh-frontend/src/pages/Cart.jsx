import React, { useState, useEffect, useRef } from 'react';
import { calculateEarnedPoints, getCreditSettings } from '../firebase/creditService';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { productService } from '../firebase/productService';
import { ShoppingBag, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartProvider';
import { useToast } from '../context/ToastContext';

import CartEmptyState from '../components/cart/CartEmptyState';
import CartFreebieProgress from '../components/cart/CartFreebieProgress';
import CartItemCard from '../components/cart/CartItemCard';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';
import CartActivePromotions from '../components/cart/CartActivePromotions';

const parseSafeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  return isNaN(num) ? 0 : num;
};

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // 🔥 ดึงข้อมูลจาก CartContext (รองรับทั้ง Guest และ User)
  const { cartItems, totals, updateQuantity, removeFromCart, checkoutState, updateCheckoutConfig, isInitialized } = useCart();
  
  const [creditConfig, setCreditConfig] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [freebies, setFreebies] = useState([]);
  const [isFetchingFreebies, setIsFetchingFreebies] = useState(true);
  const [itemErrors, setItemErrors] = useState({});
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  const validatedRef = useRef(false);

  const { showToast } = useToast();

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

  // 🚀 Real-time Cart Validation (เช็คสต๊อกและราคาล่าสุด)
  const [productCache, setProductCache] = useState({});

  useEffect(() => {
    if (!isInitialized || cartItems.length === 0) return;

    // หาว่ามีสินค้าใหม่ที่ยังไม่เคย fetch ไหม (เพื่อประหยัด Read quota)
    const uncachedItems = cartItems.filter(item => {
      const id = (item.id && item.id !== '-') ? item.id : item.sku;
      return !productCache[id];
    });

    if (uncachedItems.length > 0 && !isValidatingCart) {
      fetchAndValidate(uncachedItems);
    } else if (Object.keys(productCache).length > 0) {
      runValidation(cartItems, productCache);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, cartItems]);

  const fetchAndValidate = async (uncachedItems) => {
    setIsValidatingCart(true);
    try {
      const fetchPromises = uncachedItems.map(item => {
        const productId = (item.id && item.id !== '-') ? item.id : item.sku;
        return productService.getProduct(productId);
      });
      const freshProducts = await Promise.all(fetchPromises);
      
      const newCache = { ...productCache };
      freshProducts.forEach((fresh, idx) => {
        const id = (uncachedItems[idx].id && uncachedItems[idx].id !== '-') ? uncachedItems[idx].id : uncachedItems[idx].sku;
        newCache[id] = fresh || { notFound: true };
      });
      
      setProductCache(newCache);
      runValidation(cartItems, newCache);
    } catch (e) {
      console.error("Cart validation error", e);
    } finally {
      setIsValidatingCart(false);
    }
  };

  const runValidation = (items, cache) => {
    let errors = {};
    items.forEach(cartItem => {
      const id = (cartItem.id && cartItem.id !== '-') ? cartItem.id : cartItem.sku;
      const fresh = cache[id];
      const currentQty = cartItem.qty || cartItem.quantity || 1;
      
      if (!fresh || fresh.notFound) {
        errors[id] = `สินค้านี้ไม่มีในระบบแล้ว`;
        return;
      }
      
      // เช็คสต๊อก
      if (fresh.stockQuantity < currentQty) {
        errors[id] = `สินค้าไม่เพียงพอ`;
        return;
      }

      // เช็คราคาเปลี่ยน
      if (fresh.price !== cartItem.price) {
        errors[id] = `ราคามีการเปลี่ยนแปลงเป็น ฿${fresh.price.toLocaleString()}`;
      }
    });
    setItemErrors(errors);
  };

  const fetchFreebies = async () => {
    try {
      setIsFetchingFreebies(true);
      const q = query(collection(db, 'freebies'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => a.minSpend - b.minSpend);
      setFreebies(items);
    } catch (error) {
      console.error("🔥 Error fetching freebies:", error);
    } finally {
      setIsFetchingFreebies(false);
    }
  };

  const handleUpdateQty = async (productId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    // ถ้าจำนวนจะเป็น 0 ให้ลบออกทันที และขึ้น Toast แดน (ไม่ต้อง Confirm ให้ขัดจังหวะ)
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
  const handlePromotionsEvaluated = (applicablePromotions) => {
    const current = checkoutState.appliedPromotions || [];
    if (JSON.stringify(current) !== JSON.stringify(applicablePromotions)) {
      updateCheckoutConfig({ appliedPromotions: applicablePromotions });
    }
  };

  const subTotal = parseSafeNumber(totals.subtotal);
  const promoDiscount = (checkoutState.appliedPromotions || []).reduce((sum, p) => sum + (p.discountValue || 0), 0);
  const netTotal = Math.max(0, subTotal - promoDiscount);
  const earnedPoints = creditConfig ? calculateEarnedPoints(netTotal, creditConfig, cartItems) : 0;

  // จำลอง Loading เพื่อ UX ที่สมูท
  if (!isInitialized || isValidatingCart) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium font-tech animate-pulse">กำลังโหลดตะกร้าสินค้าของคุณ...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full relative">
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

  const isValidCart = Object.keys(itemErrors).length === 0;

  const handleProceedToCheckout = async () => {
    setIsValidatingCart(true);
    try {
      // ดึงสต๊อกและราคาสดใหม่จาก Database ทันทีก่อนกดสั่งซื้อ
      const ids = cartItems.map(i => (i.id && i.id !== '-') ? i.id : i.sku).filter(Boolean);
      const uniqueIds = [...new Set(ids)];
      
      const fetchPromises = uniqueIds.map(id => productService.getProduct(id));
      const freshProducts = await Promise.all(fetchPromises);
      
      const newCache = { ...productCache };
      freshProducts.forEach((fresh, idx) => {
        newCache[uniqueIds[idx]] = fresh || { notFound: true };
      });
      
      setProductCache(newCache);
      
      // ประเมินผลสดทันทีเพื่อตัดสินใจ Block หรือ Pass
      let hasError = false;
      let errors = {};
      cartItems.forEach(cartItem => {
        const id = (cartItem.id && cartItem.id !== '-') ? cartItem.id : cartItem.sku;
        const fresh = newCache[id];
        const currentQty = cartItem.qty || cartItem.quantity || 1;
        
        if (!fresh || fresh.notFound) {
          errors[id] = `สินค้านี้ไม่มีในระบบแล้ว`;
          hasError = true;
          return;
        }
        
        if (fresh.stockQuantity < currentQty) {
          errors[id] = `สินค้าไม่เพียงพอ`;
          hasError = true;
          return;
        }
  
        if (fresh.price !== cartItem.price) {
          errors[id] = `ราคามีการเปลี่ยนแปลงเป็น ฿${fresh.price.toLocaleString()}`;
          hasError = true;
        }
      });

      setItemErrors(errors);
      
      if (hasError) {
        showToast("สต๊อกหรือราคามีการเปลี่ยนแปลง กรุณาตรวจสอบตะกร้า", "error");
        return; // บล็อคไม่ให้ไปหน้า Checkout
      }

      // ถ้าปลอดภัยทั้งหมด ให้ไปต่อ
      navigate('/checkout');

    } catch (e) {
      console.error("Checkout validation error", e);
      showToast("เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่", "error");
    } finally {
      setIsValidatingCart(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500 relative">
      
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 font-tech uppercase tracking-tight">
          <ShoppingBag className="text-emerald-600" size={28} strokeWidth={2.5} /> 
          Purchase Order <span className="text-lg text-gray-400 font-medium">({totals.count || 0} Units)</span>
        </h1>
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> เลือกซื้อสินค้าต่อ
        </button>
      </div>


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
          {cartItems.map((item, index) => {
            const id = (item.id && item.id !== '-') ? item.id : item.sku;
            const fresh = productCache[id];
            const maxQty = fresh ? fresh.stockQuantity : null;

            return (
              <CartItemCard 
                key={item.id || index}
                item={item}
                index={index}
                updatingId={updatingId}
                itemError={itemErrors[id]}
                maxQty={maxQty}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
              />
            );
          })}

          <div className="mt-4 mb-4">
            <CartFreebieProgress 
              freebies={freebies} 
              subTotal={subTotal} 
              isLoading={isFetchingFreebies} 
              cartItems={cartItems} 
              checkoutState={checkoutState}
              updateCheckoutConfig={updateCheckoutConfig}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <CartSummaryPanel 
            cartData={cartData}
            currentUser={user}
            subTotal={subTotal}
            netTotal={netTotal}
            promoDiscount={promoDiscount}
            earnedPoints={earnedPoints}
            isValidCart={isValidCart}
            onCheckout={handleProceedToCheckout}
            promotionsElement={<CartActivePromotions cartItems={cartItems} subTotal={subTotal} user={user} onPromotionsEvaluated={handlePromotionsEvaluated} />}
          />
        </div>

      </div>
    </div>
  );
};

export default Cart;