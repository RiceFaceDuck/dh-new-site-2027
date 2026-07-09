import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../firebase/productService';
import { getCreditSettings } from '../../firebase/creditService';
import { footerClientService } from '../../firebase/footerClientService';
import { useCartDispatch } from '../../context/CartProvider';
import { useToast } from '../../context/ToastContext';

import { safeJsonParse } from 'dh-shared';
export const useProductDetail = (id) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 🧠 SMART FETCH
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

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
      getCreditSettings()
        .then(config => { if (config) setCreditConfig(config); })
        .catch(err => console.error(err));
        
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
  const initialVariant = searchParams.get('variant') ? safeJsonParse(decodeURIComponent(searchParams.get('variant'))) : null;
  const [selectedVariant, setSelectedVariantState] = useState(initialVariant);

  // 🔄 รีเซ็ตค่าเลือกประเภทสินค้าเมื่อเปลี่ยนหน้าหรือ URL searchParams เปลี่ยนแปลง
  useEffect(() => {
    const currentVariant = searchParams.get('variant') ? safeJsonParse(decodeURIComponent(searchParams.get('variant'))) : null;
    setSelectedVariantState(currentVariant);
  }, [id, searchParams]);

  // อัปเดต URL เมื่อเปลี่ยน Variant
  const setSelectedVariant = (newVariant) => {
    setSelectedVariantState(newVariant);
    if (newVariant) {
      setSearchParams({ variant: encodeURIComponent(JSON.stringify(newVariant)) }, { replace: true });
    } else {
      searchParams.delete('variant');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // หา Variant ที่ถูกเลือกจาก Option ปัจจุบัน
  const getSelectedVariantData = () => {
    if (!product?.variants || product.variants.length === 0 || !selectedVariant) return product;
    
    const matched = product.variants.find(v => 
      JSON.stringify(v.attributes) === JSON.stringify(selectedVariant)
    );
    
    if (matched) {
      return {
        ...product,
        id: matched.sku || product.id,
        price: matched.retailPrice || matched.price || product.price,
        salePrice: matched.salePrice || null,
        stockQuantity: matched.stockQuantity,
        isOutOfStock: matched.stockQuantity <= 0,
        isLowStock: matched.stockQuantity > 0 && matched.stockQuantity <= (product.bufferStock || 2),
        variantAttributes: matched.attributes
      };
    }
    return product;
  };

  const currentProductInfo = getSelectedVariantData();

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
      // Build a cart item object containing variant details
      const itemToAdd = {
        ...(product._raw || product),
        id: currentProductInfo.id,
        sku: currentProductInfo.id,
        price: currentProductInfo.price,
        salePrice: currentProductInfo.salePrice,
        variantAttributes: currentProductInfo.variantAttributes || null
      };

      await addToCart(itemToAdd, 1);
      
      setAddSuccess(true);
      showToast('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว!', 'success');
      
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

  return {
    product,
    loading,
    error,
    isAdding,
    addSuccess,
    showVariantError,
    creditConfig,
    footerConfig,
    selectedVariant,
    setSelectedVariant,
    currentProductInfo,
    handleAddToCart
  };
};
