import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProductDetail } from './hooks/useProductDetail';
import { calculateEarnedPoints } from '../firebase/creditService';
import { ChevronLeft, ShieldAlert, ShoppingCart, CheckCircle2, Zap } from 'lucide-react';

import PartnerSupportBox from '../components/partner/PartnerSupportBox';
import {
  ProductImageSection,
  ProductPricingSection,
  ProductKnowledgeSection,
  ProductSpecsSection,
  ProductCommunitySection,
  ProductDescriptionSection,
  ProductVideoSection,
  RelatedProducts
} from '../components/product';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    product,
    loading,
    error,
    quantity,
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
  } = useProductDetail(id, location.state?.product);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10 px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col md:flex-row">
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-600 bg-slate-50 py-12 px-4 rounded-2xl mx-4 my-8 shadow-xs border border-slate-200">
        <ShieldAlert size={64} className="mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold mb-2 text-slate-700">อ๊ะ! ไม่พบสินค้าที่คุณตามหา</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          สินค้านี้อาจถูกลบไปแล้ว หรือลิงก์ที่คุณเข้าชมอาจไม่ถูกต้อง 
          <br/>ลองค้นหาสินค้าอื่นๆ ที่น่าสนใจแทนไหมครับ?
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-xs">
            ย้อนกลับ
          </button>
          <Link to="/categories" className="px-6 py-2.5 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition-colors shadow-xs">
            เลือกดูสินค้าทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  // สร้าง SEO Schema แบบ JSON-LD สำหรับ Google (Product & BreadcrumbList)
  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product?.name || "อะไหล่โน๊ตบุ๊ค",
    "image": product?.imageUrl ? [product.imageUrl] : [],
    "description": product?.shortDescription || product?.name,
    "sku": currentProductInfo?.sku || currentProductInfo?.id || product?.id,
    "mpn": product?.model || product?.partNumber || currentProductInfo?.sku || product?.id,
    "brand": {
      "@type": "Brand",
      "name": product?.brand || "OEM"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "THB",
      "price": currentProductInfo?.salePrice || currentProductInfo?.price || 0,
      "priceValidUntil": `${new Date().getFullYear() + 1}-12-31`,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": currentProductInfo?.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "DH Notebook"
      }
    },
    ...(product?.reviewCount > 0 && product?.averageRating > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating,
        "reviewCount": product.reviewCount
      }
    } : {})
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "หน้าแรก",
        "item": window.location.origin
      },
      ...(product?.category ? [{
        "@type": "ListItem",
        "position": 2,
        "name": product.category,
        "item": `${window.location.origin}/category/${encodeURIComponent(product.category.toLowerCase())}`
      }] : []),
      {
        "@type": "ListItem",
        "position": product?.category ? 3 : 2,
        "name": product?.name || "รายละเอียดสินค้า",
        "item": window.location.href
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-36 lg:pb-10">
      <Helmet>
        <title>{product?.name || 'รายละเอียดสินค้า'} | DH Notebook</title>
        <meta name="description" content={product?.shortDescription || product?.name || 'รายละเอียดอะไหล่โน๊ตบุ๊คคุณภาพ'} />
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>
      
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

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="flex flex-col bg-white">
            <ProductImageSection product={product} imageUrl={product.imageUrl} name={product.name} />
          </div>

          <div className="flex flex-col bg-white">
            <ProductPricingSection 
              product={product}
              brand={product.brand}
              model={currentProductInfo.id || product.model}
              name={product.name}
              shortDescription={product.shortDescription}
              price={currentProductInfo.price}
              salePrice={currentProductInfo.salePrice}
              isOutOfStock={currentProductInfo.isOutOfStock}
              isLowStock={currentProductInfo.isLowStock}
              availableStock={currentProductInfo.availableStock}
              creditConfig={creditConfig}
              quantity={quantity}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              isAdding={isAdding}
              addSuccess={addSuccess}
              handleAddToCart={handleAddToCart}
              handleBuyNow={handleBuyNow}
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

        <ProductSpecsSection 
          specs={product.specs} 
        />

        {/* 💬 Community & Reviews Section: Unified single mount for 100% quota reduction */}
        <div className="border-t border-slate-200 bg-white">
          <ProductCommunitySection 
            productId={product.id} 
            reviewCount={product.reviewCount || 0} 
            averageRating={product.averageRating || 0} 
          />
        </div>

        {/* 🛍️ Related Products */}
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.category} 
        />
      </div>

      {/* 📱 Mobile Sticky Action Bar (Floats above BottomNav on mobile screens) */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 truncate font-medium">{product.name}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-brand">
              ฿{(currentProductInfo?.salePrice || currentProductInfo?.price || 0).toLocaleString()}
            </span>
            {currentProductInfo?.salePrice && (
              <span className="text-xs text-slate-400 line-through">
                ฿{currentProductInfo?.price?.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={currentProductInfo?.isOutOfStock || isAdding || addSuccess}
            className={`h-10 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              currentProductInfo?.isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : addSuccess
                  ? 'bg-emerald-50 text-cyber-emerald border border-cyber-emerald'
                  : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            {addSuccess ? (
              <><CheckCircle2 size={15} /> ใส่แล้ว</>
            ) : currentProductInfo?.isOutOfStock ? (
              <>สินค้าหมด</>
            ) : (
              <><ShoppingCart size={15} /> ใส่ตะกร้า</>
            )}
          </button>

          {!currentProductInfo?.isOutOfStock && (
            <button
              onClick={handleBuyNow}
              disabled={isAdding}
              className="h-10 px-3.5 rounded-lg font-bold text-xs flex items-center gap-1 bg-brand text-white hover:bg-brand-dark transition-all shadow-xs cursor-pointer"
            >
              <Zap size={14} className="fill-current" />
              ซื้อเลย
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;