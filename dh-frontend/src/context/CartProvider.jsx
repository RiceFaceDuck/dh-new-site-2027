import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { cartService } from '../firebase/cartService';

export const CartContext = createContext();

// Safe Custom Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    return {
      cartItems: [],
      totals: { count: 0, subtotal: 0, shipping: 0, discount: 0, grandTotal: 0, displayTotal: 0 },
      checkoutState: {},
      isInitialized: false
    };
  }
  return context;
};

const defaultCheckoutState = {
  shippingMethod: null,
  shippingCost: 0,
  discountCode: null,
  discountAmount: 0,
  usePoints: 0,
  useWallet: 0,
  isWholesaleRequest: false,
  requestTax: false,
  taxInfo: null,
  note: '',
  wholesaleNote: '',
  appliedPromotions: []
};

export const CartProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ⚡️ บังคับโหลดตะกร้าทันทีที่ Component Mount เพื่อป้องกันบั๊ก "หน้าว่าง"
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('dh_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) { return []; }
  });

  const [checkoutState, setCheckoutState] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_checkout_state');
      return saved ? { ...defaultCheckoutState, ...JSON.parse(saved) } : defaultCheckoutState;
    } catch (e) { return defaultCheckoutState; }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync กับ Firebase
  useEffect(() => {
    let unsubscribeSnapshot = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // เมื่อ Login แล้วให้ดึงข้อมูลจาก Firebase เป็นหลัก
        const cartRef = doc(db, 'carts', user.uid);
        unsubscribeSnapshot = onSnapshot(cartRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // แปลงโครงสร้างให้ตรงกับที่ UI ใช้
            const mappedItems = (data.items || []).map(item => ({
              ...item,
              quantity: item.qty || 1
            }));
            setCartItems(mappedItems);
          } else {
            setCartItems([]);
          }
        });
      } else {
        // ถ้าไม่ได้ Login ใช้ LocalStorage
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        try {
          const savedCart = localStorage.getItem('dh_cart');
          setCartItems(savedCart ? JSON.parse(savedCart) : []);
        } catch (e) { setCartItems([]); }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);


  useEffect(() => {
    localStorage.setItem('dh_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('dh_checkout_state', JSON.stringify(checkoutState));
    setIsInitialized(true); // ยืนยันว่าระบบพร้อมทำงาน
  }, [checkoutState]);

  const addToCart = async (product, quantity = 1) => {
    const user = auth.currentUser;
    if (user) {
      await cartService.addToCart(user.uid, product, quantity);
    } else {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { ...product, quantity }];
      });
    }
    setIsCartOpen(true);
  };

  const removeFromCart = async (productId) => {
    const user = auth.currentUser;
    if (user) {
      await cartService.updateCartItemQty(user.uid, productId, 0);
    } else {
      setCartItems(prev => prev.filter(item => item.id !== productId));
    }
  };
  const updateQuantity = async (productId, amount) => {
    const user = auth.currentUser;
    if (user) {
      const item = cartItems.find(i => i.id === productId);
      if (item) {
        await cartService.updateCartItemQty(user.uid, productId, Math.max(1, (item.qty || item.quantity || 1) + amount));
      }
    } else {
      setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, (item.qty || item.quantity || 1) + amount) } : item));
    }
  };

  const updateCheckoutConfig = useCallback((updates) => setCheckoutState(prev => ({ ...prev, ...updates })), []);
  const clearCart = async () => {
    const user = auth.currentUser;
    if (user) {
      await cartService.clearCart(user.uid);
    }
    setCartItems([]);
    setCheckoutState(defaultCheckoutState);
    localStorage.removeItem('dh_cart');
    localStorage.removeItem('dh_checkout_state');
  };

  // Calculations
  const cartTotalQty = cartItems.reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || item.quantity || 0)), 0);
  const totalDiscount = (checkoutState.discountAmount || 0) + (checkoutState.usePoints || 0) + (checkoutState.useWallet || 0);
  const grandTotal = checkoutState.isWholesaleRequest ? 0 : Math.max(0, subtotal + (checkoutState.shippingCost || 0) - totalDiscount);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen,
      cartTotalQty, cartTotalAmount: subtotal,
      checkoutState, updateCheckoutConfig, isInitialized,
      totals: { count: cartTotalQty, subtotal, shipping: checkoutState.shippingCost || 0, discount: totalDiscount, grandTotal, displayTotal: subtotal }
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;