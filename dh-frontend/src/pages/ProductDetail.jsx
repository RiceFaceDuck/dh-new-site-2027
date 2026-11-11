import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProductDetail } from './hooks/useProductDetail';
import { calculateEarnedPoints } from '../firebase/creditService';
import { ChevronLeft, ShieldAlert, ShoppingCart, CheckCircle2, Zap } from 'lucide-react';
import addToCartImg from '../assets/add-to-cart-btn.png';
import { trackMarketplaceClick } from '../firebase/productAnalyticsService';

import useMediaQuery from '../hooks/useMediaQuery';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
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
        <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-6">
            <div className="w-full aspect-square bg-slate-200 animate-pulse rounded-sm mb-4"></div>
            <div className="w-full h-24 bg-slate-200 animate-pulse rounded-sm"></div>
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-600 bg-slate-50 py-12 px-4 rounded-md mx-4 my-8 shadow-xs border border-slate-200">
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
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-1 lg:pb-10">
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
      
      <nav className="flex items-center flex-wrap text-xs sm:text-sm font-normal text-slate-500 mb-6 bg-white/80 backdrop-blur-xs py-2 px-3.5 rounded-[2px] border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] w-fit">
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
        <span className="text-slate-700 font-normal line-clamp-1 max-w-[200px] sm:max-w-[400px]">
          {product?.name || 'รายละเอียดสินค้า'}
        </span>
      </nav>

      <div className="bg-white rounded-[2px] shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="flex flex-col bg-white">
            <ProductImageSection product={product} imageUrl={product.imageUrl} name={product.name} />
            {isDesktop && (
              <div className="flex-1 flex flex-col md:border-r border-slate-200/60">
                <ProductCommunitySection 
                  productId={product.id} 
                  reviewCount={product.reviewCount || 0} 
                  averageRating={product.averageRating || 0} 
                />
              </div>
            )}
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
              shopeeUrl={product.shopeeUrl || product.externalLinks?.shopee}
              lazadaUrl={product.lazadaUrl || product.externalLinks?.lazada}
              tiktokUrl={product.tiktokUrl || product.externalLinks?.tiktok}
              facebookUrl={product.facebookUrl || product.externalLinks?.facebook}
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

        {/* 💬 Community & Reviews Section: Only rendered at bottom for Mobile/Tablet */}
        {!isDesktop && (
          <div className="border-t border-slate-200 bg-white">
            <ProductCommunitySection 
              productId={product.id} 
              reviewCount={product.reviewCount || 0} 
              averageRating={product.averageRating || 0} 
            />
          </div>
        )}

        {/* 🛍️ Related Products */}
        <RelatedProducts 
          currentProductId={product.id} 
          category={product.category} 
        />
      </div>

      {/* 📱 Mobile Sticky Action Bar (Floats above BottomNav on mobile screens) */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 bg-slate-700/95 backdrop-blur-md border-t border-slate-600 px-4 py-2.5 flex items-center justify-between gap-3 lg:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.2)]">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-100 truncate font-medium">{product.name}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-medium text-amber-300 tracking-tight">
              ฿{(currentProductInfo?.salePrice || currentProductInfo?.price || 0).toLocaleString()}
            </span>
            {currentProductInfo?.salePrice && (
              <span className="text-xs text-slate-300 line-through font-normal">
                ฿{currentProductInfo?.price?.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={currentProductInfo?.isOutOfStock || isAdding || addSuccess}
            className={`h-9 px-2 rounded-md font-bold text-xs flex items-center justify-center transition-all shadow-xs active:scale-[0.98] select-none ${
              currentProductInfo?.isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : addSuccess
                  ? 'bg-[#FFA901] text-black border border-black font-bold px-2.5'
                  : isAdding
                    ? 'bg-[#FFB21A] text-black border border-black font-bold px-2.5'
                    : 'p-0 border-0 bg-transparent hover:scale-[1.02] cursor-pointer'
            }`}
          >
            {isAdding ? (
              <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div> ใส่...</>
            ) : addSuccess ? (
              <><CheckCircle2 size={14} className="mr-1" /> ใส่แล้ว</>
            ) : currentProductInfo?.isOutOfStock ? (
              <>สินค้าหมด</>
            ) : (
              <img 
                src={addToCartImg} 
                alt="+ADD TO CART" 
                className="h-9 w-auto object-contain pointer-events-none drop-shadow-xs" 
              />
            )}
          </button>

          {/* LINE สั่งกับแอดมิน บน Mobile Sticky Action Bar */}
          <a
            href={footerConfig?.company?.lineAddFriendUrl || "https://line.me/ti/p/"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMarketplaceClick('line', product)}
            className="relative inline-flex items-center gap-1.5 px-3 h-9 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-md border-2 border-black shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shrink-0 select-none group"
            title="สั่งซื้อกับแอดมินผ่าน LINE"
          >
            <div className="absolute inset-0 bg-[#06C755] opacity-20 group-hover:opacity-40 blur-md rounded-md transition-opacity duration-300 pointer-events-none"></div>
            <svg viewBox="0 0 24 24" fill="#ffffff" className="w-5 h-5 shrink-0 relative z-10" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            <span className="relative z-10 font-medium text-xs tracking-normal text-white">สั่งกับแอดมิน</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;