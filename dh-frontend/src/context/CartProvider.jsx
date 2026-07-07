import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { cartService } from '../firebase/cartService';

export const CartStateContext = createContext();
export const CartDispatchContext = createContext();

// Legacy Hook (ผสม 2 Contexts เข้าด้วยกันเพื่อความเข้ากันได้ย้อนหลัง)
export const useCart = () => {
  const state = useContext(CartStateContext) || {
    cartItems: [],
    totals: { count: 0, subtotal: 0, shipping: 0, discount: 0, grandTotal: 0, displayTotal: 0 },
    checkoutState: {},
    isInitialized: false,
    isCartOpen: false,
  };
  const dispatch = useContext(CartDispatchContext) || {
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    setIsCartOpen: () => {},
    updateCheckoutConfig: () => {}
  };
  return { ...state, ...dispatch };
};

// ⚡️ Optimized Hooks (ป้องกันการ Re-render)
export const useCartState = () => useContext(CartStateContext);
export const useCartDispatch = () => useContext(CartDispatchContext);

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
  const syncTimeoutRef = React.useRef(null);
  
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
  const [currentUser, setCurrentUser] = useState(null);

  // 🔄 เคลียร์ timeout เมื่อ unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // 🚀 Debounced Background Sync: รวบยอดและหน่วงเวลาการเซฟลง Firestore 500ms
  const syncCartToFirebaseDebounced = useCallback((uid, items) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const totalSummary = items.reduce(
          (acc, item) => {
            acc.total += (item.price || 0) * (item.qty || item.quantity || 0);
            acc.totalQty += (item.qty || item.quantity || 0);
            return acc;
          },
          { total: 0, totalQty: 0 }
        );

        const cartRef = doc(db, 'carts', uid);
        const dbItems = items.map(item => ({
          id: item.id,
          sku: item.sku || '-',
          name: item.name || '',
          price: item.price || 0,
          image: item.image || item.images?.[0] || item.imageUrl || '',
          category: item.category || item.type || '',
          type: item.type || item.category || '',
          qty: item.qty || item.quantity || 1
        }));

        await setDoc(cartRef, {
          uid: uid,
          items: dbItems,
          total: totalSummary.total,
          totalQty: totalSummary.totalQty,
          updatedAt: new Date()
        }, { merge: true });

      } catch (err) {
        console.error("🔥 Debounced Firestore Sync failed:", err);
      }
    }, 500);
  }, []);

  // Sync กับ Firebase
  useEffect(() => {
    let unsubscribeSnapshot = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // บันทึก State ว่ามี User ไหม
      
      if (user) {
        // 🔄 Merge Guest Cart to Firebase on Login
        const savedGuestCart = localStorage.getItem('dh_cart');
        if (savedGuestCart) {
          try {
            const guestItems = JSON.parse(savedGuestCart);
            if (guestItems.length > 0) {
              await cartService.mergeGuestCart(user.uid, guestItems);
              localStorage.removeItem('dh_cart'); // Clear guest cart after merge
            }
          } catch (e) { console.error("Error merging cart", e); }
        }

        // เมื่อ Login แล้วให้ดึงข้อมูลจาก Firebase เป็นหลัก
        const cartRef = doc(db, 'carts', user.uid);
        unsubscribeSnapshot = onSnapshot(cartRef, { includeMetadataChanges: true }, (docSnap) => {
          // 🛡️ หลีกเลี่ยง UI Flicker: ข้ามการอัปเดตหากพบว่ามี writes ค้างในเครื่องของฝั่งเราเอง
          if (docSnap.metadata.hasPendingWrites) return;

          if (docSnap.exists()) {
            const data = docSnap.data();
            // แปลงโครงสร้างให้ตรงกับที่ UI ใช้
            const mappedItems = (data.items || []).map(item => ({
              ...item,
              quantity: item.qty || 1,
              qty: item.qty || 1
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
    // 🔥 ป้องกัน Bug จำนวนทวีคูณ (บันทึกเฉพาะ Guest)
    if (!currentUser) {
      localStorage.setItem('dh_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser]);

  useEffect(() => {
    localStorage.setItem('dh_checkout_state', JSON.stringify(checkoutState));
    setIsInitialized(true); // ยืนยันว่าระบบพร้อมทำงาน
  }, [checkoutState]);

  const addToCart = async (product, quantity = 1) => {
    const user = auth.currentUser;
    
    // ⚡ Optimistic UI Update: เพิ่มรายการในหน่วยความจำทันทีเพื่อให้สเตตตอบสนอง 60 FPS
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newItems;
      
      if (existing) {
        newItems = prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, qty: item.quantity + quantity } 
            : item
        );
      } else {
        const itemToAdd = {
          id: product.id,
          sku: product.sku || '-',
          name: product.name,
          price: product.retailPrice || product.price || 0,
          image: product.image || product.images?.[0] || product.imageUrl || '',
          category: product.category || product.type || '',
          type: product.type || product.category || '',
          qty: quantity,
          quantity: quantity
        };
        newItems = [...prev, itemToAdd];
      }

      if (user) {
        syncCartToFirebaseDebounced(user.uid, newItems);
      }
      return newItems;
    });

    setIsCartOpen(true);
  };

  const removeFromCart = async (productId) => {
    const user = auth.currentUser;
    
    // ⚡ Optimistic UI Update: ลบออกทันที
    setCartItems(prev => {
      const newItems = prev.filter(item => item.id !== productId);
      if (user) {
        syncCartToFirebaseDebounced(user.uid, newItems);
      }
      return newItems;
    });
  };

  const updateQuantity = async (productId, amount) => {
    const user = auth.currentUser;
    
    // ⚡ Optimistic UI Update: ปรับจำนวนสินค้าทันที
    setCartItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(1, (item.qty || item.quantity || 1) + amount);
          return { ...item, quantity: newQty, qty: newQty };
        }
        return item;
      });

      if (user) {
        syncCartToFirebaseDebounced(user.uid, newItems);
      }
      return newItems;
    });
  };

  const updateCheckoutConfig = useCallback((updates) => setCheckoutState(prev => ({ ...prev, ...updates })), []);
  
  const clearCart = async () => {
    const user = auth.currentUser;
    if (user) {
      // เรียกใช้ทันทีโดยไม่รอ await เพื่อความราบรื่น
      cartService.clearCart(user.uid).catch(err => console.error(err));
    }
    setCartItems([]);
    setCheckoutState(defaultCheckoutState);
    localStorage.removeItem('dh_cart');
    localStorage.removeItem('dh_checkout_state');
  };

  // Calculations
  const cartTotalQty = cartItems.reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || item.quantity || 0)), 0);
  const totalDiscount = (checkoutState.discountAmount || 0) + (checkoutState.useWallet || 0);
  const grandTotal = checkoutState.isWholesaleRequest ? 0 : Math.max(0, subtotal + (checkoutState.shippingCost || 0) - totalDiscount);

  // การแยก Context ช่วยหยุดปัญหา God Context (N+1 Re-renders)
  const stateValue = {
    cartItems,
    cartTotalQty,
    cartTotalAmount: subtotal,
    checkoutState,
    isInitialized,
    isCartOpen,
    totals: { count: cartTotalQty, subtotal, shipping: checkoutState.shippingCost || 0, discount: totalDiscount, grandTotal, displayTotal: subtotal }
  };

  const dispatchValue = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setIsCartOpen,
    updateCheckoutConfig
  };

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartDispatchContext.Provider value={dispatchValue}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

export default CartProvider;