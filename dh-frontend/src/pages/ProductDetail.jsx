import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductDetail } from './hooks/useProductDetail';
import { calculateEarnedPoints } from '../firebase/creditService';
import { ChevronLeft, ShieldAlert } from 'lucide-react';

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
  
  const navigate = useNavigate();
  
  const {
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
  } = useProductDetail(id);

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

  // สร้าง SEO Schema แบบ JSON-LD สำหรับ Google
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product?.name || "อะไหล่โน๊ตบุ๊ค",
    "image": product?.imageUrl || "",
    "description": product?.shortDescription || product?.name,
    "brand": {
      "@type": "Brand",
      "name": product?.brand || "OEM"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "THB",
      "price": currentProductInfo?.salePrice || currentProductInfo?.price || 0,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": currentProductInfo?.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      <Helmet>
        <title>{product?.name || 'รายละเอียดสินค้า'} | DH Notebook</title>
        <meta name="description" content={product?.shortDescription || product?.name || 'รายละเอียดอะไหล่โน๊ตบุ๊คคุณภาพ'} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
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