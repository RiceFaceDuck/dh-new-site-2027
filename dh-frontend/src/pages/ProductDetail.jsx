import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
import RelatedProducts from '../components/product/RelatedProducts';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const initialVariant = searchParams.get('variant') ? JSON.parse(decodeURIComponent(searchParams.get('variant'))) : null;
  const [selectedVariant, setSelectedVariantState] = useState(initialVariant);

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-600 bg-slate-50 py-12 px-4 rounded-2xl mx-4 my-8 shadow-sm border border-slate-200">
        <ShieldAlert size={64} className="mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold mb-2 text-slate-700">อ๊ะ! ไม่พบสินค้าที่คุณตามหา</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          สินค้านี้อาจถูกลบไปแล้ว หรือลิงก์ที่คุณเข้าชมอาจไม่ถูกต้อง 
          <br/>ลองค้นหาสินค้าอื่นๆ ที่น่าสนใจแทนไหมครับ?
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            ย้อนกลับ
          </button>
          <Link to="/categories" className="px-6 py-2.5 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
            เลือกดูสินค้าทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      
      <nav className="flex items-center flex-wrap text-sm font-medium text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 w-fit">
        <Link 
          to="/" 
          className="hover:text-brand transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={16} /> หน้าแรก
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        {product?.category && (
          <>
            <Link 
              to={`/category/${encodeURIComponent(product.category.toLowerCase())}`} 
              className="hover:text-brand transition-colors"
            >
              {product.category}
            </Link>
            <span className="mx-2 text-slate-300">/</span>
          </>
        )}
        <span className="text-slate-700 font-bold line-clamp-1 max-w-[200px] sm:max-w-[400px]">
          {product?.name || 'รายละเอียดสินค้า'}
        </span>
      </nav>

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

            {/* 🌟 INTEGRATION ZONE: Partner */}
            <div className="px-6 md:px-10 pb-4 md:pb-6">
              <PartnerSupportBox />
            </div>

            {/* 🌟 INTEGRATION ZONE: Youtube */}
            {product.videoId && (
              <div className="bg-slate-50 w-full border-t-2 border-slate-200 shadow-inner overflow-hidden">
                <div className="px-6 md:px-10 py-6 md:py-8">
                  <ProductVideoSection videoId={product.videoId} />
                </div>
              </div>
            )}
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

        {/* 🛍️ Related Products */}
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.category} 
        />
      </div>
    </div>
  );
};

export default ProductDetail;