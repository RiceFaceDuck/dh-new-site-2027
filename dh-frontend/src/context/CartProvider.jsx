import React, { createContext, useState, useEffect, useContext } from 'react';

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

  useEffect(() => {
    localStorage.setItem('dh_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('dh_checkout_state', JSON.stringify(checkoutState));
    setIsInitialized(true); // ยืนยันว่าระบบพร้อมทำงาน
  }, [checkoutState]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => setCartItems(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId, amount) => {
    setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item));
  };

  const updateCheckoutConfig = (updates) => setCheckoutState(prev => ({ ...prev, ...updates }));
  const clearCart = () => {
    setCartItems([]);
    setCheckoutState(defaultCheckoutState);
    localStorage.removeItem('dh_cart');
    localStorage.removeItem('dh_checkout_state');
  };

  // Calculations
  const cartTotalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
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