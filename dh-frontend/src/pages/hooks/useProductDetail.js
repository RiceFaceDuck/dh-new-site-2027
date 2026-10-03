import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../../firebase/productService';
import { getCreditSettings } from '../../firebase/creditService';
import { footerClientService } from '../../firebase/footerClientService';
import { auth } from '../../firebase/config';
import { useCartDispatch } from '../../context/CartProvider';
import { useToast } from '../../context/ToastContext';
import { trackProductView, trackAddToCart } from '../../firebase/productAnalyticsService';

import { 
  safeJsonParse, 
  resolveEffectiveBuffer, 
  calculateAvailableStock, 
  isProductOutOfStock, 
  isProductLowStock 
} from 'dh-shared';

const parseVariantParam = (raw) => {
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    return safeJsonParse(decodeURIComponent(raw));
  } catch {
    return safeJsonParse(raw);
  }
};

export const useProductDetail = (id, initialData = null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH: Use initialData (from ProductCard) immediately if available
  const [product, setProduct] = useState(initialData);
  const [loading, setLoading] = useState(!initialData); // Don't show loading if we have initialData
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showVariantError, setShowVariantError] = useState(false);
  const variantTimeoutRef = useRef(null);
  const [creditConfig, setCreditConfig] = useState(null); 
  const [footerConfig, setFooterConfig] = useState(null);

  const { addToCart } = useCartDispatch();
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchAllData = () => {
      setLoading(true);
      setError(null);
      
      // 🚀 SMART REAL-TIME FETCH: Listen to changes instantly
      const unsubscribe = productService.subscribeToProduct(id, (prod) => {
        if (prod) {
          setProduct(prod);
        } else {
          setError("ไม่พบข้อมูลสินค้านี้");
        }
        setLoading(false);
      });

      return unsubscribe;
    };
    
    const unsubscribeProduct = fetchAllData();
    
    // ⚡ Background Fetch for non-critical data
    const fetchNonCriticalData = () => {
      // 🛡️ Only authenticated users can read credit_config per firestore.rules
      if (auth.currentUser) {
        getCreditSettings()
          .then(config => { if (config) setCreditConfig(config); })
          .catch(err => console.error("Error fetching credit settings:", err));
      } else {
        // Fallback default config for guests to prevent permission-denied errors
        setCreditConfig({ earningRate: 100, pointsEarningRate: 100 });
      }
        
      footerClientService.getFooterConfig()
        .then(fConfig => { if (fConfig) setFooterConfig(fConfig); })
        .catch(err => console.error(err));
    };
    
    fetchNonCriticalData();

    return () => {
      if (unsubscribeProduct) {
        unsubscribeProduct();
      }
    };
  }, [id]);

  // อ่าน Variant จาก URL (ถ้ามี)
  const [selectedVariant, setSelectedVariantState] = useState(() => parseVariantParam(searchParams.get('variant')));

  const variantParam = searchParams.get('variant');
  
  // 🔄 รีเซ็ตค่าเลือกประเภทสินค้าเมื่อเปลี่ยนหน้าหรือ URL searchParams เปลี่ยนแปลง
  useEffect(() => {
    const currentVariant = parseVariantParam(variantParam);
    setSelectedVariantState(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(currentVariant);
      return isSame ? prev : currentVariant;
    });
  }, [id, variantParam]);

  // อัปเดต URL เมื่อเปลี่ยน Variant (รองรับทั้ง object และ functional updater)
  const setSelectedVariant = (updater) => {
    setSelectedVariantState(prev => {
      const nextVariant = typeof updater === 'function' ? updater(prev) : updater;
      setSearchParams(prevParams => {
        const nextParams = new URLSearchParams(prevParams);
        if (nextVariant && typeof nextVariant === 'object' && Object.keys(nextVariant).length > 0) {
          nextParams.set('variant', JSON.stringify(nextVariant));
        } else {
          nextParams.delete('variant');
        }
        return nextParams;
      }, { replace: true });
      return nextVariant;
    });
  };

  // หา Variant ที่ถูกเลือกจาก Option ปัจจุบัน (เทียบแบบ robust order-agnostic)
  const getSelectedVariantData = () => {
    if (!product?.variants || product.variants.length === 0 || !selectedVariant) return product;
    
    const matched = product.variants.find(v => {
      if (!v.attributes || typeof v.attributes !== 'object') return false;
      const vKeys = Object.keys(v.attributes);
      const selKeys = Object.keys(selectedVariant);
      if (vKeys.length !== selKeys.length) return false;
      return vKeys.every(k => String(v.attributes[k] ?? '').trim().toLowerCase() === String(selectedVariant[k] ?? '').trim().toLowerCase());
    });
    
    if (matched) {
      const variantBuffer = resolveEffectiveBuffer(matched.bufferStock, product.bufferStock);
      const variantAvailable = calculateAvailableStock(matched.stockQuantity, variantBuffer);
      return {
        ...product,
        id: matched.sku || product.id,
        sku: matched.sku || product.id,
        price: matched.retailPrice || matched.price || product.price,
        salePrice: matched.salePrice || null,
        stockQuantity: matched.stockQuantity,
        bufferStock: variantBuffer,
        availableStock: variantAvailable,
        isOutOfStock: isProductOutOfStock(matched.stockQuantity, variantBuffer),
        isLowStock: isProductLowStock(matched.stockQuantity, variantBuffer),
        variantAttributes: matched.attributes
      };
    }
    return product;
  };

  const currentProductInfo = getSelectedVariantData();

  // 📊 GA4 Telemetry: Track product view when product or variant changes
  useEffect(() => {
    if (product && currentProductInfo) {
      trackProductView(product, currentProductInfo);
    }
  }, [product?.id, currentProductInfo?.id]);

  const maxStock = currentProductInfo?.availableStock || 99;
  const increaseQuantity = () => {
    setQuantity(prev => (maxStock > 0 && prev >= maxStock ? prev : prev + 1));
  };
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = async () => {
    // Check if variant selection is complete
    if (product?.variantOptions?.length > 0) {
      if (!selectedVariant || Object.keys(selectedVariant).length !== product.variantOptions.length) {
         setShowVariantError(true);
         if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
         variantTimeoutRef.current = setTimeout(() => setShowVariantError(false), 3000);
         
         // 🚀 AUTO-SCROLL to variant selector to improve UX
         const el = document.getElementById('variant-selector');
         if (el) {
           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
         return;
      }
    }

    setIsAdding(true);
    try {
      // Build a cart item object containing variant details and parentId
      const itemToAdd = {
        ...product,
        id: currentProductInfo.id,
        sku: currentProductInfo.sku || currentProductInfo.id,
        parentId: product.id,
        price: currentProductInfo.price,
        salePrice: currentProductInfo.salePrice,
        variantAttributes: currentProductInfo.variantAttributes || null
      };

      const qtyToAdd = Math.max(1, quantity);
      await addToCart(itemToAdd, qtyToAdd);
      trackAddToCart(product, currentProductInfo, qtyToAdd);
      
      setAddSuccess(true);
      showToast(`เพิ่มสินค้า ${qtyToAdd} ชิ้นลงตะกร้าเรียบร้อยแล้ว!`, 'success');
      
      setTimeout(() => {
        setAddSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Add to cart failed:', err);
      showToast('ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    // Check if variant selection is complete
    if (product?.variantOptions?.length > 0) {
      if (!selectedVariant || Object.keys(selectedVariant).length !== product.variantOptions.length) {
         setShowVariantError(true);
         if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
         variantTimeoutRef.current = setTimeout(() => setShowVariantError(false), 3000);
         
         const el = document.getElementById('variant-selector');
         if (el) {
           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
         return;
      }
    }

    setIsAdding(true);
    try {
      const itemToAdd = {
        ...product,
        id: currentProductInfo.id,
        sku: currentProductInfo.sku || currentProductInfo.id,
        parentId: product.id,
        price: currentProductInfo.price,
        salePrice: currentProductInfo.salePrice,
        variantAttributes: currentProductInfo.variantAttributes || null
      };

      const qtyToAdd = Math.max(1, quantity);
      await addToCart(itemToAdd, qtyToAdd);
      trackAddToCart(product, currentProductInfo, qtyToAdd);
      navigate('/cart');
    } catch (err) {
      console.error('Buy now failed:', err);
      showToast('ไม่สามารถดำเนินการสั่งซื้อได้ กรุณาลองใหม่', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return {
    product,
    loading,
    error,
    quantity,
    setQuantity,
    increaseQuantity,
    decreaseQuantity,
    isAdding,
    addSuccess,
    showVariantError,
    creditConfig,
    footerConfig,
    selectedVariant,
    setSelectedVariant,
    currentProductInfo,
    handleAddToCart,
    handleBuyNow
  };
};
