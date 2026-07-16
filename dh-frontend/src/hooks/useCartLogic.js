import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase/config';
import { productService } from '../firebase/productService';
import { getCreditSettings, calculateEarnedPoints } from '../firebase/creditService';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartProvider';
import { useToast } from '../context/ToastContext';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const parseSafeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  return isNaN(num) ? 0 : num;
};

export const useCartLogic = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { cartItems, totals, updateQuantity, removeFromCart, checkoutState, updateCheckoutConfig, isInitialized } = useCart();
  
  const [user, setUser] = useState(null);
  const [creditConfig, setCreditConfig] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [freebies, setFreebies] = useState([]);
  const [isFetchingFreebies, setIsFetchingFreebies] = useState(true);
  const [itemErrors, setItemErrors] = useState({});
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [productCache, setProductCache] = useState({});

  const fetchFreebies = async () => {
    try {
      setIsFetchingFreebies(true);
      const q = query(collection(db, getCollectionPath('freebies')), where('isActive', '==', true), limit(100));
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

  const runValidation = useCallback((items, cache) => {
    let errors = {};
    items.forEach(cartItem => {
      const id = (cartItem.id && cartItem.id !== '-') ? cartItem.id : cartItem.sku;
      const fresh = cache[id];
      const currentQty = cartItem.qty || cartItem.quantity || 1;
      
      if (!fresh || fresh.notFound) {
        errors[id] = `สินค้านี้ไม่มีในระบบแล้ว`;
        return;
      }
      
      const buffer = fresh.bufferStock || 0;
      if ((fresh.stockQuantity - currentQty) < buffer) {
        errors[id] = buffer > 0 ? `สินค้าหมดชั่วคราว (ติด Buffer)` : `สินค้าไม่เพียงพอ`;
        return;
      }

      if (fresh.price !== cartItem.price) {
        errors[id] = `ราคามีการเปลี่ยนแปลงเป็น ฿${fresh.price.toLocaleString()}`;
      }
    });
    setItemErrors(errors);
  }, []);

  const fetchAndValidate = useCallback(async (uncachedItems) => {
    setIsValidatingCart(true);
    try {
      const idsToFetch = uncachedItems.map(item => (item.id && item.id !== '-') ? item.id : item.sku).filter(Boolean);
      const freshProductsList = await productService.getProductsByIds(idsToFetch);
      
      const newCache = { ...productCache };
      const freshMap = {};
      freshProductsList.forEach(p => {
        freshMap[p.id] = p;
        if (p.sku) freshMap[p.sku] = p;
      });

      uncachedItems.forEach(item => {
        const id = (item.id && item.id !== '-') ? item.id : item.sku;
        newCache[id] = freshMap[id] || { notFound: true };
      });
      
      setProductCache(newCache);
      runValidation(cartItems, newCache);
    } catch (e) {
      console.error("Cart validation error", e);
    } finally {
      setIsValidatingCart(false);
    }
  }, [cartItems, productCache, runValidation]);

  useEffect(() => {
    if (!isInitialized || cartItems.length === 0) return;

    const uncachedItems = cartItems.filter(item => {
      const id = (item.id && item.id !== '-') ? item.id : item.sku;
      return !productCache[id];
    });

    if (uncachedItems.length > 0 && !isValidatingCart) {
      fetchAndValidate(uncachedItems);
    } else if (Object.keys(productCache).length > 0) {
      runValidation(cartItems, productCache);
    }
    }, [isInitialized, cartItems]);

  const handleUpdateQty = useCallback(async (productId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    if (newQty === 0) {
      const product = cartItems.find(i => ((i.id && i.id !== '-') ? i.id : i.sku) === productId);
      const name = product ? (product.name || product.title || product.productname) : "สินค้านี้";
      setItemToDelete({ id: productId, name });
      return;
    }

    setUpdatingId(productId);
    try {
      await updateQuantity(productId, change);
    } catch (error) {
      console.error("🔥 Error updating quantity:", error);
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    } finally {
      setUpdatingId(null);
    }
  }, [updateQuantity, showToast, cartItems]);

  const handleRemoveItem = useCallback(async (productId) => {
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
      setItemToDelete(null);
    }
  }, [removeFromCart, showToast]);

  const handlePromotionsEvaluated = useCallback((applicablePromotions) => {
    const current = checkoutState.appliedPromotions || [];
    if (JSON.stringify(current) !== JSON.stringify(applicablePromotions)) {
      updateCheckoutConfig({ appliedPromotions: applicablePromotions });
    }
  }, [checkoutState.appliedPromotions, updateCheckoutConfig]);

  const handleProceedToCheckout = async () => {
    setIsValidatingCart(true);
    try {
      const ids = cartItems.map(i => (i.id && i.id !== '-') ? i.id : i.sku).filter(Boolean);
      const uniqueIds = [...new Set(ids)];
      
      const freshProductsList = await productService.getProductsByIds(uniqueIds);
      
      const newCache = { ...productCache };
      const freshMap = {};
      freshProductsList.forEach(p => {
        freshMap[p.id] = p;
        if (p.sku) freshMap[p.sku] = p;
      });

      uniqueIds.forEach(id => {
        newCache[id] = freshMap[id] || { notFound: true };
      });
      
      setProductCache(newCache);
      
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
        
        const buffer = fresh.bufferStock || 0;
        if ((fresh.stockQuantity - currentQty) < buffer) {
          errors[id] = buffer > 0 ? `สินค้าหมดชั่วคราว (ติด Buffer)` : `สินค้าไม่เพียงพอ`;
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
        
        setTimeout(() => {
          const firstErrorId = Object.keys(errors)[0];
          const firstErrorEl = document.getElementById(`cart-item-${firstErrorId}`);
          if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            const fallbackEl = document.querySelector('.border-red-400');
            if (fallbackEl) fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        return;
      }

      navigate('/checkout');
    } catch (e) {
      console.error("Checkout validation error", e);
      showToast("เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่", "error");
    } finally {
      setIsValidatingCart(false);
    }
  };

  const subTotal = parseSafeNumber(totals.subtotal);
  const promoDiscount = (checkoutState.appliedPromotions || []).reduce((sum, p) => sum + (p.discountValue || 0), 0);
  const netTotal = Math.max(0, subTotal - promoDiscount);
  const earnedPoints = creditConfig ? calculateEarnedPoints(netTotal, creditConfig, cartItems) : 0;
  
  const isValidCart = Object.keys(itemErrors).length === 0;

  return {
    user,
    cartItems,
    totals,
    subTotal,
    promoDiscount,
    netTotal,
    earnedPoints,
    isInitialized,
    updatingId,
    freebies,
    isFetchingFreebies,
    itemErrors,
    isValidCart,
    isValidatingCart,
    itemToDelete,
    setItemToDelete,
    productCache,
    checkoutState,
    updateCheckoutConfig,
    handleUpdateQty,
    handleRemoveItem,
    handlePromotionsEvaluated,
    handleProceedToCheckout
  };
};
