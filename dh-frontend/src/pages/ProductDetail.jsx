import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; 
import { cartService } from '../firebase/cartService'; 
import { getCreditSettings, calculateEarnedPoints } from '../firebase/creditService';
import { productService } from '../firebase/productService';
import { footerClientService } from '../firebase/footerClientService';
import { ChevronLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartProvider';
import { useToast } from '../context/ToastContext';
import { memoryCache } from '../utils/memoryCache';

import PartnerSupportBox from '../components/partner/PartnerSupportBox';
import ProductImageSection from '../components/product/ProductImageSection';
import ProductPricingSection from '../components/product/ProductPricingSection';
import ProductKnowledgeSection from '../components/product/ProductKnowledgeSection';
import ProductSpecsSection from '../components/product/ProductSpecsSection';
import ProductCommunitySection from '../components/product/ProductCommunitySection';
import ProductDescriptionSection from '../components/product/ProductDescriptionSection';
import ProductVideoSection from '../components/product/ProductVideoSection';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showVariantError, setShowVariantError] = useState(false);
  const variantTimeoutRef = React.useRef(null);
  const [creditConfig, setCreditConfig] = useState(null); 
  const [footerConfig, setFooterConfig] = useState(null);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 🚀 SMART FETCH: Load product first to prevent UI blocking (With Cache)
        const cacheKey = `product_${id}`;
        const fetchFn = async () => productService.getProduct(id);
        const prod = await memoryCache.getOrFetch(cacheKey, fetchFn, 10 * 60 * 1000);
        
        if (prod) {
          setProduct(prod);
        } else {
          setError("ไม่พบข้อมูลสินค้านี้");
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
      } finally {
        setLoading(false);
      }
    };
    
    // ⚡ Background Fetch for non-critical data
    const fetchNonCriticalData = () => {
      getCreditSettings()
        .then(config => { if (config) setCreditConfig(config); })
        .catch(err => console.error(err));
        
      footerClientService.getFooterConfig()
        .then(fConfig => { if (fConfig) setFooterConfig(fConfig); })
        .catch(err => console.error(err));
    };
    
    fetchAllData();
    fetchNonCriticalData();
  }, [id]);

  const [selectedVariant, setSelectedVariant] = useState(null);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10 px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-6">
            <div className="w-full aspect-square bg-slate-200 animate-pulse rounded-xl mb-4"></div>
            <div className="w-full h-24 bg-slate-200 animate-pulse rounded-xl"></div>
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col gap-4">
            <div className="w-1/4 h-6 bg-slate-200 animate-pulse rounded-md mb-2"></div>
            <div className="w-3/4 h-10 bg-slate-200 animate-pulse rounded-md mb-4"></div>
            <div className="w-1/3 h-12 bg-slate-200 animate-pulse rounded-md mb-6"></div>
            <div className="w-full h-8 bg-slate-200 animate-pulse rounded-md mb-2"></div>
            <div className="w-full h-8 bg-slate-200 animate-pulse rounded-md mb-2"></div>
            <div className="w-2/3 h-8 bg-slate-200 animate-pulse rounded-md mb-6"></div>
            <div className="w-full h-14 bg-slate-200 animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <ShieldAlert size={48} className="mb-4 text-red-400" />
        <p className="font-tech tracking-wider">{error || "PRODUCT NOT FOUND"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" /> BACK TO PRODUCTS
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="flex flex-col bg-white">
            <ProductImageSection product={product._raw || product} imageUrl={product.imageUrl} name={product.name} />
            <div className="hidden md:block flex-1">
              <ProductCommunitySection 
                productId={product.id} 
                reviewCount={product.reviewCount || 0} 
                averageRating={product.averageRating || 0} 
              />
            </div>
          </div>

          <div className="flex flex-col bg-white">
            <ProductPricingSection 
              product={product._raw || product}
              brand={product.brand}
              model={currentProductInfo.id || product.model}
              name={product.name}
              shortDescription={product.shortDescription}
              price={currentProductInfo.price}
              salePrice={currentProductInfo.salePrice}
              isOutOfStock={currentProductInfo.isOutOfStock}
              isLowStock={currentProductInfo.isLowStock}
              creditConfig={creditConfig}
              isAdding={isAdding}
              addSuccess={addSuccess}
              handleAddToCart={handleAddToCart}
              calculateEarnedPoints={calculateEarnedPoints}
              shopeeUrl={product.shopeeUrl}
              lazadaUrl={product.lazadaUrl}
              lineAddFriendUrl={footerConfig?.company?.lineAddFriendUrl}
              variantOptions={product.variantOptions}
              variants={product.variants}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              showVariantError={showVariantError}
            >
              <ProductKnowledgeSection 
                product={product} 
                compatibleModels={product.compatibleModels} 
                compatiblePartNumbers={product.compatiblePartNumbers} 
              />

              <ProductDescriptionSection description={product.fullDescription} />
            </ProductPricingSection>

            {/* 🌟 INTEGRATION ZONE: Partner & Youtube */}
            <div className="bg-slate-50 w-full border-t-2 border-slate-200 shadow-inner overflow-hidden">
              <div className="px-6 md:px-10 pt-4 md:pt-6">
                <PartnerSupportBox />
              </div>
              {product.videoId && (
                <div className="px-6 md:px-10 pb-6 md:pb-8 pt-6 border-t border-slate-200 mt-6">
                  <ProductVideoSection videoId={product.videoId} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📱 MOBILE ONLY: Community Section at the bottom */}
        <div className="block md:hidden border-t border-slate-200 bg-white">
          <ProductCommunitySection 
            productId={product.id} 
            reviewCount={product.reviewCount || 0} 
            averageRating={product.averageRating || 0} 
          />
        </div>

        <ProductSpecsSection 
          specs={product.specs} 
        />

      </div>
    </div>
  );
};

export default ProductDetail;